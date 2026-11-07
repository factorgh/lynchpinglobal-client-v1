import catchAsync from "../error/catch-async-error.js";
import { deleteOne, getOne, updateOne } from "../factory/factory-functions.js";

import ActivityLog from "./activity.model.js";
import Investment from "../investment/model/investment.model.js";
import User from "../auth/models/user.model.js";
import Loan from "../loans/loans.model.js";
import Rental from "../rentals/rentals.model.js";
import Assets from "../assets/model/assets_model.js";
import Withdrawal from "../withdrawals/withdrawal.model.js";
import Payment from "../payments/payments.model.js";
import Upload from "../uploads/upload.model.js";

const targetProjection = "name displayName license email";

const resolveActivityTarget = async (log) => {
  const existingTarget = log.targetUser;
  if (existingTarget && typeof existingTarget === "object" && (existingTarget.name || existingTarget.displayName)) {
    return existingTarget;
  }

  if (existingTarget) {
    const targetUser = await User.findById(existingTarget).select(targetProjection).lean();
    if (targetUser) return targetUser;
  }

  if (!log.entityId) return null;

  const type = String(log.entityType || "").toLowerCase().replace(/[^a-z]/g, "");
  let entity = null;
  let targetUser = null;

  if (["user", "client"].includes(type)) {
    return User.findById(log.entityId).select(targetProjection).lean();
  }

  if (["mandate", "investment"].includes(type)) {
    entity = await Investment.findById(log.entityId).populate("userId", targetProjection).lean();
    targetUser = entity?.userId;
  } else if (type === "addon") {
    entity = await Investment.findOne({ addOns: log.entityId }).populate("userId", targetProjection).lean();
    targetUser = entity?.userId;
  } else if (["payment"].includes(type)) {
    entity = await Payment.findById(log.entityId).populate("user", targetProjection).lean();
    targetUser = entity?.user;
  } else if (["disbursement", "withdrawal"].includes(type)) {
    entity = await Withdrawal.findById(log.entityId).populate("user", targetProjection).lean();
    targetUser = entity?.user;
  } else if (["asset", "assettransaction"].includes(type)) {
    entity = await Assets.findById(log.entityId).populate("user", targetProjection).lean();
    targetUser = entity?.user;
  } else if (type === "loan") {
    entity = await Loan.findById(log.entityId).populate("user", targetProjection).lean();
    targetUser = entity?.user;
  } else if (type === "rental") {
    entity = await Rental.findById(log.entityId).populate("user", targetProjection).lean();
    targetUser = entity?.user;
  } else if (["clientdocument", "upload"].includes(type)) {
    entity = await Upload.findById(log.entityId).populate("user", targetProjection).lean();
    targetUser = entity?.user;
  }

  if (targetUser && typeof targetUser === "object") return targetUser;
  if (entity?.isExternal && entity.externalName) {
    return { name: entity.externalName, displayName: entity.externalName };
  }
  if (entity?.assetName) {
    return { name: entity.assetName, displayName: entity.assetName };
  }
  return null;
};

const enrichActivityTarget = async (log) => {
  const targetUser = await resolveActivityTarget(log);
  if (!targetUser) return log;

  const targetName = targetUser.displayName || targetUser.name;
  return {
    ...log,
    targetUser: log.targetUser && typeof log.targetUser === "object" ? log.targetUser : targetUser,
    targetName: targetName || log.targetName,
    targetLicense: log.targetLicense || targetUser.license,
  };
};

export const createActivityLog = catchAsync(async (req, res, next) => {
  const data = { ...req.body };
  if (!data.user && req.user?._id) {
    data.user = req.user._id;
  }
  try {
    const enriched = await enrichActivityTarget(data);
    Object.assign(data, enriched);
  } catch (err) {
    // Keep activity recording resilient if the related entity is unavailable.
  }
  const doc = await ActivityLog.create(data);
  res.status(201).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const deleteActivityLog = deleteOne(ActivityLog);
export const updateActivityLog = updateOne(ActivityLog);

export const getAllActivityLogs = catchAsync(async (req, res, next) => {
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .populate("user", "name displayName email role license photo designation")
    .populate(
      "targetUser",
      "name displayName email role license photo designation",
    )
    .lean();

  // Self-heal / Backfill target person for logs where targetUser or targetName is missing
  const enrichedLogs = await Promise.all(
    logs.map(async (log) => {
      // If already resolved with a targetUser or specific targetName, return as-is
      if (
        (log.targetUser &&
          (log.targetUser.displayName || log.targetUser.name)) ||
        (log.targetName &&
          log.targetName !== "System / Master Account" &&
          log.targetName !== "Client")
      ) {
        return log;
      }

      try {
        const generallyEnriched = await enrichActivityTarget(log);
        if (generallyEnriched.targetName && generallyEnriched.targetName !== "System / Master Account" && generallyEnriched.targetName !== "Client") {
          return generallyEnriched;
        }

        const desc = log.description || "";
        const act = log.activity || "";

        // 1. Check if description has "ID <hex>" or entityId exists
        let entityId = log.entityId;
        if (!entityId) {
          const idMatch =
            desc.match(/ID\s+([a-fA-F0-9]{24})/i) ||
            desc.match(/id\s+([a-fA-F0-9]{24})/i);
          if (idMatch) {
            entityId = idMatch[1];
          }
        }

        // Resolve disbursement targets from the withdrawal record, including legacy logs.
        if (
          act.toLowerCase().includes("withdrawal") ||
          act.toLowerCase().includes("disbursement") ||
          log.entityType === "Disbursement"
        ) {
          const withdrawal = entityId
            ? await Withdrawal.findById(entityId)
                .populate("user", "name displayName license email")
                .lean()
            : null;

          if (withdrawal?.user) {
            const targetUser = withdrawal.user;
            const resolvedName = targetUser.displayName || targetUser.name;
            if (resolvedName) {
              return {
                ...log,
                targetUser: log.targetUser || targetUser,
                targetName: resolvedName,
                targetLicense: log.targetLicense || targetUser.license,
                targetAccount:
                  log.targetAccount ||
                  `Disbursement #DISB-${String(withdrawal._id).slice(-6).toUpperCase()}`,
                entityType: log.entityType || "Disbursement",
                entityId: log.entityId || String(withdrawal._id),
              };
            }
          }

          // Older controller logs may contain the client ID in their description only.
          const userIdMatch = desc.match(/user\s+([a-fA-F0-9]{24})/i);
          if (userIdMatch) {
            const targetUser = await User.findById(userIdMatch[1])
              .select("name displayName license email")
              .lean();
            if (targetUser) {
              return {
                ...log,
                targetUser: log.targetUser || targetUser,
                targetName:
                  targetUser.displayName || targetUser.name || log.targetName,
                targetLicense: log.targetLicense || targetUser.license,
                entityType: log.entityType || "Disbursement",
              };
            }
          }
        }

        // Try mandate lookup
        if (
          act.toLowerCase().includes("mandate") ||
          log.entityType === "Mandate" ||
          (!log.entityType &&
            (desc.toLowerCase().includes("mandate") ||
              act.toLowerCase().includes("mandate")))
        ) {
          if (entityId) {
            const inv = await Investment.findById(entityId)
              .populate("userId", "name displayName license email")
              .lean();
            if (inv) {
              const u = inv.userId;
              const resolvedName = u?.displayName || u?.name || inv.name;
              const resolvedLicense = u?.license;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || resolvedLicense,
                  targetAccount:
                    log.targetAccount ||
                    `Mandate #${String(entityId).slice(-6).toUpperCase()}`,
                  targetUser: log.targetUser || u,
                  entityType: log.entityType || "Mandate",
                };
              }
            }
          }
        }

        // Try loan lookup
        if (act.toLowerCase().includes("loan") || log.entityType === "Loan") {
          if (entityId) {
            const loan = await Loan.findById(entityId)
              .populate("user", "name displayName license email")
              .lean();
            if (loan) {
              const u = loan.user;
              const resolvedName = loan.isExternal
                ? loan.externalName
                : u?.displayName || u?.name;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || u?.license,
                  targetAccount:
                    log.targetAccount ||
                    (loan.isExternal
                      ? "External Loan"
                      : `Loan #${String(entityId).slice(-6).toUpperCase()}`),
                  targetUser: log.targetUser || u,
                  entityType: log.entityType || "Loan",
                };
              }
            }
          }
        }

        // Try rental lookup
        if (
          act.toLowerCase().includes("rental") ||
          log.entityType === "Rental"
        ) {
          if (entityId) {
            const rental = await Rental.findById(entityId)
              .populate("user", "name displayName license email")
              .lean();
            if (rental) {
              const u = rental.user;
              const resolvedName = u?.displayName || u?.name;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || u?.license,
                  targetAccount:
                    log.targetAccount ||
                    `Rental #${String(entityId).slice(-6).toUpperCase()}`,
                  targetUser: log.targetUser || u,
                  entityType: log.entityType || "Rental",
                };
              }
            }
          }
        }

        // Try asset lookup
        if (act.toLowerCase().includes("asset") || log.entityType === "Asset") {
          if (entityId) {
            const asset = await Assets.findById(entityId)
              .populate("user", "name displayName license email")
              .lean();
            if (asset) {
              const u = asset.user;
              const resolvedName = u?.displayName || u?.name || asset.assetName;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || u?.license,
                  targetAccount:
                    log.targetAccount ||
                    `Asset #${String(entityId).slice(-6).toUpperCase()}`,
                  targetUser: log.targetUser || u,
                  entityType: log.entityType || "Asset",
                };
              }
            }
          }
        }

        // Check if description has 'for <name>' or 'for client "<name>"'
        const forMatch = desc.match(
          /for\s+(?:client\s+)?["']?([A-Za-z0-9\s.-]+?)["']?(?:\s*\(|\s*\.|\s*with|\s*was|$)/i,
        );
        if (
          forMatch &&
          forMatch[1] &&
          forMatch[1].trim() &&
          forMatch[1].trim().toLowerCase() !== "this client"
        ) {
          const extractedName = forMatch[1].trim();
          return {
            ...log,
            targetName: extractedName,
          };
        }
      } catch (err) {
        // Fall back gracefully
      }

      return log;
    }),
  );

  res.status(200).json({
    status: "success",
    data: {
      data: enrichedLogs,
    },
  });
});

export const getActivityLog = getOne(ActivityLog, [
  {
    path: "user",
    select: "name displayName email role license photo designation",
  },
  {
    path: "targetUser",
    select: "name displayName email role license photo designation",
  },
]);
