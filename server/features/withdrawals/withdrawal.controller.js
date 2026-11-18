import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import { getOne } from "../factory/factory-functions.js";

import Investment from "../investment/model/investment.model.js";
import WithdrawalModel, {
  normalizeDisbursementStatus,
} from "./withdrawal.model.js";

import User from "../auth/models/user.model.js";
import { recalculateInvestment } from "../../utils/recalculate.js";
import {
  applyPrincipalChange,
  snapshotPrincipalState,
  restorePrincipalState,
} from "../../utils/principalAdjustment.js";
import { withMongoTransaction } from "../../utils/withMongoTransaction.js";
import { round2 } from "../../utils/halper.js";
import {
  logActivity,
  diffFields,
  describeChanges,
} from "../activity-log/logActivity.js";

const isApprovalLikeStatus = (status) => {
  if (!status) return false;
  const s = String(normalizeDisbursementStatus(status)).trim().toLowerCase();
  // Legacy "processing" still counts as approved for open deductions.
  return s === "approved";
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

/**
 * Prefer the linked mandate even when archived (post-rollover restores must
 * hit the same books that were deducted). Only fall back for legacy rows
 * with no investment link.
 */
const resolveMandate = async (doc) => {
  if (doc.investment) {
    const linked = await Investment.findById(doc.investment).select("+archived +active");
    if (linked) return linked;
  }
  return getActiveInvestmentForUser(doc.user);
};

/** Persist deductedAmount on legacy approval-like rows so heal queries stay accurate. */
const backfillLegacyDeductedAmounts = async (investmentId, session = null) => {
  if (!investmentId) return;
  let q = WithdrawalModel.find({
    investment: investmentId,
    deductedAmount: { $exists: false },
  });
  if (session) q = q.session(session);
  const legacy = await q;
  for (const row of legacy) {
    if (isApprovalLikeStatus(row.status)) {
      row.deductedAmount = Number(row.amount) || 0;
    } else {
      row.deductedAmount = 0;
    }
    await row.save({ validateBeforeSave: false, ...(session ? { session } : {}) });
  }
};

const remainingDeductedCount = async (investmentId, session = null) => {
  if (!investmentId) return 0;
  await backfillLegacyDeductedAmounts(investmentId, session);
  let q = WithdrawalModel.find({ investment: investmentId }).select(
    "amount status deductedAmount",
  );
  if (session) q = q.session(session);
  const rows = await q;
  return rows.filter((row) => currentDeduction(row) > 0).length;
};

const healAccrualIfFullyReversed = async (investmentId, session = null) => {
  if (!investmentId) return;
  const remaining = await remainingDeductedCount(investmentId, session);
  if (remaining > 0) return;
  let q = Investment.findById(investmentId);
  if (session) q = q.session(session);
  const inv = await q;
  if (!inv || !inv.lastPrincipalAdjustmentDate) return;
  inv.lockedPrincipalProfit = 0;
  inv.set("lastPrincipalAdjustmentDate", undefined);
  await inv.save({ validateBeforeSave: false, ...(session ? { session } : {}) });
  await recalculateInvestment(inv._id, session);
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

  const normalizedStatus = normalizeDisbursementStatus(status) || "Pending";

  if (isApprovalLikeStatus(normalizedStatus) && !hasApprovalDate(approvedDate)) {
    return next(
      new AppError(
        "Approved disbursements must include an approval date.",
        400,
      ),
    );
  }

  const investment = await getActiveInvestmentForUser(user);
  if (!investment) {
    return next(new AppError("No active mandate found for this client.", 404));
  }

  const isApproved = isApprovedStatus(normalizedStatus, approvedDate);
  if (isApproved && numericAmount > investment.principal) {
    return next(new AppError("Insufficient funds for disbursement.", 400));
  }

  const principalBefore = investment.principal;
  const payload = {
    user,
    amount: numericAmount,
    requestedDate: req.body.requestedDate,
    approvedDate: hasApprovalDate(approvedDate) ? approvedDate : undefined,
    status: normalizedStatus,
    investment: investment._id,
    deductedAmount: 0,
  };

  const runCreate = async (session = null) => {
    const created = await WithdrawalModel.create([payload], session ? { session } : undefined);
    const doc = Array.isArray(created) ? created[0] : created;
    let principalAfter = principalBefore;
    if (isApproved) {
      const updated = await applyPrincipalChange(investment, numericAmount, session);
      principalAfter = updated.principal;
      doc.deductedAmount = numericAmount;
      await doc.save(session ? { session } : undefined);
    }
    return { doc, principalAfter };
  };

  const { doc, principalAfter } = await withMongoTransaction(
    (session) => runCreate(session),
    async () => {
      const snap = snapshotPrincipalState(investment);
      try {
        return await runCreate(null);
      } catch (err) {
        await restorePrincipalState(snap);
        // Pending create may still exist if create succeeded before principal failed.
        throw err;
      }
    },
  );

  const client = await clientInfo(user);
  await logActivity({
    req,
    activity: "Disbursement Created",
    description: `Disbursement of ${ghs(numericAmount)} created for ${client.name}${
      client.license ? ` (${client.license})` : ""
    } against ${mandateRef(investment)}. Status: ${doc.status}${
      isApproved
        ? `. ${ghs(numericAmount)} deducted; principal ${ghs(principalBefore)} → ${ghs(principalAfter)}.`
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

const presentWithdrawal = (doc) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  obj.status = normalizeDisbursementStatus(obj.status) || obj.status;
  return obj;
};

export const getUserWithdrawals = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found. Please log in.", 401));
  }
  const doc = await WithdrawalModel.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    data: {
      data: doc.map(presentWithdrawal),
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
  }

  const principalBefore = investment ? investment.principal : 0;

  const runDelete = async (session = null) => {
    let principalAfter = principalBefore;
    if (deducted > 0 && investment) {
      const updated = await applyPrincipalChange(investment, -deducted, session);
      principalAfter = updated.principal;
      await healAccrualIfFullyReversed(investment._id, session);
      const healed = await Investment.findById(investment._id)
        .select("+archived +active")
        .session(session || null);
      if (healed) principalAfter = healed.principal;
    }
    await WithdrawalModel.findByIdAndDelete(doc._id, session ? { session } : undefined);
    return { principalAfter };
  };

  const { principalAfter } = await withMongoTransaction(
    (session) => runDelete(session),
    async () => {
      const snap = investment ? snapshotPrincipalState(investment) : null;
      try {
        return await runDelete(null);
      } catch (err) {
        if (snap) await restorePrincipalState(snap);
        throw err;
      }
    },
  );

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

  const nextStatus = normalizeDisbursementStatus(req.body.status ?? oldDoc.status);
  const nextAmount =
    req.body.amount !== undefined ? Number(req.body.amount) : Number(oldDoc.amount);
  if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
    return next(new AppError("Please enter a valid disbursement amount.", 400));
  }
  // A cancelled disbursement must not keep an approval date.
  let nextApprovedDate = req.body.approvedDate ?? oldDoc.approvedDate;
  if (!isApprovalLikeStatus(nextStatus)) {
    nextApprovedDate = null;
  }
  if (isApprovalLikeStatus(nextStatus) && !hasApprovalDate(nextApprovedDate)) {
    return next(
      new AppError(
        "Approved disbursements must include an approval date.",
        400,
      ),
    );
  }

  const before = oldDoc.toObject();
  const alreadyDeducted = currentDeduction(oldDoc);
  const shouldBeDeducted = isApprovedStatus(nextStatus, nextApprovedDate) ? nextAmount : 0;
  const delta = round2(shouldBeDeducted - alreadyDeducted);

  let investment = null;
  if (delta !== 0) {
    investment = await resolveMandate(oldDoc);
    if (!investment) {
      return next(
        new AppError(
          "The mandate linked to this disbursement could not be found.",
          404,
        ),
      );
    }
    await recalculateInvestment(investment._id);
    investment = await Investment.findById(investment._id).select("+archived +active");
    if (delta > 0 && delta > investment.principal) {
      return next(new AppError("Insufficient funds for disbursement.", 400));
    }
  }

  const principalBefore = investment ? investment.principal : 0;

  const runUpdate = async (session = null) => {
    let principalAfter = principalBefore;
    if (delta !== 0 && investment) {
      const updated = await applyPrincipalChange(investment, delta, session);
      principalAfter = updated.principal;
      if (delta < 0) {
        await healAccrualIfFullyReversed(investment._id, session);
        const healed = await Investment.findById(investment._id)
          .select("+archived +active")
          .session(session || null);
        if (healed) principalAfter = healed.principal;
      }
    }

    // Re-load inside the transaction so we don't save a stale in-memory doc.
    let working = oldDoc;
    if (session) {
      working = await WithdrawalModel.findById(oldDoc._id).session(session);
      if (!working) {
        throw new AppError("No document found with that ID", 404);
      }
    }

    working.amount = nextAmount;
    working.status = nextStatus;
    working.approvedDate = nextApprovedDate || undefined;
    if (req.body.requestedDate) working.requestedDate = req.body.requestedDate;
    working.deductedAmount = shouldBeDeducted;
    if (investment) working.investment = investment._id;
    const doc = await working.save(session ? { session } : undefined);
    return { doc, principalAfter };
  };

  const { doc, principalAfter } = await withMongoTransaction(
    (session) => runUpdate(session),
    async () => {
      const snap = investment ? snapshotPrincipalState(investment) : null;
      try {
        return await runUpdate(null);
      } catch (err) {
        if (snap) await restorePrincipalState(snap);
        throw err;
      }
    },
  );

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
      data: withdrawals.map(presentWithdrawal),
    },
  });
});
export const getWithdrawal = getOne(WithdrawalModel);
