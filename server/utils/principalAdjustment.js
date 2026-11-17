import Investment from "../features/investment/model/investment.model.js";
import { recalculateInvestment } from "./recalculate.js";
import { round2 } from "./halper.js";

/**
 * Move `delta` GHS out of (positive) or back into (negative) a mandate's principal.
 * Accrued profit is frozen only when money leaves the mandate. Restoring principal
 * must not re-lock accrued earnings — that doubled balances on cancel/reject.
 */
export const applyPrincipalChange = async (investment, delta) => {
  const investmentId = investment?._id || investment;
  await recalculateInvestment(investmentId);
  const fresh = await Investment.findById(investmentId).select("+archived +active");
  if (!fresh) return null;

  const amount = Number(delta) || 0;
  if (amount > 0) {
    fresh.lockedPrincipalProfit = round2(fresh.principalAccruedReturn || 0);
    fresh.lastPrincipalAdjustmentDate = new Date();
    fresh.principal = round2(Math.max(0, (fresh.principal || 0) - amount));
  } else if (amount < 0) {
    fresh.principal = round2((fresh.principal || 0) - amount);
  }

  await fresh.save({ validateBeforeSave: false });
  await recalculateInvestment(fresh._id);
  return Investment.findById(fresh._id).select("+archived +active");
};
