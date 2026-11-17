import moment from "moment";
import { generateTransactionId, round2 } from "../../../utils/halper.js";
import {
  getQuarter,
  getQuarterEndDate,
  getQuarterDetails,
} from "../../../utils/handle_date_range.js";
import User from "../../auth/models/user.model.js";
import catchAsync from "../../error/catch-async-error.js";
import Investment from "../model/investment.model.js";
import WithdrawalModel from "../../withdrawals/withdrawal.model.js";
import ActivityLog from "../../activity-log/activity.model.js";
import { recalculateInvestment } from "../../../utils/recalculate.js";
import {
  logActivity,
  diffFields,
  diffFileLists,
  describeChanges,
} from "../../activity-log/logActivity.js";

const MANDATE_FIELDS = {
  name: "Mandate Name",
  principal: "Principal (GHS)",
  guaranteedRate: "Contractual Rate (%)",
  managementFeeRate: "Service Fee Rate (%)",
  operationalCost: "Operational Charges (GHS)",
  performanceYield: "Performance Bonus (GHS)",
  quarter: "Quarter",
  startDate: "Start Date",
  quarterEndDate: "Quarter End Date",
};

// Sum of active add-on capital; it must be carried into the next quarter's principal on rollover.
const activeAddOnTotal = (inv) =>
  round2(
    (inv?.addOns || []).reduce(
      (sum, a) => (a && a.status === "active" ? sum + Number(a.amount || 0) : sum),
      0,
    ),
  );

// Closing balance = principal + active add-on capital + net accrued return.
const closingBalance = (inv) =>
  round2(Number(inv.principal || 0) + activeAddOnTotal(inv) + Number(inv.totalAccruedReturn || 0));

// The next quarter starts the day after the source quarter closed; late rollovers start today.
const nextQuarterStart = (inv) => {
  const today = moment().startOf("day");
  if (!inv?.quarterEndDate) return today.toDate();
  const dayAfterClose = moment(inv.quarterEndDate).add(1, "day").startOf("day");
  const sameQuarterAsToday =
    getQuarter(dayAfterClose.toDate()) === getQuarter(today.toDate());
  return dayAfterClose.isAfter(today) || sameQuarterAsToday
    ? dayAfterClose.toDate()
    : today.toDate();
};

export const createInvestment = catchAsync(async (req, res, next) => {
  const {
    userId,
    principal,
    guaranteedRate = 8,
    managementFeeRate,
    operationalCost,
    performanceYield,
    others,
    mandate,
    partnerForm,
    certificate,
    checklist,
    owners,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  // Placeholder accruals — recalculateInvestment is the sole fee/accrual source of truth.
  const creationDate = new Date();
  const quarterEndDate = getQuarterEndDate(creationDate);
  const CalculatedDailyAmount = (guaranteedRate / 100) * principal;

  // Build owners: always include primary user, exclude primary from co-owners, and dedupe
  const inputOwners = Array.isArray(owners) ? owners : [];
  const normalizedCoOwners = inputOwners
    .map((o) => ({ user: o.user || o, role: o.role || "co-owner" }))
    .filter((o) => String(o.user) !== String(userId));
  // Dedupe by user
  const seen = new Set();
  const uniqueCoOwners = normalizedCoOwners.filter((o) => {
    const key = String(o.user);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const resolvedOwners = [{ user: userId, role: "primary" }, ...uniqueCoOwners];

  const investmentDetails = {
    ...req.body,
    owners: resolvedOwners,
    isJoint: resolvedOwners.length > 1,
    principalAccruedReturn: 0,
    addOnAccruedReturn: 0,
    managementFee: 0,
    totalAccruedReturn: 0,
    creationDate,
    quarterEndDate,
    expectedReturnHolder: CalculatedDailyAmount,
    operationalCost,
    others,
    mandate,
    partnerForm,
    certificate,
    checklist,
    transactionId: generateTransactionId(),
    name: req.body.name || "",
  };

  const newInvestment = await Investment.create(investmentDetails);
  await recalculateInvestment(newInvestment._id);

  try {
    const actorUser = req.user?._id || newInvestment.userId;
    const clientName = user.displayName || user.name || newInvestment.name || "Client";
    const clientLicense = user.license || "";

    await ActivityLog.create({
      user: actorUser,
      targetUser: newInvestment.userId,
      targetName: clientName,
      targetLicense: clientLicense,
      targetAccount: `Mandate #${String(newInvestment._id).slice(-6).toUpperCase()}`,
      entityType: "Mandate",
      entityId: String(newInvestment._id),
      amount: Number(newInvestment.principal || 0),
      activity: "New Mandate Created",
      description: `New mandate created for client "${clientName}" with initial principal GHS ${Number(newInvestment.principal || 0).toLocaleString()}`,
    });
  } catch (logErr) {
    console.error("Activity logging failed in createInvestment:", logErr);
  }

  res.status(201).json({
    status: "success",
    data: { investment: newInvestment },
  });
});

// Get all user investements
export const getAllInvestments = catchAsync(async (req, res, next) => {
  // Find user and populate investments, including hidden archive/active fields
  const investments = await Investment.find()
    .select("+archived +active")
    .populate(["addOns", "userId", { path: "owners.user" }]);
  if (!investments) {
    return res.status(404).json({ status: "fail", message: "No investments" });
  }

  const healed = [];
  for (const inv of investments) {
    healed.push((await healReversedDisbursementAccrual(inv)) || inv);
  }

  res.status(200).json({
    status: "success",
    data: healed,
  });
});

// Update investment

export const updateInvestment = catchAsync(async (req, res, next) => {
  const investmentId = req.params.id;

  // Permission: allow if requester is owner or admin/superadmin
  const existing = await Investment.findById(investmentId).populate({
    path: "owners.user",
  });
  if (!existing) {
    return res.status(404).json({
      status: "fail",
      message: "Investment not found",
    });
  }
  if (!req.user) {
    return res
      .status(401)
      .json({ status: "fail", message: "Not authenticated" });
  }
  const isAdmin =
    req.user && (req.user.role === "admin" || req.user.role === "superadmin");
  const requesterId = String(req.user._id || req.user.id);
  const isDirectOwner =
    existing.userId &&
    String(existing.userId._id || existing.userId) === requesterId;
  const isJointOwner = existing.owners?.some(
    (o) => String(o.user?._id || o.user) === requesterId,
  );
  if (!isAdmin && !isDirectOwner && !isJointOwner) {
    return res.status(403).json({ status: "fail", message: "Not authorized" });
  }

  // Clients may only manage their own supporting documents on a mandate.
  const updateData = isAdmin
    ? { ...req.body }
    : Array.isArray(req.body?.others)
      ? { others: req.body.others }
      : {};
  delete updateData._id;
  delete updateData.transactionId;
  if (!Object.keys(updateData).length) {
    return res.status(400).json({ status: "fail", message: "Nothing to update" });
  }
  const before = existing.toObject();

  // Update the investment and return the updated document
  const investment = await Investment.findByIdAndUpdate(
    investmentId,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).populate([{ path: "owners.user" }, "addOns", "userId"]);

  if (investment) {
    await recalculateInvestment(investment._id);

    const targetUserObj = investment.userId;
    const clientName = targetUserObj?.displayName || targetUserObj?.name || investment.name || "Client";
    const after = investment.toObject();
    const changes = [
      ...diffFields(before, after, MANDATE_FIELDS),
      ...diffFileLists(before.mandate, after.mandate, "Mandate Agreements"),
      ...diffFileLists(before.certificate, after.certificate, "Ledger & Certificates"),
      ...diffFileLists(before.checklist, after.checklist, "Due Diligence Checklists"),
      ...diffFileLists(before.partnerForm, after.partnerForm, "Partner Forms"),
      ...diffFileLists(before.others, after.others, "Supporting Documents"),
    ];
    const onlyDocuments = changes.length > 0 && changes.every((c) => c.field === "files");

    if (changes.length) {
      await logActivity({
        req,
        activity: onlyDocuments ? "Mandate Documents Updated" : "Mandate Updated",
        description: `Mandate for ${clientName} was updated. ${describeChanges(changes)}`,
        target: targetUserObj,
        targetAccount: `Mandate #${String(investment._id).slice(-6).toUpperCase()}`,
        entityType: "Mandate",
        entityId: investment._id,
        amount: Number(investment.principal || 0),
        changes,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Investment updated successfully",
    data: { investment },
  });
});

const isApprovalLikeWithdrawalStatus = (status) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  // Disbursements only allow Pending / Approved / Cancelled.
  // Legacy "processing" still counts as approved for open deductions.
  return s === "approved" || s === "processing";
};

const openDisbursementDeduction = (doc) => {
  if (typeof doc.deductedAmount === "number") return doc.deductedAmount;
  return isApprovalLikeWithdrawalStatus(doc.status) ? Number(doc.amount) || 0 : 0;
};

/** Align heal with currentDeduction semantics and backfill legacy rows. */
const remainingOpenDisbursements = async (investmentId) => {
  if (!investmentId) return 0;
  const rows = await WithdrawalModel.find({ investment: investmentId }).select(
    "amount status deductedAmount",
  );
  let open = 0;
  for (const row of rows) {
    if (typeof row.deductedAmount !== "number") {
      row.deductedAmount = isApprovalLikeWithdrawalStatus(row.status)
        ? Number(row.amount) || 0
        : 0;
      await row.save({ validateBeforeSave: false });
    }
    if (openDisbursementDeduction(row) > 0) open += 1;
  }
  return open;
};

// Get a single transaction for a partcular user
const healReversedDisbursementAccrual = async (investment) => {
  if (!investment?._id || !investment.lastPrincipalAdjustmentDate) return investment;
  const remaining = await remainingOpenDisbursements(investment._id);
  if (remaining > 0) return investment;
  investment.lockedPrincipalProfit = 0;
  investment.lastPrincipalAdjustmentDate = undefined;
  await investment.save({ validateBeforeSave: false });
  await recalculateInvestment(investment._id);
  const fresh = await Investment.findById(investment._id).select("+archived +active");
  if (fresh) {
    investment.lockedPrincipalProfit = fresh.lockedPrincipalProfit;
    investment.principalAccruedReturn = fresh.principalAccruedReturn;
    investment.totalAccruedReturn = fresh.totalAccruedReturn;
    investment.lastPrincipalAdjustmentDate = fresh.lastPrincipalAdjustmentDate;
    investment.principal = fresh.principal;
  }
  return investment;
};

export const getInvestment = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return res.status(401).json({ status: "fail", message: "Not authenticated" });
  }
  const userId = req.user._id;
  const investment = await Investment.find({
    $or: [{ "owners.user": userId }, { userId: userId }],
  })
    .select("+archived +active")
    .populate([
      "addOns",
      { path: "owners.user", select: "displayName name" },
    ]);

  const healed = [];
  for (const inv of investment || []) {
    healed.push((await healReversedDisbursementAccrual(inv)) || inv);
  }

  res.status(200).json({
    status: "success",
    data: healed,
  });
});

// Investment Rollovers
export const rolloverInvestments = async () => {
  const currentDate = new Date();
  const currentQuarterName = getQuarter(currentDate); // e.g., "2026-Q3"
  const targetQuarterLabel = currentQuarterName.split("-")[1]; // e.g., "Q3"

  const prevDate = new Date(currentDate);
  prevDate.setMonth(prevDate.getMonth() - 3);
  const sourceQuarterName = getQuarter(prevDate); // e.g., "2026-Q2"
  const sourceQuarterLabel = sourceQuarterName.split("-")[1]; // e.g., "Q2"

  try {
    // Find archived transactions for the source/previous quarter
    const archivedTransactions = await Investment.find({
      quarter: sourceQuarterLabel,
      archived: true,
    }).populate("addOns");
    console.log(
      `Archived transactions found for source quarter ${sourceQuarterLabel}: ${archivedTransactions.length}`,
    );

    console.log(
      `Rollover started from source quarter: ${sourceQuarterLabel} to target quarter: ${targetQuarterLabel}`,
    );

    for (const transaction of archivedTransactions) {
      console.log(
        `Processing archived transaction for user ${transaction.userId} with ID ${transaction._id}`,
      );

      // Prevent duplicate rollovers of the same transaction
      const existingRollover = await Investment.findOne({
        previousTransactionId: transaction._id,
      });
      if (existingRollover) {
        console.log(
          `Transaction for user ${transaction.userId} (ID: ${transaction._id}) has already been rolled over to ${existingRollover._id}`
        );
        continue;
      }

      // Fresh accruals before carry-forward (same as executeSingleRollover).
      await recalculateInvestment(transaction._id);
      const freshSource =
        (await Investment.findById(transaction._id).populate("addOns")) || transaction;

      // New principal = closing balance (principal + active add-on capital + net accrued return)
      const updatedPrincipal = closingBalance(freshSource);
      const newStartDate = nextQuarterStart(freshSource);

      // Create a new transaction for the target/current quarter
      const newTransaction = await Investment.create({
        userId: freshSource.userId,
        name: freshSource.name, // Preserve name
        principal: updatedPrincipal,
        accruedReturn: 0, // Reset accrued return
        quarter: targetQuarterLabel,
        transactionId: generateTransactionId(),
        startDate: newStartDate,
        quarterEndDate: getQuarterEndDate(newStartDate).toDate(),
        archived: false,
        active: true,
        mandate: freshSource.mandate,
        partnerForm: freshSource.partnerForm,
        certificate: freshSource.certificate,
        checklist: freshSource.checklist,
        others: freshSource.others || [],
        addOns: [],
        previousTransactionId: freshSource._id, // Link to the archived transaction
        owners: freshSource.owners,
        isJoint: freshSource.isJoint,
        guaranteedRate: freshSource.guaranteedRate,
        managementFeeRate: freshSource.managementFeeRate,
        operationalCost: freshSource.operationalCost,
        performanceYield: freshSource.performanceYield,
      });

      // Recalculate immediately for the new quarter investment
      await recalculateInvestment(newTransaction._id);

      console.log(
        `New transaction created for user ${transaction.userId} for ${targetQuarterLabel} with ID ${newTransaction._id}`,
      );
    }

    console.log("Rollover complete for target quarter:", currentQuarterName);
  } catch (error) {
    console.error("Error during rollover process:", error.message || error);
    throw new Error("Rollover process failed");
  }
};

// Archiving of investors
export const archiveTransactions = async () => {
  const currentDate = new Date();
  const prevDate = new Date(currentDate);
  prevDate.setMonth(prevDate.getMonth() - 3);
  const sourceQuarterName = getQuarter(prevDate); // e.g., "2026-Q2"
  const sourceQuarterLabel = sourceQuarterName.split("-")[1]; // e.g., "Q2"

  console.log(
    `---------------------------------ARCHIVING QUARTER: ${sourceQuarterName}`,
  );

  try {
    // Query active, non-archived investments of the previous quarter
    const query = { quarter: sourceQuarterLabel, archived: false };
    console.log(`Query:`, query);

    const result = await Investment.updateMany(query, {
      $set: { archived: true, active: false },
    });

    console.log(
      `---------------------------------ARCHIVED TRANSACTIONS --------------------------------`,
    );
    console.log(`Matched ${result.matchedCount} transactions`);
    console.log(`Modified ${result.modifiedCount} transactions`);

    if (result.matchedCount === 0) {
      console.warn(
        `No transactions matched for quarter ${sourceQuarterLabel}. Check your data.`,
      );
    } else if (result.modifiedCount === 0) {
      console.warn(
        `Transactions were matched but not updated. This could indicate no active transactions for the quarter.`,
      );
    } else {
      console.log(
        `Successfully archived ${result.modifiedCount} transactions for quarter ${sourceQuarterName}`,
      );
    }
  } catch (error) {
    console.error("Error archiving transactions:", error);
    throw new Error("Failed to archive transactions");
  }
};

export const deleteInvestment = catchAsync(async (req, res, nex) => {
  const { id } = req.params;
  const existing = await Investment.findById(id).populate({
    path: "owners.user",
  });
  if (!existing) {
    return res
      .status(404)
      .json({ status: "fail", message: "Investment not found" });
  }
  if (!req.user) {
    return res
      .status(401)
      .json({ status: "fail", message: "Not authenticated" });
  }
  const isAdmin =
    req.user && (req.user.role === "admin" || req.user.role === "superadmin");
  const requesterId = req.user._id;
  const isOwner = existing.owners?.some(
    (o) => String(o.user?._id || o.user) === String(requesterId),
  );
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ status: "fail", message: "Not authorized" });
  }
  const investment = await Investment.findByIdAndDelete(id);
  if (!investment) {
    return res
      .status(404)
      .json({ status: "fail", message: "Investment not found" });
  }

  try {
    const actorUser = req.user?._id;
    const targetUserId = existing.userId || existing.owners?.[0]?.user?._id || existing.owners?.[0]?.user;
    const clientName = existing.name || "Client";

    await ActivityLog.create({
      user: actorUser || targetUserId,
      targetUser: targetUserId,
      targetName: clientName,
      targetAccount: `Mandate #${String(id).slice(-6).toUpperCase()}`,
      entityType: "Mandate",
      entityId: String(id),
      amount: Number(existing.principal || 0),
      activity: "Mandate Deleted",
      description: `Mandate for "${clientName}" (Principal: GHS ${Number(existing.principal || 0).toLocaleString()}) was permanently deleted.`,
    });
  } catch (logErr) {
    console.error("Activity logging failed in deleteInvestment:", logErr);
  }

  res.status(204).json({ status: "success", data: null });
});

// Manual Rollover Controllers

export const getRolloverCandidates = catchAsync(async (req, res, next) => {
  const { sourceQuarter, targetQuarter } = req.query;
  const currentDate = new Date();
  const currentQuarterName = getQuarter(currentDate); // e.g. "2026-Q3"
  const defaultTargetQuarter = currentQuarterName.split("-")[1] || "Q3";

  const prevDate = new Date(currentDate);
  prevDate.setMonth(prevDate.getMonth() - 3);
  const prevQuarterName = getQuarter(prevDate);
  const defaultSourceQuarter = prevQuarterName.split("-")[1] || "Q2";

  const activeSourceQuarter = sourceQuarter || defaultSourceQuarter;
  const activeTargetQuarter = targetQuarter || defaultTargetQuarter;

  // Find all investments matching source quarter or non-archived active ones
  const query = sourceQuarter
    ? { quarter: sourceQuarter }
    : {
        $or: [
          { quarter: activeSourceQuarter },
          { active: true, archived: false },
        ],
      };

  const investments = await Investment.find(query)
    .select("+archived +active")
    .populate([
      { path: "userId", select: "name displayName email license photo" },
      { path: "owners.user", select: "name displayName email license photo" },
      "addOns",
    ])
    .sort({ createdAt: -1 });

  const candidates = [];
  let totalEndingPrincipal = 0;
  let totalAccruedReturn = 0;
  let totalProjectedRollover = 0;
  let alreadyRolledOverCount = 0;

  for (const inv of investments) {
    // Fresh accruals before quoting closing balance (matches executeSingleRollover).
    await recalculateInvestment(inv._id);
    const freshInv =
      (await Investment.findById(inv._id)
        .select("+archived +active")
        .populate([
          { path: "userId", select: "name displayName email license photo" },
          { path: "owners.user", select: "name displayName email license photo" },
          "addOns",
        ])) || inv;

    // Check if this investment has already been rolled over to activeTargetQuarter
    const existingRollover = await Investment.findOne({
      previousTransactionId: freshInv._id,
      quarter: activeTargetQuarter,
    }).select("transactionId principal quarter createdAt");

    const isRolledOver = !!existingRollover;
    if (isRolledOver) {
      alreadyRolledOverCount++;
    }

    const endingPrincipal = round2(Number(freshInv.principal || 0) + activeAddOnTotal(freshInv));
    const accruedReturn = Number(freshInv.totalAccruedReturn || 0);
    const netClosingBalance = closingBalance(freshInv);
    const suggestedNewPrincipal = netClosingBalance;

    totalEndingPrincipal += endingPrincipal;
    totalAccruedReturn += accruedReturn;
    totalProjectedRollover += suggestedNewPrincipal;

    candidates.push({
      investmentId: freshInv._id,
      transactionId: freshInv.transactionId,
      name: freshInv.name,
      user: freshInv.userId,
      owners: freshInv.owners,
      isJoint: freshInv.isJoint,
      sourceQuarter: freshInv.quarter,
      targetQuarter: activeTargetQuarter,
      startDate: freshInv.startDate,
      quarterEndDate: freshInv.quarterEndDate,
      endingPrincipal,
      accruedReturn,
      netClosingBalance,
      suggestedNewPrincipal,
      guaranteedRate: freshInv.guaranteedRate ?? 8,
      managementFeeRate: freshInv.managementFeeRate ?? 20,
      operationalCost: freshInv.operationalCost ?? 0,
      performanceYield: freshInv.performanceYield ?? 0,
      archived: freshInv.archived,
      active: freshInv.active,
      isRolledOver,
      existingRolloverId: existingRollover?._id || null,
      existingRolloverTransactionId: existingRollover?.transactionId || null,
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      sourceQuarter: activeSourceQuarter,
      targetQuarter: activeTargetQuarter,
      summary: {
        totalCandidates: candidates.length,
        alreadyRolledOverCount,
        pendingCount: candidates.length - alreadyRolledOverCount,
        totalEndingPrincipal,
        totalAccruedReturn,
        totalProjectedRollover,
      },
      candidates,
    },
  });
});

export const executeSingleRollover = catchAsync(async (req, res, next) => {
  const {
    investmentId,
    targetQuarter,
    newPrincipal,
    guaranteedRate = 8,
    managementFeeRate = 20,
    operationalCost = 0,
    performanceYield = 0,
    startDate,
    quarterEndDate,
    notes,
  } = req.body;

  if (!investmentId) {
    return res.status(400).json({ status: "fail", message: "Investment ID is required" });
  }

  // Bring accruals up to date so the closing balance is current before it is carried forward.
  await recalculateInvestment(investmentId);
  const sourceInv = await Investment.findById(investmentId).populate(["userId", "addOns"]);
  if (!sourceInv) {
    return res.status(404).json({ status: "fail", message: "Source mandate not found" });
  }

  const effectiveTargetQuarter = targetQuarter || getQuarter(new Date()).split("-")[1];

  // Prevent duplicate rollover of the same transaction to target quarter
  const existingRollover = await Investment.findOne({
    previousTransactionId: sourceInv._id,
    quarter: effectiveTargetQuarter,
  });

  if (existingRollover) {
    return res.status(400).json({
      status: "fail",
      message: `Mandate has already been rolled over to ${effectiveTargetQuarter} (Transaction ID: ${existingRollover.transactionId})`,
    });
  }

  // 1. Archive the source transaction
  sourceInv.archived = true;
  sourceInv.active = false;
  await sourceInv.save({ validateBeforeSave: false });

  // 2. Compute date range
  const newStartDate = startDate ? new Date(startDate) : nextQuarterStart(sourceInv);
  const defaultQuarterEnd = getQuarterEndDate(newStartDate).toDate();
  const newEndDate = quarterEndDate ? new Date(quarterEndDate) : defaultQuarterEnd;

  const sourceClosingBalance = closingBalance(sourceInv);
  const principalToSet =
    newPrincipal !== undefined && newPrincipal !== null && !isNaN(Number(newPrincipal))
      ? Number(newPrincipal)
      : sourceClosingBalance;

  // 3. Create the newly rolled-over transaction with manual values
  const newTransaction = await Investment.create({
    userId: sourceInv.userId?._id || sourceInv.userId,
    name: sourceInv.name,
    principal: Math.max(0, principalToSet),
    accruedReturn: 0,
    quarter: effectiveTargetQuarter,
    transactionId: generateTransactionId(),
    startDate: newStartDate,
    quarterEndDate: newEndDate,
    archived: false,
    active: true,
    mandate: sourceInv.mandate || [],
    partnerForm: sourceInv.partnerForm || [],
    certificate: sourceInv.certificate || [],
    checklist: sourceInv.checklist || [],
    others: sourceInv.others || [],
    addOns: [],
    previousTransactionId: sourceInv._id,
    owners: sourceInv.owners || [],
    isJoint: sourceInv.isJoint || false,
    guaranteedRate: Number(guaranteedRate),
    managementFeeRate: Number(managementFeeRate),
    operationalCost: Number(operationalCost),
    performanceYield: Number(performanceYield),
    notes: notes || undefined,
  });

  // 4. Recalculate returns immediately
  await recalculateInvestment(newTransaction._id);

  const populatedNewTransaction = await Investment.findById(newTransaction._id).populate([
    { path: "userId", select: "name displayName email license" },
    { path: "owners.user", select: "name displayName email license" },
  ]);

  try {
    const actorUser = req.user?._id || sourceInv.userId?._id || sourceInv.userId;
    const targetUserObj = populatedNewTransaction?.userId || sourceInv.userId;
    const clientName = targetUserObj?.displayName || targetUserObj?.name || sourceInv.name || "Client";
    const clientLicense = targetUserObj?.license || "";
    const rolledPrincipal = Number(newTransaction.principal || 0);

    await ActivityLog.create({
      user: actorUser,
      targetUser: targetUserObj?._id || targetUserObj,
      targetName: clientName,
      targetLicense: clientLicense,
      targetAccount: `Mandate #${String(newTransaction._id).slice(-6).toUpperCase()}`,
      entityType: "Mandate",
      entityId: String(newTransaction._id),
      amount: rolledPrincipal,
      activity: "Mandate Rolled Over",
      description: `Mandate for ${clientName} rolled over into ${effectiveTargetQuarter}. Closing balance of source mandate: GHS ${sourceClosingBalance.toLocaleString()} (principal GHS ${Number(sourceInv.principal || 0).toLocaleString()} + add-ons GHS ${activeAddOnTotal(sourceInv).toLocaleString()} + net accrued GHS ${Number(sourceInv.totalAccruedReturn || 0).toLocaleString()}). New principal: GHS ${rolledPrincipal.toLocaleString()}, starting ${moment(newStartDate).format("YYYY-MM-DD")}.`,
    });
  } catch (logErr) {
    console.error("Activity logging failed in executeSingleRollover:", logErr);
  }

  res.status(201).json({
    status: "success",
    message: "Mandate successfully rolled over with manual values",
    data: populatedNewTransaction,
  });
});

export const executeBatchRollover = catchAsync(async (req, res, next) => {
  const { rollovers, targetQuarter } = req.body;

  if (!Array.isArray(rollovers) || rollovers.length === 0) {
    return res.status(400).json({ status: "fail", message: "Please provide a non-empty rollovers array" });
  }

  const results = [];
  const errors = [];

  for (const item of rollovers) {
    try {
      const {
        investmentId,
        newPrincipal,
        guaranteedRate = 8,
        managementFeeRate = 20,
        operationalCost = 0,
        performanceYield = 0,
        startDate,
        quarterEndDate,
        notes,
      } = item;

      if (!investmentId) {
        errors.push({ investmentId, error: "Missing investment ID" });
        continue;
      }

      await recalculateInvestment(investmentId);
      const sourceInv = await Investment.findById(investmentId).populate("addOns");
      if (!sourceInv) {
        errors.push({ investmentId, error: "Source mandate not found" });
        continue;
      }

      const effectiveTargetQuarter =
        item.targetQuarter || targetQuarter || getQuarter(new Date()).split("-")[1];

      const existingRollover = await Investment.findOne({
        previousTransactionId: sourceInv._id,
        quarter: effectiveTargetQuarter,
      });

      if (existingRollover) {
        errors.push({
          investmentId,
          error: `Already rolled over to ${effectiveTargetQuarter}`,
        });
        continue;
      }

      sourceInv.archived = true;
      sourceInv.active = false;
      await sourceInv.save({ validateBeforeSave: false });

      const newStartDate = startDate ? new Date(startDate) : nextQuarterStart(sourceInv);
      const defaultQuarterEnd = getQuarterEndDate(newStartDate).toDate();
      const newEndDate = quarterEndDate ? new Date(quarterEndDate) : defaultQuarterEnd;

      const principalToSet =
        newPrincipal !== undefined && newPrincipal !== null && !isNaN(Number(newPrincipal))
          ? Number(newPrincipal)
          : closingBalance(sourceInv);

      const newTransaction = await Investment.create({
        userId: sourceInv.userId,
        name: sourceInv.name,
        principal: Math.max(0, principalToSet),
        accruedReturn: 0,
        quarter: effectiveTargetQuarter,
        transactionId: generateTransactionId(),
        startDate: newStartDate,
        quarterEndDate: newEndDate,
        archived: false,
        active: true,
        mandate: sourceInv.mandate || [],
        partnerForm: sourceInv.partnerForm || [],
        certificate: sourceInv.certificate || [],
        checklist: sourceInv.checklist || [],
        others: sourceInv.others || [],
        addOns: [],
        previousTransactionId: sourceInv._id,
        owners: sourceInv.owners || [],
        isJoint: sourceInv.isJoint || false,
        guaranteedRate: Number(guaranteedRate),
        managementFeeRate: Number(managementFeeRate),
        operationalCost: Number(operationalCost),
        performanceYield: Number(performanceYield),
        notes: notes || undefined,
      });

      await recalculateInvestment(newTransaction._id);
      results.push({
        sourceInvestmentId: investmentId,
        newInvestmentId: newTransaction._id,
        transactionId: newTransaction.transactionId,
        principal: newTransaction.principal,
        quarter: newTransaction.quarter,
      });
    } catch (err) {
      errors.push({
        investmentId: item.investmentId,
        error: err?.message || "Rollover failed",
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: `Batch rollover processed: ${results.length} succeeded, ${errors.length} failed`,
    data: {
      succeeded: results,
      errors,
    },
  });
});

/**
 * Daily Accruals Calculation
 * Callable via:
 * 1. Dedicated Cron API: POST /api/v1/investments/accruals/calculate
 * 2. Authenticated Admin: verifyToken with admin or superadmin
 * 3. External Cron Scheduler: header 'x-cron-secret' or '?secret=' matching CRON_SECRET
 * 4. Internal Background Worker / node-cron
 */
export const calculateDailyAccruals = async (req, res, next) => {
  try {
    const CRON_SECRET = process.env.CRON_SECRET || "finvest_accruals_secret_key";

    // When called over HTTP, authenticate via admin JWT or cron secret
    if (req && res) {
      const authHeader = req.headers?.authorization;
      const bearerToken =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;

      const providedSecret =
        req.headers?.["x-cron-secret"] ||
        req.query?.secret ||
        (req.body?.secret ? req.body.secret : null) ||
        bearerToken;

      const isAuthorizedUser =
        req.user && (req.user.role === "admin" || req.user.role === "superadmin");
      const isValidSecret = providedSecret && providedSecret === CRON_SECRET;

      if (!isAuthorizedUser && !isValidSecret) {
        return res.status(401).json({
          status: "fail",
          message:
            "Unauthorized: Please provide a valid 'x-cron-secret' header, '?secret=' parameter, or admin credentials.",
        });
      }
    }

    const quarterDays = getQuarterDetails();

    // Query ONLY active, non-archived mandates
    const investments = await Investment.find({
      active: true,
      archived: false,
    }).select("_id transactionId");

    console.log(
      `[AccrualsEngine] Executing daily calculations for ${investments.length} active mandate(s) via recalculateInvestment...`
    );

    let updatedCount = 0;
    let totalGrossAccrued = 0;
    let totalManagementFees = 0;
    let totalNetAccrued = 0;
    const details = [];

    // Single source of truth: honors lockedPrincipalProfit / lastPrincipalAdjustmentDate.
    for (const investment of investments) {
      await recalculateInvestment(investment._id);
      const fresh = await Investment.findById(investment._id).select(
        "principalAccruedReturn addOnAccruedReturn managementFee totalAccruedReturn transactionId",
      );
      if (!fresh) continue;

      const principalReturn = round2(Number(fresh.principalAccruedReturn || 0));
      const totalAddOnReturn = round2(Number(fresh.addOnAccruedReturn || 0));
      const managementFee = round2(Number(fresh.managementFee || 0));
      const netReturn = round2(Number(fresh.totalAccruedReturn || 0));

      updatedCount++;
      totalGrossAccrued = round2(totalGrossAccrued + principalReturn + totalAddOnReturn);
      totalManagementFees = round2(totalManagementFees + managementFee);
      totalNetAccrued = round2(totalNetAccrued + netReturn);

      details.push({
        investmentId: investment._id,
        transactionId: fresh.transactionId || investment.transactionId,
        principalAccrued: principalReturn,
        addOnAccrued: totalAddOnReturn,
        managementFee,
        totalAccruedReturn: netReturn,
      });
    }

    const resultSummary = {
      activeMandatesChecked: investments.length,
      mandatesUpdated: updatedCount,
      quarterDays,
      totalGrossAccrued,
      totalManagementFees,
      totalNetAccrued,
      timestamp: new Date().toISOString(),
      details,
    };

    if (res) {
      return res.status(200).json({
        status: "success",
        message: `Daily accruals calculated successfully for ${updatedCount} active mandate(s)`,
        data: resultSummary,
      });
    }

    return resultSummary;
  } catch (err) {
    console.error("[AccrualsEngine] Error calculating daily accruals:", err);
    if (res && next) {
      return next(err);
    } else if (res) {
      return res.status(500).json({
        status: "error",
        message: err.message || "Failed to calculate daily accruals",
      });
    }
    throw err;
  }
};

