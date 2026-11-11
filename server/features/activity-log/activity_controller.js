import catchAsync from "../error/catch-async-error.js";
import mongoose from "mongoose";
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

const normalizeEntityType = (log) => {
  const declaredType = String(log.entityType || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const activityText =
    `${log.activity || ""} ${log.description || ""}`.toLowerCase();

  if (["user", "client"].includes(declaredType)) return "user";
  if (["mandate", "investment"].includes(declaredType)) return "mandate";
  if (["addon", "addons"].includes(declaredType)) return "addon";
  if (["payment", "payments"].includes(declaredType)) return "payment";
  if (["disbursement", "withdrawal", "withdrawals"].includes(declaredType))
    return "disbursement";
  if (
    ["asset", "assets", "assettransaction", "assettransactions"].includes(
      declaredType,
    )
  )
    return "asset";
  if (["loan", "loans"].includes(declaredType)) return "loan";
  if (["rental", "rentals"].includes(declaredType)) return "rental";
  if (["clientdocument", "upload", "uploads"].includes(declaredType))
    return "upload";

  if (/withdrawal|disbursement/.test(activityText)) return "disbursement";
  if (/mandate|investment/.test(activityText)) return "mandate";
  if (/add[- ]?on/.test(activityText)) return "addon";
  if (/payment/.test(activityText)) return "payment";
  if (/asset/.test(activityText)) return "asset";
  if (/loan/.test(activityText)) return "loan";
  if (/rental/.test(activityText)) return "rental";
  if (/user|client account|profile/.test(activityText)) return "user";
  if (/document|upload/.test(activityText)) return "upload";
  return null;
};

const getActivityEntityId = (log) => {
  if (log.entityId) return String(log.entityId);
  const description = String(log.description || "");
  const match =
    description.match(/\b(?:entity\s+)?id\s*[:#]?\s*([a-f\d]{24})\b/i) ||
    description.match(/\b([a-f\d]{24})\b/i);
  return match?.[1] || null;
};

const resolveActivityTarget = async (log) => {
  const entityId = getActivityEntityId(log);
  const entityType = normalizeEntityType(log);
  let entity = null;
  let targetUser = null;

  if (entityId && entityType === "user") {
    targetUser = await User.findById(entityId).select(targetProjection).lean();
  } else if (entityId && entityType === "mandate") {
    entity = await Investment.findById(entityId)
      .populate("userId", targetProjection)
      .lean();
    targetUser = entity?.userId;
  } else if (entityId && entityType === "addon") {
    entity = await Investment.findOne({ addOns: entityId })
      .populate("userId", targetProjection)
      .lean();
    targetUser = entity?.userId;
  } else if (entityId && entityType === "payment") {
    entity = await Payment.findById(entityId)
      .populate("user", targetProjection)
      .lean();
    targetUser = entity?.user;
  } else if (entityId && entityType === "disbursement") {
    entity = await Withdrawal.findById(entityId)
      .populate("user", targetProjection)
      .lean();
    targetUser = entity?.user;
  } else if (entityId && entityType === "asset") {
    entity = await Assets.findById(entityId)
      .populate("user", targetProjection)
      .lean();
    targetUser = entity?.user;
  } else if (entityId && entityType === "loan") {
    entity = await Loan.findById(entityId)
      .populate("user", targetProjection)
      .lean();
    targetUser = entity?.user;
  } else if (entityId && entityType === "rental") {
    entity = await Rental.findById(entityId)
      .populate("user", targetProjection)
      .lean();
    targetUser = entity?.user;
  } else if (entityId && entityType === "upload") {
    entity = await Upload.findById(entityId)
      .populate("user", targetProjection)
      .lean();
    targetUser = entity?.user;
  }

  if (targetUser && typeof targetUser === "object") return targetUser;
  if (entity?.isExternal && entity.externalName) {
    return { name: entity.externalName, displayName: entity.externalName };
  }
  if (entity?.assetName) {
    return { name: entity.assetName, displayName: entity.assetName };
  }
  if (entity?.name && entityType === "mandate") {
    return { name: entity.name, displayName: entity.name };
  }

  // Legacy logs sometimes stored only the affected user's ID in the description.
  const descriptionUserId = String(log.description || "").match(
    /\buser\s+(?:id\s*)?([a-f\d]{24})\b/i,
  )?.[1];
  if (descriptionUserId) {
    targetUser = await User.findById(descriptionUserId)
      .select(targetProjection)
      .lean();
    if (targetUser) return targetUser;
  }

  const existingTarget = log.targetUser;
  if (existingTarget && typeof existingTarget === "object") {
    if (existingTarget.name || existingTarget.displayName)
      return existingTarget;
  } else if (existingTarget) {
    targetUser = await User.findById(existingTarget)
      .select(targetProjection)
      .lean();
    if (targetUser) return targetUser;
  }

  const existingName = String(log.targetName || "").trim();
  if (existingName && !isPlaceholderTargetName(existingName)) {
    return {
      name: existingName,
      displayName: existingName,
      license: log.targetLicense,
    };
  }
  return null;
};

const isPlaceholderTargetName = (name) =>
  /^(?:system\s*\/\s*master\s*account|client(?:\s*\([^)]*\))?|unknown|n\/a)$/i.test(
    String(name || "").trim(),
  );

const enrichActivityTarget = async (log) => {
  const targetUser = await resolveActivityTarget(log);
  if (!targetUser) return log;

  const targetName = targetUser.displayName || targetUser.name;
  return {
    ...log,
    targetUser,
    targetName: targetName || log.targetName,
    targetLicense: log.targetLicense || targetUser.license,
    entityId: log.entityId || getActivityEntityId(log) || undefined,
    entityType: log.entityType || normalizeEntityType(log) || undefined,
  };
};

export const createActivityLog = catchAsync(async (req, res, next) => {
  const data = { ...req.body };
  // The actor is always the authenticated user; never trust a client-supplied actor.
  if (req.user?._id) {
    data.user = req.user._id;
  }
  const originalTargetUser = data.targetUser;
  try {
    const enriched = await enrichActivityTarget(data);
    Object.assign(data, enriched);
  } catch (err) {
    // Keep activity recording resilient if the related entity is unavailable.
  }
  // Enrichment returns a populated object; persist only the reference (deleted users have no _id here).
  if (data.targetUser && typeof data.targetUser === "object") {
    data.targetUser = data.targetUser._id || originalTargetUser;
  }
  if (data.targetUser && !mongoose.isValidObjectId(String(data.targetUser))) {
    delete data.targetUser;
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
      const hasResolvedTarget = Boolean(
        log.targetUser &&
        typeof log.targetUser === "object" &&
        (log.targetUser.displayName || log.targetUser.name),
      );
      const hasSpecificName = Boolean(
        log.targetName && !isPlaceholderTargetName(log.targetName),
      );
      const hasEntityReference = Boolean(
        getActivityEntityId(log) && normalizeEntityType(log),
      );

      // Re-resolve records with an entity reference so stale or generic names are repaired.
      if (hasSpecificName && !hasEntityReference) {
        return log;
      }

      try {
        const generallyEnriched = await enrichActivityTarget(log);
        if (
          generallyEnriched.targetName &&
          !isPlaceholderTargetName(generallyEnriched.targetName)
        ) {
          return generallyEnriched;
        }

        if (hasResolvedTarget) return log;

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

        // Last-resort fallback for older records with a readable name in the description.
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
