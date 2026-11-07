import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import { deleteOne, getOne, updateOne } from "../factory/factory-functions.js";
import Investment from "../investment/model/investment.model.js";

import PaymentModel from "./payments.model.js";

import User from "../auth/models/user.model.js";
import ActivityLog from "../activity-log/activity.model.js";
import { recalculateInvestment } from "../../utils/recalculate.js";

const isApprovalLikeStatus = (status) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === "approved" || s === "processing";
};

const hasApprovalDate = (approvedDate) => {
  if (
    approvedDate === undefined ||
    approvedDate === null ||
    approvedDate === ""
  ) {
    return false;
  }

  const date = new Date(approvedDate);
  return !Number.isNaN(date.getTime());
};

const isApprovedStatus = (status, approvedDate) => {
  return isApprovalLikeStatus(status) && hasApprovalDate(approvedDate);
};

const getActiveInvestmentForUser = async (userId) => {
  if (!userId) return null;

  return Investment.findOne({
    $or: [{ userId }, { "owners.user": userId }],
    active: { $ne: false },
    archived: { $ne: true },
  }).sort({ createdAt: -1 });
};

// Create payment handler
export const createPayment = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { user, amount, status, approvedDate } = req.body;

  if (isApprovalLikeStatus(status) && !hasApprovalDate(approvedDate)) {
    return next(
      new AppError(
        "Approved or processing payments must include an approval date.",
        400,
      ),
    );
  }

  const investment = await getActiveInvestmentForUser(user);

  if (!investment) {
    return next(new AppError("Investment not found for this user.", 404));
  }

  const isApproved = isApprovedStatus(status, approvedDate);

  // Step 2: ONLY deduct from principal if the payment is explicitly APPROVED
  if (isApproved) {
    // Check if payment amount is greater than or equal to the investment principal
    if (amount >= investment.principal) {
      return next(
        new AppError(
          "Payment amount cannot be greater than or equal to the principal.",
          400,
        ),
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
    const targetUserDoc = await User.findById(user).select(
      "name displayName license email",
    );
    const targetName =
      targetUserDoc?.displayName ||
      targetUserDoc?.name ||
      `Client (${String(user).slice(-6)})`;
    const targetLicense = targetUserDoc?.license || "";

    await ActivityLog.create({
      user: req.user?._id || user,
      targetUser: user,
      targetName,
      targetLicense,
      targetAccount: `Payment #PAY-${String(doc._id).slice(-6).toUpperCase()}`,
      entityType: "Payment",
      entityId: String(doc._id),
      amount: Number(amount),
      activity: "Payment Created",
      description: `Payment entry of GHS ${Number(amount).toLocaleString()} created for ${targetName}${
        targetLicense ? ` (${targetLicense})` : ""
      }. Status: ${status || "Pending"}${
        isApproved ? " (Principal Deducted)" : " (Awaiting Approval)"
      }.`,
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

  const wasApproved = isApprovedStatus(doc.status, doc.approvedDate);
  if (wasApproved) {
    const investment = await getActiveInvestmentForUser(doc.user);
    if (investment) {
      investment.principal = Math.max(
        0,
        (investment.principal || 0) + Number(doc.amount || 0),
      );
      await investment.save();
      await recalculateInvestment(investment._id);
    }
  }

  // Log activity
  try {
    const targetUserDoc = await User.findById(doc.user).select(
      "name displayName license email",
    );
    const targetName =
      targetUserDoc?.displayName ||
      targetUserDoc?.name ||
      `Client (${String(doc.user).slice(-6)})`;
    const targetLicense = targetUserDoc?.license || "";

    await ActivityLog.create({
      user: req.user?._id || doc.user,
      targetUser: doc.user,
      targetName,
      targetLicense,
      targetAccount: `Payment #PAY-${String(doc._id).slice(-6).toUpperCase()}`,
      entityType: "Payment",
      entityId: String(doc._id),
      amount: Number(doc.amount),
      activity: "Payment Deleted",
      description: `Payment entry of GHS ${Number(doc.amount).toLocaleString()} for ${targetName}${
        targetLicense ? ` (${targetLicense})` : ""
      } was deleted.${
        wasApproved
          ? " Principal restored."
          : " No principal adjustment needed."
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

  const nextApprovedDate = req.body.approvedDate ?? oldDoc.approvedDate;
  if (
    isApprovalLikeStatus(req.body.status ?? oldDoc.status) &&
    !hasApprovalDate(nextApprovedDate)
  ) {
    return next(
      new AppError(
        "Approved or processing payments must include an approval date.",
        400,
      ),
    );
  }

  const doc = await PaymentModel.findByIdAndUpdate(
    req.params.id,
    { ...req.body, approvedDate: nextApprovedDate },
    { new: true, runValidators: true },
  );

  const wasApproved = isApprovedStatus(oldDoc.status, oldDoc.approvedDate);
  const isApproved = isApprovedStatus(doc.status, doc.approvedDate);

  const oldAmount = Number(oldDoc.amount) || 0;
  const newAmount = Number(doc.amount) || 0;

  const prevDeduction = wasApproved ? oldAmount : 0;
  const nextDeduction = isApproved ? newAmount : 0;
  const principalDelta = prevDeduction - nextDeduction;

  if (principalDelta !== 0) {
    const investment = await getActiveInvestmentForUser(doc.user);
    if (investment) {
      investment.principal = Math.max(
        0,
        (investment.principal || 0) + principalDelta,
      );
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

    const targetUserDoc = await User.findById(doc.user).select(
      "name displayName license email",
    );
    const targetName =
      targetUserDoc?.displayName ||
      targetUserDoc?.name ||
      `Client (${String(doc.user).slice(-6)})`;
    const targetLicense = targetUserDoc?.license || "";

    await ActivityLog.create({
      user: req.user?._id || doc.user,
      targetUser: doc.user,
      targetName,
      targetLicense,
      targetAccount: `Payment #PAY-${String(doc._id).slice(-6).toUpperCase()}`,
      entityType: "Payment",
      entityId: String(doc._id),
      amount: Number(doc.amount),
      activity: "Payment Updated",
      description: `Payment of GHS ${Number(doc.amount).toLocaleString()} for ${targetName}${
        targetLicense ? ` (${targetLicense})` : ""
      } was updated.${statusNote}${refundNote}`,
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
