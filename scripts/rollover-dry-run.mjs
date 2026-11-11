// Read-only quarterly rollover preview for one mandate (or all active mandates).
//
//   node scripts/rollover-dry-run.mjs --mandate=<investmentId>
//   node scripts/rollover-dry-run.mjs --client=Anita
//
// Mirrors the server rollover formula: new principal = principal + active add-on capital
// + net accrued return (totalAccruedReturn). Nothing is written to the database.
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
const r2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const ghs = (n) => `GHS ${r2(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "—");

const quarterEnd = (date) => {
  const d = new Date(date);
  const endMonth = Math.floor(d.getUTCMonth() / 3) * 3 + 2;
  return new Date(Date.UTC(d.getUTCFullYear(), endMonth + 1, 0));
};

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
const db = mongoose.connection.db;

const filter = { archived: { $ne: true } };
if (args.mandate) filter._id = new mongoose.Types.ObjectId(String(args.mandate));
if (args.client) {
  const rx = new RegExp(String(args.client).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const ids = (
    await db.collection("users").find({ $or: [{ name: rx }, { displayName: rx }, { email: rx }, { license: rx }] }).toArray()
  ).map((u) => u._id);
  filter.$or = [{ userId: { $in: ids } }, { "owners.user": { $in: ids } }];
}

const mandates = await db.collection("investments").find(filter).toArray();
for (const inv of mandates) {
  const addOns = await db.collection("addons").find({ _id: { $in: inv.addOns || [] } }).toArray();
  const activeAddOns = r2(addOns.filter((a) => a.status === "active").reduce((s, a) => s + Number(a.amount || 0), 0));
  const feeRate = inv.managementFeeRate !== undefined ? inv.managementFeeRate : 20;
  const gross = r2((inv.principalAccruedReturn || 0) + (inv.addOnAccruedReturn || 0));
  const expectedFee = r2((gross * feeRate) / 100);
  const expectedNet = r2(Math.max(gross + (inv.performanceYield || 0) - (expectedFee + (inv.operationalCost || 0)), 0));
  const closing = r2(Number(inv.principal || 0) + activeAddOns + Number(inv.totalAccruedReturn || 0));
  const start = inv.quarterEndDate ? new Date(new Date(inv.quarterEndDate).getTime() + 86400000) : new Date();
  const u = await db.collection("users").findOne({ _id: inv.userId });

  console.log(`\n=== Mandate ${inv._id} — ${u?.displayName || u?.name || inv.name} (${inv.quarter}) ===`);
  console.log("BEFORE (current quarter)");
  console.log(`  Principal                 ${ghs(inv.principal)}`);
  console.log(`  Active add-on capital     ${ghs(activeAddOns)}`);
  console.log(`  Principal accrued return  ${ghs(inv.principalAccruedReturn)}`);
  console.log(`  Add-on accrued return     ${ghs(inv.addOnAccruedReturn)}`);
  console.log(`  Performance yield         ${ghs(inv.performanceYield)}`);
  console.log(`  Service fee (${feeRate}%)        ${ghs(inv.managementFee)}  (recomputed: ${ghs(expectedFee)})`);
  console.log(`  Operational charge        ${ghs(inv.operationalCost)}`);
  console.log(`  Net accrued (stored)      ${ghs(inv.totalAccruedReturn)}  (recomputed: ${ghs(expectedNet)})`);
  console.log(`  Period                    ${fmt(inv.startDate)} → ${fmt(inv.quarterEndDate)}`);
  console.log("AFTER (projected rollover)");
  console.log(`  New principal             ${ghs(closing)}`);
  console.log(`  New period                ${fmt(start)} → ${fmt(quarterEnd(start))}`);
  console.log(`  Accrued return resets to  ${ghs(0)}`);
  if (Math.abs(expectedNet - Number(inv.totalAccruedReturn || 0)) > 0.01) {
    console.log("  NOTE: stored net accrued differs from recomputed value; run a recalculation before rolling over.");
  }
}

await mongoose.disconnect();
