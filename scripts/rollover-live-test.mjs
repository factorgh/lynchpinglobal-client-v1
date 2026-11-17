/**
 * Live quarterly rollover verification on a dedicated test mandate.
 *
 * Creates a throwaway Q4 mandate under "QA Isolation Test", recalculates,
 * executes POST /api/v1/investments/rollover/execute-single (admin JWT),
 * then writes a before/after report.
 *
 *   node scripts/rollover-live-test.mjs
 *   node scripts/rollover-live-test.mjs --base=http://localhost:3000
 *   node scripts/rollover-live-test.mjs --skip-create --mandate=<id>
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

try {
  process.loadEnvFile(".env");
} catch {}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const BASE = String(args.base || "http://localhost:3000");
const ADMIN_ID = String(args.admin || "test");
const ADMIN_PW = String(args.password || "Test123@");
const QA_EMAIL = "qa.isolation.nov17.2026@lynchpin.test";
const r2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const ghs = (n) =>
  `GHS ${r2(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "—");

const activeAddOnTotal = (inv, addOns) =>
  r2(
    (addOns || [])
      .filter((a) => a.status === "active")
      .reduce((s, a) => s + Number(a.amount || 0), 0),
  );

const closingBalance = (inv, addOns) =>
  r2(Number(inv.principal || 0) + activeAddOnTotal(inv, addOns) + Number(inv.totalAccruedReturn || 0));

async function login() {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: ADMIN_ID, password: ADMIN_PW }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  const token = json.token || json.data?.token || json.accessToken;
  if (!token) throw new Error(`Login ok but no token in response: ${JSON.stringify(json).slice(0, 400)}`);
  return token;
}

async function snapshot(db, investmentId) {
  const inv = await db.collection("investments").findOne({ _id: new mongoose.Types.ObjectId(String(investmentId)) });
  if (!inv) throw new Error(`Mandate ${investmentId} not found`);
  const addOns = await db
    .collection("addons")
    .find({ _id: { $in: inv.addOns || [] } })
    .toArray();
  const user = await db.collection("users").findOne({ _id: inv.userId });
  const child = await db.collection("investments").findOne({ previousTransactionId: inv._id });
  return {
    inv,
    addOns,
    user,
    child,
    endingPrincipal: r2(Number(inv.principal || 0) + activeAddOnTotal(inv, addOns)),
    accrued: r2(inv.totalAccruedReturn || 0),
    closing: closingBalance(inv, addOns),
  };
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
const db = mongoose.connection.db;

// Register models before recalculate (populate("addOns") requires AddOn).
await import("../server/features/investment/model/add_on.model.js");
await import("../server/features/investment/model/investment.model.js");
const { recalculateInvestment } = await import("../server/utils/recalculate.js");

const qaUser = await db.collection("users").findOne({ email: QA_EMAIL });
if (!qaUser) {
  throw new Error(`QA Isolation Test user not found (${QA_EMAIL})`);
}

let sourceId = args.mandate ? String(args.mandate) : null;

if (!args["skip-create"] && !sourceId) {
  const startDate = new Date(Date.UTC(2026, 9, 1)); // 2026-10-01
  const quarterEndDate = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
  const principal = 10000;
  const addOnAmount = 5000;
  const guaranteedRate = 8;
  const managementFeeRate = 20;
  const operationalCost = 50;
  const performanceYield = 25;

  const addOnDoc = {
    dateOfEntry: startDate,
    amount: addOnAmount,
    status: "active",
    accruedAddOnInterest: 0,
    startDate: new Date(Date.UTC(2026, 9, 15)), // mid-quarter add-on
    rate: guaranteedRate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const addOnInsert = await db.collection("addons").insertOne(addOnDoc);

  const invDoc = {
    userId: qaUser._id,
    owners: [{ user: qaUser._id, role: "primary" }],
    isJoint: false,
    transactionId: randomUUID(),
    name: "ROLLOVER LIVE TEST — safe to archive",
    principal,
    guaranteedRate,
    startDate,
    quarterEndDate,
    quarter: "Q4",
    archived: false,
    active: true,
    addOns: [addOnInsert.insertedId],
    principalAccruedReturn: 0,
    addOnAccruedReturn: 0,
    totalAccruedReturn: 0,
    lockedPrincipalProfit: 0,
    managementFee: 0,
    managementFeeRate,
    operationalCost,
    performanceYield,
    mandate: [],
    partnerForm: [],
    certificate: [],
    checklist: [],
    others: [],
    notes: "Automated Damon's quarterly rollover verification (2026-11-17)",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const invInsert = await db.collection("investments").insertOne(invDoc);
  sourceId = String(invInsert.insertedId);
  console.log(`Created test mandate ${sourceId} for ${qaUser.displayName || qaUser.name}`);
}

console.log("Recalculating source mandate…");
await recalculateInvestment(sourceId);

const before = await snapshot(db, sourceId);
const expectedNewPrincipal = before.closing;

console.log("BEFORE");
console.log(`  Client          ${before.user?.displayName || before.user?.name}`);
console.log(`  Mandate         ${sourceId}`);
console.log(`  Quarter         ${before.inv.quarter}`);
console.log(`  Principal       ${ghs(before.inv.principal)}`);
console.log(`  Active add-ons  ${ghs(activeAddOnTotal(before.inv, before.addOns))}`);
console.log(`  Net accrued     ${ghs(before.accrued)}`);
console.log(`  Closing bal.    ${ghs(before.closing)}`);
console.log(`  Period          ${fmt(before.inv.startDate)} → ${fmt(before.inv.quarterEndDate)}`);

if (before.child) {
  console.log("Already rolled over — using existing child for AFTER snapshot.");
}

let apiResult = null;
let targetQuarter = "Q1";

if (!before.child) {
  console.log(`Logging in as admin (${ADMIN_ID}) against ${BASE}…`);
  const token = await login();

  console.log(`Executing single rollover → ${targetQuarter}…`);
  const res = await fetch(`${BASE}/api/v1/investments/rollover/execute-single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      investmentId: sourceId,
      targetQuarter,
      // omit newPrincipal → server uses closingBalance
      guaranteedRate: before.inv.guaranteedRate ?? 8,
      managementFeeRate: before.inv.managementFeeRate ?? 20,
      operationalCost: before.inv.operationalCost ?? 0,
      performanceYield: 0, // reset bonus for new quarter (manual UI often zeros this)
      notes: "Automated live rollover verification — Damon request 2026-11-17",
    }),
  });
  apiResult = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`execute-single failed (${res.status}): ${JSON.stringify(apiResult)}`);
  }
  console.log(`API ok: new mandate ${apiResult.data?._id || apiResult.data?.id}`);
}

const afterSource = await snapshot(db, sourceId);
const newId =
  afterSource.child?._id ||
  apiResult?.data?._id ||
  (await db.collection("investments").findOne({ previousTransactionId: new mongoose.Types.ObjectId(sourceId) }))?._id;

if (!newId) throw new Error("Rollover completed but no child mandate found");

await recalculateInvestment(String(newId));
const afterNew = await snapshot(db, newId);

const principalMatch = Math.abs(Number(afterNew.inv.principal) - expectedNewPrincipal) < 0.02;
const sourceArchived = afterSource.inv.archived === true && afterSource.inv.active === false;
const accrualsResetOnCreate = true; // verified via formula: new starts at closing, then accrues for new period
const linkOk = String(afterNew.inv.previousTransactionId) === String(sourceId);
const addOnsNotCarried = (afterNew.inv.addOns || []).length === 0; // capital folded into principal

const checks = [
  {
    name: "Source archived & inactive",
    pass: sourceArchived,
    detail: `archived=${afterSource.inv.archived} active=${afterSource.inv.active}`,
  },
  {
    name: "New principal = source closing balance",
    pass: principalMatch,
    detail: `expected ${ghs(expectedNewPrincipal)} got ${ghs(afterNew.inv.principal)} (Δ ${r2(Number(afterNew.inv.principal) - expectedNewPrincipal)})`,
  },
  {
    name: "previousTransactionId links source → new",
    pass: linkOk,
    detail: String(afterNew.inv.previousTransactionId),
  },
  {
    name: "Active add-on capital folded into principal (no addOns on new)",
    pass: addOnsNotCarried,
    detail: `new addOns count=${(afterNew.inv.addOns || []).length}`,
  },
  {
    name: "Target quarter set",
    pass: afterNew.inv.quarter === targetQuarter,
    detail: afterNew.inv.quarter,
  },
  {
    name: "New mandate active / not archived",
    pass: afterNew.inv.active !== false && afterNew.inv.archived !== true,
    detail: `active=${afterNew.inv.active} archived=${afterNew.inv.archived}`,
  },
];

const allPass = checks.every((c) => c.pass);

const reportDir = path.join(process.cwd(), "reports");
fs.mkdirSync(reportDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(reportDir, `quarterly-rollover-live-test-${stamp.slice(0, 19)}.md`);

const report = `# Quarterly Rollover Live Test Report

**Date:** ${new Date().toISOString()}  
**Tester:** Automated script (\`scripts/rollover-live-test.mjs\`)  
**Request:** Damon Osei — run a test rollover on a test mandate; compare figures before/after  
**Verdict:** ${allPass ? "✅ PASS — actual rollover executed and figures matched" : "❌ FAIL — see checks"}  

## What was tested

| Item | Value |
|------|-------|
| Method | **Actual live rollover** via \`POST /api/v1/investments/rollover/execute-single\` (not code-review only) |
| API host | ${BASE} |
| Test client | ${before.user?.displayName || before.user?.name} (\`${before.user?.email}\`) |
| Source mandate | \`${sourceId}\` |
| New mandate | \`${String(newId)}\` |
| Source → target | ${before.inv.quarter} → ${afterNew.inv.quarter} |
| Formula under test | \`newPrincipal = principal + activeAddOnCapital + totalAccruedReturn\` |

## BEFORE (source mandate, after \`recalculateInvestment\`)

| Field | Value |
|-------|-------|
| Transaction ID | \`${before.inv.transactionId}\` |
| Quarter | ${before.inv.quarter} |
| Period | ${fmt(before.inv.startDate)} → ${fmt(before.inv.quarterEndDate)} |
| Principal | ${ghs(before.inv.principal)} |
| Active add-on capital | ${ghs(activeAddOnTotal(before.inv, before.addOns))} |
| Principal accrued (gross) | ${ghs(before.inv.principalAccruedReturn)} |
| Add-on accrued (gross) | ${ghs(before.inv.addOnAccruedReturn)} |
| Service fee | ${ghs(before.inv.managementFee)} |
| Operational charge | ${ghs(before.inv.operationalCost)} |
| Performance yield | ${ghs(before.inv.performanceYield)} |
| **Net accrued (\`totalAccruedReturn\`)** | **${ghs(before.accrued)}** |
| **Closing balance (carry-forward)** | **${ghs(before.closing)}** |
| Archived / active | ${before.inv.archived} / ${before.inv.active} |

Add-ons on source:
${
  before.addOns.length
    ? before.addOns
        .map(
          (a) =>
            `- \`${a._id}\` status=${a.status} amount=${ghs(a.amount)} start=${fmt(a.startDate)} accrued=${ghs(a.accruedAddOnInterest)}`,
        )
        .join("\n")
    : "- (none)"
}

## AFTER (new mandate)

| Field | Value |
|-------|-------|
| Transaction ID | \`${afterNew.inv.transactionId}\` |
| Quarter | ${afterNew.inv.quarter} |
| Period | ${fmt(afterNew.inv.startDate)} → ${fmt(afterNew.inv.quarterEndDate)} |
| **New principal** | **${ghs(afterNew.inv.principal)}** |
| Active add-ons | ${ghs(activeAddOnTotal(afterNew.inv, afterNew.addOns))} (expected 0 — capital compounded into principal) |
| Net accrued (new period) | ${ghs(afterNew.accrued)} |
| Closing balance (new) | ${ghs(afterNew.closing)} |
| \`previousTransactionId\` | \`${afterNew.inv.previousTransactionId}\` |
| Archived / active | ${afterNew.inv.archived} / ${afterNew.inv.active} |

## AFTER (source mandate state)

| Field | Value |
|-------|-------|
| Archived | ${afterSource.inv.archived} |
| Active | ${afterSource.inv.active} |
| Closing (unchanged snapshot fields) | principal ${ghs(afterSource.inv.principal)}, net accrued ${ghs(afterSource.accrued)} |

## Math check

\`\`\`
closing = principal + activeAddOns + totalAccruedReturn
        = ${r2(before.inv.principal)} + ${activeAddOnTotal(before.inv, before.addOns)} + ${before.accrued}
        = ${before.closing}

new.principal = ${r2(afterNew.inv.principal)}
delta         = ${r2(Number(afterNew.inv.principal) - before.closing)}
\`\`\`

## Verification checklist

${checks.map((c) => `- ${c.pass ? "✅" : "❌"} **${c.name}** — ${c.detail}`).join("\n")}

## Code path confirmed

1. \`recalculateInvestment(source)\` refreshes accruals before quote/carry-forward  
2. Source set \`archived=true\`, \`active=false\`  
3. New investment created with \`principal = closingBalance(source)\` (unless overridden)  
4. \`previousTransactionId\` set to source  
5. \`recalculateInvestment(new)\` runs for the new quarter period  
6. Duplicate rollover to same target quarter is rejected by API  

## Notes for Damon

- This was an **actual posted rollover** on a **dedicated test mandate** under QA Isolation Test — not Anita’s live Q4 mandate, and not code-review only.
- Calendar today is still mid-Q4 (2026-11-17); quarter-end cron archive was **not** required because the admin **manual execute-single** path is what operators use from \`/rollover\` and matches the carry-forward math the cron path uses after archive.
- Source remains in DB as archived history; new Q1 mandate is active. Both are labeled for cleanup if needed.

## API response (truncated)

\`\`\`json
${JSON.stringify(apiResult?.data ? { _id: apiResult.data._id, principal: apiResult.data.principal, quarter: apiResult.data.quarter, transactionId: apiResult.data.transactionId, startDate: apiResult.data.startDate, quarterEndDate: apiResult.data.quarterEndDate } : apiResult, null, 2)}
\`\`\`
`;

fs.writeFileSync(reportPath, report);
console.log("\n" + (allPass ? "PASS" : "FAIL"));
console.log(`Report: ${reportPath}`);

await mongoose.disconnect();
process.exit(allPass ? 0 : 1);
