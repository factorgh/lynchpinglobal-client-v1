import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import { getOne } from "../factory/factory-functions.js";

import Investment from "../investment/model/investment.model.js";
import WithdrawalModel from "./withdrawal.model.js";

import User from "../auth/models/user.model.js";
import { recalculateInvestment } from "../../utils/recalculate.js";
import { round2 } from "../../utils/halper.js";
import {
  logActivity,
  diffFields,
  describeChanges,
} from "../activity-log/logActivity.js";

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
  })
    .select("+archived +active")
    .sort({ createdAt: -1 });
};

/**
 * Amount this disbursement has actually taken out of a mandate.
 * Legacy records (before deductedAmount existed) were deducted on approval status alone, with or without a date.
 */
const currentDeduction = (doc) => {
  if (typeof doc.deductedAmount === "number") return doc.deductedAmount;
  return isApprovalLikeStatus(doc.status) ? Number(doc.amount) || 0 : 0;
};

// Prefer the mandate the money originally came from; fall back to the client's current active mandate.
const resolveMandate = async (doc) => {
  if (doc.investment) {
    const linked = await Investment.findById(doc.investment).select("+archived +active");
    if (linked && !linked.archived && linked.active !== false) return linked;
  }
  return getActiveInvestmentForUser(doc.user);
};

/**
 * Move `delta` GHS out of (positive) or back into (negative) a mandate's principal.
 * Accrued profit up to today is locked first so the adjustment never erases earned returns.
 */
const applyPrincipalChange = async (investment, delta) => {
  await recalculateInvestment(investment._id);
  const fresh = await Investment.findById(investment._id);
  fresh.lockedPrincipalProfit = round2(
    (fresh.lockedPrincipalProfit || 0) + (fresh.principalAccruedReturn || 0),
  );
  fresh.lastPrincipalAdjustmentDate = new Date();
  fresh.principal = round2(Math.max(0, (fresh.principal || 0) - delta));
  await fresh.save();
  await recalculateInvestment(fresh._id);
  return fresh;
};

const clientInfo = async (userId) => {
  const u = await User.findById(userId).select("name displayName license email").lean();
  return {
    doc: u,
    name: u?.displayName || u?.name || `Client (${String(userId).slice(-6)})`,
    license: u?.license || "",
  };
};

const disbursementRef = (id) => `Disbursement #DISB-${String(id).slice(-6).toUpperCase()}`;
const mandateRef = (inv) => (inv ? `Mandate #${String(inv._id).slice(-6).toUpperCase()}` : "no mandate");
const ghs = (n) => `GHS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const WITHDRAWAL_FIELDS = {
  amount: "Amount (GHS)",
  status: "Status",
  requestedDate: "Request Date",
  approvedDate: "Approval Date",
};

// Create withdrawal handler
export const createWithdrawal = catchAsync(async (req, res, next) => {
  const { user, amount, status, approvedDate } = req.body;
  const numericAmount = Number(amount);

  if (!user || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return next(new AppError("Please select a client and enter a valid amount.", 400));
  }

  if (isApprovalLikeStatus(status) && !hasApprovalDate(approvedDate)) {
    return next(
      new AppError(
        "Approved or processing disbursements must include an approval date.",
        400,
      ),
    );
  }

  const investment = await getActiveInvestmentForUser(user);
  if (!investment) {
    return next(new AppError("No active mandate found for this client.", 404));
  }

  const isApproved = isApprovedStatus(status, approvedDate);
  if (isApproved && numericAmount > investment.principal) {
    return next(new AppError("Insufficient funds for disbursement.", 400));
  }

  const doc = await WithdrawalModel.create({
    user,
    amount: numericAmount,
    requestedDate: req.body.requestedDate,
    approvedDate: hasApprovalDate(approvedDate) ? approvedDate : undefined,
    status: status || "Pending",
    investment: investment._id,
    deductedAmount: 0,
  });

  let principalAfter = investment.principal;
  if (isApproved) {
    const updated = await applyPrincipalChange(investment, numericAmount);
    principalAfter = updated.principal;
    doc.deductedAmount = numericAmount;
    await doc.save();
  }

  const client = await clientInfo(user);
  await logActivity({
    req,
    activity: "Disbursement Created",
    description: `Disbursement of ${ghs(numericAmount)} created for ${client.name}${
      client.license ? ` (${client.license})` : ""
    } against ${mandateRef(investment)}. Status: ${doc.status}${
      isApproved
        ? `. ${ghs(numericAmount)} deducted; principal ${ghs(investment.principal)} → ${ghs(principalAfter)}.`
        : " (awaiting approval, nothing deducted)."
    }`,
    target: client.doc || user,
    targetAccount: disbursementRef(doc._id),
    entityType: "Disbursement",
    entityId: doc._id,
    amount: numericAmount,
    metadata: { mandateId: String(investment._id), deducted: doc.deductedAmount },
  });

  res.status(201).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const getUserWithdrawals = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found. Please log in.", 401));
  }
  const doc = await WithdrawalModel.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const deleteWithdrawal = catchAsync(async (req, res, next) => {
  const doc = await WithdrawalModel.findById(req.params.id);

  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }

  const deducted = currentDeduction(doc);
  let investment = null;
  let principalBefore = 0;
  let principalAfter = 0;
  if (deducted > 0) {
    investment = await resolveMandate(doc);
    if (!investment) {
      return next(
        new AppError(
          "Cannot delete: the mandate this disbursement was deducted from could not be found, so the amount cannot be restored.",
          409,
        ),
      );
    }
    principalBefore = investment.principal;
    const updated = await applyPrincipalChange(investment, -deducted);
    principalAfter = updated.principal;
  }

  await WithdrawalModel.findByIdAndDelete(doc._id);

  const client = await clientInfo(doc.user);
  await logActivity({
    req,
    activity: "Disbursement Deleted",
    description: `Disbursement entry of ${ghs(doc.amount)} for ${client.name}${
      client.license ? ` (${client.license})` : ""
    } was deleted (status was ${doc.status}).${
      deducted > 0
        ? ` ${ghs(deducted)} restored to ${mandateRef(investment)}; principal ${ghs(principalBefore)} → ${ghs(principalAfter)}.`
        : " Nothing had been deducted, so no balance change."
    }`,
    target: client.doc || doc.user,
    targetAccount: disbursementRef(doc._id),
    entityType: "Disbursement",
    entityId: doc._id,
    amount: Number(doc.amount),
    metadata: {
      deletedDisbursement: {
        amount: doc.amount,
        status: doc.status,
        requestedDate: doc.requestedDate,
        approvedDate: doc.approvedDate,
      },
      restored: deducted,
    },
  });

  res.status(200).json({
    status: "success",
    data: null,
  });
});

export const updateWithdrawal = catchAsync(async (req, res, next) => {
  const oldDoc = await WithdrawalModel.findById(req.params.id);
  if (!oldDoc) {
    return next(new AppError("No document found with that ID", 404));
  }

  const nextStatus = req.body.status ?? oldDoc.status;
  const nextAmount =
    req.body.amount !== undefined ? Number(req.body.amount) : Number(oldDoc.amount);
  if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
    return next(new AppError("Please enter a valid disbursement amount.", 400));
  }
  // A cancelled or rejected disbursement must not keep an approval date.
  let nextApprovedDate = req.body.approvedDate ?? oldDoc.approvedDate;
  if (!isApprovalLikeStatus(nextStatus)) {
    nextApprovedDate = null;
  }
  if (isApprovalLikeStatus(nextStatus) && !hasApprovalDate(nextApprovedDate)) {
    return next(
      new AppError(
        "Approved or processing disbursements must include an approval date.",
        400,
      ),
    );
  }

  const before = oldDoc.toObject();
  const alreadyDeducted = currentDeduction(oldDoc);
  const shouldBeDeducted = isApprovedStatus(nextStatus, nextApprovedDate) ? nextAmount : 0;
  const delta = round2(shouldBeDeducted - alreadyDeducted);

  let investment = null;
  let principalBefore = 0;
  let principalAfter = 0;
  if (delta !== 0) {
    investment = await resolveMandate(oldDoc);
    if (!investment) {
      return next(new AppError("No active mandate found for this client.", 404));
    }
    if (delta > 0 && delta > investment.principal) {
      return next(new AppError("Insufficient funds for disbursement.", 400));
    }
    principalBefore = investment.principal;
    const updated = await applyPrincipalChange(investment, delta);
    principalAfter = updated.principal;
  }

  oldDoc.amount = nextAmount;
  oldDoc.status = nextStatus;
  oldDoc.approvedDate = nextApprovedDate || undefined;
  if (req.body.requestedDate) oldDoc.requestedDate = req.body.requestedDate;
  oldDoc.deductedAmount = shouldBeDeducted;
  if (investment) oldDoc.investment = investment._id;
  const doc = await oldDoc.save();

  const changes = diffFields(before, doc.toObject(), WITHDRAWAL_FIELDS);
  const balanceNote =
    delta > 0
      ? ` ${ghs(delta)} deducted from ${mandateRef(investment)}; principal ${ghs(principalBefore)} → ${ghs(principalAfter)}.`
      : delta < 0
        ? ` ${ghs(-delta)} restored to ${mandateRef(investment)}; principal ${ghs(principalBefore)} → ${ghs(principalAfter)}.`
        : " No balance change.";

  const client = await clientInfo(doc.user);
  await logActivity({
    req,
    activity: "Disbursement Updated",
    description: `Disbursement of ${ghs(doc.amount)} for ${client.name}${
      client.license ? ` (${client.license})` : ""
    } was updated. ${describeChanges(changes) || "No field changes."}.${balanceNote}`,
    target: client.doc || doc.user,
    targetAccount: disbursementRef(doc._id),
    entityType: "Disbursement",
    entityId: doc._id,
    amount: Number(doc.amount),
    changes,
    metadata: {
      mandateId: investment ? String(investment._id) : undefined,
      principalDelta: -delta,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const getAllWithdrawals = catchAsync(async (req, res, next) => {
  const withdrawals = await WithdrawalModel.find()
    .populate("user", "name displayName email license")
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    data: {
      data: withdrawals,
    },
  });
});
export const getWithdrawal = getOne(WithdrawalModel);
