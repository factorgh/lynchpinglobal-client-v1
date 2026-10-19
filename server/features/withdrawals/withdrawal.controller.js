import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import { deleteOne, getOne, updateOne } from "../factory/factory-functions.js";

import Investment from "../investment/model/investment.model.js";
import WithdrawalModel from "./withdrawal.model.js";

import ActivityLog from "../activity-log/activity.model.js";
import { recalculateInvestment } from "../../utils/recalculate.js";

// Helper to determine if a status is approved / active deduction (meaning amount should be deducted from principal)
const isApprovedStatus = (status) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === "approved" || s === "processing";
};

// Create withdrawal handler
export const createWithdrawal = catchAsync(async (req, res, next) => {
  const { user, amount, status } = req.body; // Extract userId, withdrawal amount, and status from the request body

  // Step 1: Fetch the user's investment details
  const investment = await Investment.findOne({ userId: user });

  if (!investment) {
    return next(new AppError("Investment not found for this user.", 404)); // Handle case when investment is not found
  }

  const isApproved = isApprovedStatus(status);

  // Step 2: ONLY deduct from principal if the withdrawal is explicitly APPROVED
  if (isApproved) {
    if (amount > investment.principal) {
      return next(new AppError("Insufficient funds for withdrawal.", 400)); // Handle insufficient funds
    }

    // Step 2.5: Snapshot and lock the accrued profit accumulated prior to this withdrawal
    await recalculateInvestment(investment._id);
    const refreshedInvestment = await Investment.findById(investment._id);

    // Preserve previously accrued principal profit so withdrawal never erases earned profits
    refreshedInvestment.lockedPrincipalProfit =
      (refreshedInvestment.lockedPrincipalProfit || 0) +
      (refreshedInvestment.principalAccruedReturn || 0);
    refreshedInvestment.lastPrincipalAdjustmentDate = new Date();

    // Step 3: Deduct the withdrawal amount from the principal
    const newPrincipal = Math.max(0, refreshedInvestment.principal - amount);

    // Step 4: Update the user's investment principal
    refreshedInvestment.principal = newPrincipal;
    await refreshedInvestment.save();

    // Step 6: Trigger recalculation with preserved profits
    await recalculateInvestment(refreshedInvestment._id);
  }

  // Step 5: Create the withdrawal record
  const doc = await WithdrawalModel.create(req.body);

  // Step 7: Log activity
  try {
    await ActivityLog.create({
      user: req.user?._id || user,
      activity: "Withdrawal Created",
      description: `A withdrawal entry of GHS ${amount} was created for user ${user} (Status: ${status || "Pending"}${
        isApproved ? " - Principal Deducted" : " - Awaiting Approval, Principal Not Deducted"
      }).`,
    });
  } catch (err) {
    console.error("Activity logging failed:", err);
  }

  // Step 8: Return success response
  res.status(201).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const getUserWithdrawals = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found. Please log in.", 401)); // Return an error if req.user is not found
  }
  const doc = await WithdrawalModel.find({ user: req.user._id });
  res.status(200).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const deleteWithdrawal = catchAsync(async (req, res, next) => {
  const doc = await WithdrawalModel.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }

  // Adjust principal and recalculate only if the withdrawal was approved and deducted
  const wasApproved = isApprovedStatus(doc.status);
  if (wasApproved) {
    const investment = await Investment.findOne({ userId: doc.user });
    if (investment) {
      investment.principal += doc.amount;
      await investment.save();
      await recalculateInvestment(investment._id);
    }
  }

  // Log activity
  try {
    await ActivityLog.create({
      user: req.user?._id || doc.user,
      activity: "Withdrawal Deleted",
      description: `A withdrawal entry of GHS ${doc.amount} was deleted for user ${doc.user}.${
        wasApproved
          ? " Principal restored."
          : " No principal adjustment needed (was unapproved/pending)."
      }`,
    });
  } catch (err) {
    console.error("Activity logging failed:", err);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const updateWithdrawal = catchAsync(async (req, res, next) => {
  const oldDoc = await WithdrawalModel.findById(req.params.id);
  if (!oldDoc) {
    return next(new AppError("No document found with that ID", 404));
  }

  const doc = await WithdrawalModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const wasApproved = isApprovedStatus(oldDoc.status);
  const isApproved = isApprovedStatus(doc.status);

  const oldAmount = Number(oldDoc.amount) || 0;
  const newAmount = Number(doc.amount) || 0;

  // What was previously deducted from principal (only approved withdrawals were deducted)
  const prevDeduction = wasApproved ? oldAmount : 0;
  // What should currently be deducted from principal (only approved withdrawals are deducted)
  const nextDeduction = isApproved ? newAmount : 0;

  // principalDelta > 0: refund back to user principal (e.g. from Approved to Cancelled/Rejected/Pending)
  // principalDelta < 0: deduct from user principal (e.g. from Pending to Approved)
  const principalDelta = prevDeduction - nextDeduction;

  if (principalDelta !== 0) {
    const investment = await Investment.findOne({ userId: doc.user });
    if (investment) {
      if (principalDelta < 0) {
        // Approving/increasing deduction: snapshot and lock profit prior to deduction
        await recalculateInvestment(investment._id);
        const refreshedInvestment = await Investment.findById(investment._id);
        refreshedInvestment.lockedPrincipalProfit =
          (refreshedInvestment.lockedPrincipalProfit || 0) +
          (refreshedInvestment.principalAccruedReturn || 0);
        refreshedInvestment.lastPrincipalAdjustmentDate = new Date();
        refreshedInvestment.principal = Math.max(0, (refreshedInvestment.principal || 0) + principalDelta);
        await refreshedInvestment.save();
        await recalculateInvestment(refreshedInvestment._id);
      } else {
        // Refunding back to principal (e.g. rejection/cancellation of approved withdrawal)
        investment.principal = Math.max(0, (investment.principal || 0) + principalDelta);
        await investment.save();
        await recalculateInvestment(investment._id);
      }
    }
  }

  // Log activity
  try {
    const statusNote =
      oldDoc.status !== doc.status
        ? ` Status changed from ${oldDoc.status} to ${doc.status}.`
        : "";
    const refundNote =
      principalDelta > 0
        ? ` Refunded GHS ${principalDelta.toFixed(2)} to principal.`
        : principalDelta < 0
        ? ` Deducted GHS ${Math.abs(principalDelta).toFixed(2)} from principal.`
        : "";

    await ActivityLog.create({
      user: req.user?._id || doc.user,
      activity: "Withdrawal Updated",
      description: `A withdrawal entry was updated for user ${doc.user}.${statusNote}${refundNote} Current amount: GHS ${doc.amount}.`,
    });
  } catch (err) {
    console.error("Activity logging failed:", err);
  }


  res.status(200).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});
// export const getAllWithdrawals = getAll(WithdrawalModel);
export const getAllWithdrawals = catchAsync(async (req, res, next) => {
  const rentals = await WithdrawalModel.find().populate("user");
  res.status(200).json({
    status: "success",
    data: {
      data: rentals,
    },
  });
});
export const getWithdrawal = getOne(WithdrawalModel);
