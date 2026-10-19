import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import { deleteOne, getOne, updateOne } from "../factory/factory-functions.js";
import Investment from "../investment/model/investment.model.js";

import PaymentModel from "./payments.model.js";

import ActivityLog from "../activity-log/activity.model.js";
import { recalculateInvestment } from "../../utils/recalculate.js";

// Helper to determine if a status is approved / active deduction (meaning amount should be deducted from principal)
const isApprovedStatus = (status) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === "approved" || s === "processing";
};

// Create payment handler
export const createPayment = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { user, amount, status } = req.body; // Extract userId, payment amount, and status from the request body

  // Step 1: Fetch the user's investment details
  const investment = await Investment.findOne({ userId: user });

  if (!investment) {
    return next(new AppError("Investment not found for this user.", 404)); // Handle case when investment is not found
  }

  const isApproved = isApprovedStatus(status);

  // Step 2: ONLY deduct from principal if the payment is explicitly APPROVED
  if (isApproved) {
    // Check if payment amount is greater than or equal to the investment principal
    if (amount >= investment.principal) {
      return next(
        new AppError(
          "Payment amount cannot be greater than or equal to the principal.",
          400
        )
      );
    }

    // Reduce the investment principal by the payment amount
    investment.principal = Math.max(0, investment.principal - amount);
    await investment.save();

    // Trigger recalculation
    await recalculateInvestment(investment._id);
  }

  // Step 3: Create the payment record
  const doc = await PaymentModel.create(req.body);

  // Step 7: Log activity
  try {
    await ActivityLog.create({
      user: req.user?._id || user,
      activity: "Payment Created",
      description: `A payment entry of GHS ${amount} was created for user ${user} (Status: ${status || "Pending"}${
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

export const deletePayment = catchAsync(async (req, res, next) => {
  const doc = await PaymentModel.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }

  // Adjust principal and recalculate only if approved and deducted
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
      activity: "Payment Deleted",
      description: `A payment entry of GHS ${doc.amount} was deleted for user ${doc.user}.${
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

export const updatePayment = catchAsync(async (req, res, next) => {
  const oldDoc = await PaymentModel.findById(req.params.id);
  if (!oldDoc) {
    return next(new AppError("No document found with that ID", 404));
  }

  const doc = await PaymentModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const wasApproved = isApprovedStatus(oldDoc.status);
  const isApproved = isApprovedStatus(doc.status);

  const oldAmount = Number(oldDoc.amount) || 0;
  const newAmount = Number(doc.amount) || 0;

  // What was previously deducted from principal (only approved payments were deducted)
  const prevDeduction = wasApproved ? oldAmount : 0;
  // What should currently be deducted from principal (only approved payments are deducted)
  const nextDeduction = isApproved ? newAmount : 0;

  // principalDelta > 0: refund back to user principal (e.g. Approved -> Cancelled/Rejected/Pending)
  // principalDelta < 0: deduct from user principal (e.g. Pending -> Approved)
  const principalDelta = prevDeduction - nextDeduction;

  if (principalDelta !== 0) {
    const investment = await Investment.findOne({ userId: doc.user });
    if (investment) {
      investment.principal = Math.max(0, (investment.principal || 0) + principalDelta);
      await investment.save();
      await recalculateInvestment(investment._id);
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
      activity: "Payment Updated",
      description: `A payment entry was updated for user ${doc.user}.${statusNote}${refundNote} Current amount: GHS ${doc.amount}.`,
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
//
export const getAllPayments = catchAsync(async (req, res, next) => {
  const payments = await PaymentModel.find()
    .sort({ rrquestedDate: -1 })
    .populate("user");
  res.status(200).json({
    status: "success",
    data: {
      data: payments,
    },
  });
});
export const getUserPayments = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found. Please log in.", 401));
  }
  const doc = await PaymentModel.find({ user: req.user._id });
  res.status(200).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const getPayment = getOne(PaymentModel);
