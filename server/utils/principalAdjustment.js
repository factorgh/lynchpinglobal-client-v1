import Investment from "../features/investment/model/investment.model.js";
import { recalculateInvestment } from "./recalculate.js";
import { round2 } from "./halper.js";

const sessionOpt = (session) => (session ? { session } : undefined);

/**
 * Capture principal/lock fields so a failed disbursement save can roll back
 * a mandate that already had applyPrincipalChange applied.
 */
export const snapshotPrincipalState = (investment) => {
  if (!investment?._id) return null;
  return {
    _id: investment._id,
    principal: Number(investment.principal || 0),
    lockedPrincipalProfit: Number(investment.lockedPrincipalProfit || 0),
    lastPrincipalAdjustmentDate: investment.lastPrincipalAdjustmentDate || null,
  };
};

/** Restore principal/lock exactly, then recalculate accruals. */
export const restorePrincipalState = async (snapshot, session = null) => {
  if (!snapshot?._id) return null;
  const inv = await Investment.findById(snapshot._id)
    .select("+archived +active")
    .session(session || null);
  if (!inv) return null;

  inv.principal = round2(snapshot.principal);
  if (snapshot.lastPrincipalAdjustmentDate) {
    inv.lockedPrincipalProfit = round2(snapshot.lockedPrincipalProfit || 0);
    inv.lastPrincipalAdjustmentDate = snapshot.lastPrincipalAdjustmentDate;
  } else {
    inv.lockedPrincipalProfit = 0;
    inv.set("lastPrincipalAdjustmentDate", undefined);
  }

  await inv.save({ validateBeforeSave: false, ...sessionOpt(session) });
  await recalculateInvestment(inv._id, session);
  return Investment.findById(inv._id)
    .select("+archived +active")
    .session(session || null);
};

/**
 * Move `delta` GHS out of (positive) or back into (negative) a mandate's principal.
 * Accrued profit is frozen only when money leaves the mandate. Restoring principal
 * must not re-lock accrued earnings — that doubled balances on cancel/reject.
 */
export const applyPrincipalChange = async (investment, delta, session = null) => {
  const investmentId = investment?._id || investment;
  await recalculateInvestment(investmentId, session);
  const fresh = await Investment.findById(investmentId)
    .select("+archived +active")
    .session(session || null);
  if (!fresh) return null;

  const amount = Number(delta) || 0;
  if (amount > 0) {
    fresh.lockedPrincipalProfit = round2(fresh.principalAccruedReturn || 0);
    fresh.lastPrincipalAdjustmentDate = new Date();
    fresh.principal = round2(Math.max(0, (fresh.principal || 0) - amount));
  } else if (amount < 0) {
    fresh.principal = round2((fresh.principal || 0) - amount);
  }

  await fresh.save({ validateBeforeSave: false, ...sessionOpt(session) });
  await recalculateInvestment(fresh._id, session);
  return Investment.findById(fresh._id)
    .select("+archived +active")
    .session(session || null);
};
