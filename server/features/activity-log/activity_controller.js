import catchAsync from "../error/catch-async-error.js";
import {
  deleteOne,
  getOne,
  updateOne,
} from "../factory/factory-functions.js";

import ActivityLog from "./activity.model.js";
import Investment from "../investment/model/investment.model.js";
import User from "../auth/models/user.model.js";
import Loan from "../loans/loans.model.js";
import Rental from "../rentals/rentals.model.js";
import Assets from "../assets/model/assets_model.js";

export const createActivityLog = catchAsync(async (req, res, next) => {
  const data = { ...req.body };
  if (!data.user && req.user?._id) {
    data.user = req.user._id;
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
    .populate("targetUser", "name displayName email role license photo designation")
    .lean();

  // Self-heal / Backfill target person for logs where targetUser or targetName is missing
  const enrichedLogs = await Promise.all(
    logs.map(async (log) => {
      // If already resolved with a targetUser or specific targetName, return as-is
      if (
        (log.targetUser && (log.targetUser.displayName || log.targetUser.name)) ||
        (log.targetName && log.targetName !== "System / Master Account" && log.targetName !== "Client")
      ) {
        return log;
      }

      try {
        const desc = log.description || "";
        const act = log.activity || "";

        // 1. Check if description has "ID <hex>" or entityId exists
        let entityId = log.entityId;
        if (!entityId) {
          const idMatch = desc.match(/ID\s+([a-fA-F0-9]{24})/i) || desc.match(/id\s+([a-fA-F0-9]{24})/i);
          if (idMatch) {
            entityId = idMatch[1];
          }
        }

        // Try mandate lookup
        if (
          act.toLowerCase().includes("mandate") ||
          log.entityType === "Mandate" ||
          (!log.entityType && (desc.toLowerCase().includes("mandate") || act.toLowerCase().includes("mandate")))
        ) {
          if (entityId) {
            const inv = await Investment.findById(entityId).populate(
              "userId",
              "name displayName license email"
            ).lean();
            if (inv) {
              const u = inv.userId;
              const resolvedName = u?.displayName || u?.name || inv.name;
              const resolvedLicense = u?.license;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || resolvedLicense,
                  targetAccount: log.targetAccount || `Mandate #${String(entityId).slice(-6).toUpperCase()}`,
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
            const loan = await Loan.findById(entityId).populate(
              "user",
              "name displayName license email"
            ).lean();
            if (loan) {
              const u = loan.user;
              const resolvedName = loan.isExternal ? loan.externalName : (u?.displayName || u?.name);
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || u?.license,
                  targetAccount: log.targetAccount || (loan.isExternal ? "External Loan" : `Loan #${String(entityId).slice(-6).toUpperCase()}`),
                  targetUser: log.targetUser || u,
                  entityType: log.entityType || "Loan",
                };
              }
            }
          }
        }

        // Try rental lookup
        if (act.toLowerCase().includes("rental") || log.entityType === "Rental") {
          if (entityId) {
            const rental = await Rental.findById(entityId).populate(
              "user",
              "name displayName license email"
            ).lean();
            if (rental) {
              const u = rental.user;
              const resolvedName = u?.displayName || u?.name;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || u?.license,
                  targetAccount: log.targetAccount || `Rental #${String(entityId).slice(-6).toUpperCase()}`,
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
            const asset = await Assets.findById(entityId).populate(
              "user",
              "name displayName license email"
            ).lean();
            if (asset) {
              const u = asset.user;
              const resolvedName = u?.displayName || u?.name || asset.assetName;
              if (resolvedName) {
                return {
                  ...log,
                  targetName: resolvedName,
                  targetLicense: log.targetLicense || u?.license,
                  targetAccount: log.targetAccount || `Asset #${String(entityId).slice(-6).toUpperCase()}`,
                  targetUser: log.targetUser || u,
                  entityType: log.entityType || "Asset",
                };
              }
            }
          }
        }

        // Check if description has 'for <name>' or 'for client "<name>"'
        const forMatch = desc.match(/for\s+(?:client\s+)?["']?([A-Za-z0-9\s.-]+?)["']?(?:\s*\(|\s*\.|\s*with|\s*was|$)/i);
        if (forMatch && forMatch[1] && forMatch[1].trim() && forMatch[1].trim().toLowerCase() !== "this client") {
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
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      data: enrichedLogs,
    },
  });
});

export const getActivityLog = getOne(ActivityLog, [
  { path: "user", select: "name displayName email role license photo designation" },
  { path: "targetUser", select: "name displayName email role license photo designation" },
]);
