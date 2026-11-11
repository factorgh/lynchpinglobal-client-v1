// Disbursement reconciliation report (read-only unless --apply is given).
//
//   node scripts/reconcile-disbursements.mjs                 # report for every client
//   node scripts/reconcile-disbursements.mjs --client=Anita  # filter by name / username / email / Client ID
//   node scripts/reconcile-disbursements.mjs --apply --id=<disbursementId>
//
// --apply restores the amount of ONE cancelled/rejected legacy disbursement to the client's
// active mandate exactly once, marks it as reconciled and writes an activity log entry.
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

const ghs = (n) =>
  `GHS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isApprovalLike = (s) => ["approved", "processing"].includes(String(s || "").toLowerCase());

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
const db = mongoose.connection.db;
const users = db.collection("users");
const investments = db.collection("investments");
const withdrawals = db.collection("withdrawals");
const logs = db.collection("activitylogs");

const userFilter = {};
if (args.client) {
  const rx = new RegExp(String(args.client).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  userFilter.$or = [{ name: rx }, { displayName: rx }, { email: rx }, { license: rx }];
}

if (args.apply) {
  if (!args.id || !mongoose.isValidObjectId(args.id)) {
    console.error("--apply requires --id=<disbursementId>");
    process.exit(1);
  }
  const w = await withdrawals.findOne({ _id: new mongoose.Types.ObjectId(args.id) });
  if (!w) throw new Error("Disbursement not found");
  if (isApprovalLike(w.status)) throw new Error(`Disbursement is ${w.status}; only cancelled/rejected ones can be restored`);
  if (typeof w.deductedAmount === "number") {
    throw new Error(`Already reconciled (deductedAmount=${w.deductedAmount}); refusing to restore twice`);
  }
  const inv = await investments.findOne(
    { $or: [{ userId: w.user }, { "owners.user": w.user }], archived: { $ne: true }, active: { $ne: false } },
    { sort: { createdAt: -1 } },
  );
  if (!inv) throw new Error("No active mandate for this client");
  const before = Number(inv.principal || 0);
  const after = Math.round((before + Number(w.amount)) * 100) / 100;
  await investments.updateOne({ _id: inv._id }, { $set: { principal: after, lastModified: new Date() } });
  await withdrawals.updateOne(
    { _id: w._id },
    { $set: { deductedAmount: 0, investment: inv._id }, $unset: { approvedDate: "" } },
  );
  const u = await users.findOne({ _id: w.user });
  await logs.insertOne({
    activity: "Disbursement Reconciled",
    description: `Cancelled/rejected disbursement of ${ghs(w.amount)} for ${u?.displayName || u?.name} had been deducted but never restored. Restored to Mandate #${String(inv._id).slice(-6).toUpperCase()}: principal ${ghs(before)} → ${ghs(after)}.`,
    targetUser: w.user,
    targetName: u?.displayName || u?.name,
    targetLicense: u?.license,
    targetAccount: `Disbursement #DISB-${String(w._id).slice(-6).toUpperCase()}`,
    entityType: "Disbursement",
    entityId: String(w._id),
    amount: Number(w.amount),
    metadata: {
      actorName: "Reconciliation script",
      changes: [{ field: "principal", label: "Principal (GHS)", from: String(before), to: String(after) }],
    },
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Restored ${ghs(w.amount)}: principal ${ghs(before)} → ${ghs(after)} (mandate ${inv._id}). Run recalculation from the admin app to refresh accruals.`);
  await mongoose.disconnect();
  process.exit(0);
}

const clients = await users.find(userFilter).project({ name: 1, displayName: 1, email: 1, license: 1 }).toArray();
for (const u of clients) {
  const ws = await withdrawals.find({ user: u._id }).sort({ createdAt: 1 }).toArray();
  if (!ws.length) continue;
  const invs = await investments
    .find({ $or: [{ userId: u._id }, { "owners.user": u._id }] })
    .sort({ createdAt: 1 })
    .toArray();

  console.log(`\n=== ${u.displayName || u.name} (@${u.name}, ${u.license || "no Client ID"}) ===`);
  console.log("Mandates:");
  for (const i of invs) {
    console.log(
      `  ${i._id}  ${i.quarter}  principal ${ghs(i.principal)}  ${i.archived ? "ARCHIVED" : "active"}  created ${i.createdAt?.toISOString?.().slice(0, 10)}`,
    );
  }
  console.log("Disbursements:");
  for (const w of ws) {
    const legacy = typeof w.deductedAmount !== "number";
    const suspicious = legacy && !isApprovalLike(w.status) && w.approvedDate;
    console.log(
      `  ${w._id}  ${ghs(w.amount)}  ${w.status}  requested ${w.requestedDate?.toISOString?.().slice(0, 10)}  approved ${
        w.approvedDate ? w.approvedDate.toISOString().slice(0, 10) : "—"
      }  ${legacy ? "(legacy record)" : `deducted ${ghs(w.deductedAmount)}`}${
        suspicious ? "  <-- CHECK: cancelled/rejected but still carries an approval date" : ""
      }`,
    );
  }
  const related = await logs
    .find({ $or: [{ targetUser: u._id }, { entityId: { $in: ws.map((w) => String(w._id)) } }], entityType: /disburse|withdraw/i })
    .sort({ createdAt: 1 })
    .toArray();
  if (related.length) {
    console.log("Disbursement log history:");
    for (const l of related) {
      console.log(`  ${l.createdAt?.toISOString?.()}  ${l.activity}: ${l.description}`);
    }
  }
}

await mongoose.disconnect();
