import catchAsync from "../../error/catch-async-error.js";
import AppError from "../../../utils/appError.js";
import {
  deleteOne,
  getOne,
  updateOne,
} from "../../factory/factory-functions.js";
import ActivityLog from "../../activity-log/activity.model.js";
import User from "../../auth/models/user.model.js";

import AssetsModel from "../model/assets_model.js";

// export const createAsset = createOne(AssetsModel);

export const createAsset = catchAsync(async (req, res, next) => {
  // Extract fields and compute deduction
  const { accruedInterest, managementFee, owners, user, ...otherFields } = req.body;
  const deduction = accruedInterest - (managementFee || 0);

  // Build owners: always include primary user, exclude primary from co-owners, and dedupe
  const inputOwners = Array.isArray(owners) ? owners : [];
  const normalizedCoOwners = inputOwners
    .map((o) => ({ user: o.user || o, role: o.role || "co-owner" }))
    .filter((o) => String(o.user) !== String(user));
  const seen = new Set();
  const uniqueCoOwners = normalizedCoOwners.filter((o) => {
    const key = String(o.user);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const resolvedOwners = [{ user, role: "primary" }, ...uniqueCoOwners];

  const doc = new AssetsModel({
    ...otherFields,
    user,
    owners: resolvedOwners,
    isJoint: resolvedOwners.length > 1,
    accruedInterest,
    managementFee,
    deduction,
  });

  await doc.save();

  try {
    const actorUser = req.user?._id || user;
    let clientName = "Client";
    let clientLicense = "";

    if (user) {
      const u = await User.findById(user).select("name displayName license").lean();
      if (u) {
        clientName = u.displayName || u.name;
        clientLicense = u.license || "";
      }
    }

    await ActivityLog.create({
      user: actorUser || undefined,
      targetUser: user,
      targetName: clientName,
      targetLicense: clientLicense,
      targetAccount: `Asset #${String(doc._id).slice(-6).toUpperCase()}`,
      entityType: "Asset",
      entityId: String(doc._id),
      amount: Number(doc.assetValue || 0),
      activity: "New Asset Created",
      description: `Asset "${doc.assetName || 'Asset'}" (Valued at GHS ${Number(doc.assetValue || 0).toLocaleString()}) created for ${clientName}`,
    });
  } catch (logErr) {
    console.error("Activity logging failed in createAsset:", logErr);
  }

  res.status(201).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const deleteAsset = deleteOne(AssetsModel);
export const updateAsset = updateOne(AssetsModel);
export const getAllAssets = catchAsync(async (req, res, next) => {
  const doc = await AssetsModel.find().populate(["user", { path: "owners.user" }]);
  res.status(200).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

export const getAsset = getOne(AssetsModel);

export const getAssetByUser = catchAsync(async (req, res, next) => {
  // Ensure that req.user exists
  if (!req.user) {
    return next(new AppError("User not found. Please log in.", 401)); // Return an error if req.user is not found
  }

  console.log(req.user); // Log the user object to see if it's set correctly
  console.log("getAssetByUser", req.user._id);

  const assets = await AssetsModel.find({ "owners.user": req.user._id }).populate([{ path: "owners.user" }, "user"]);
  res.status(200).json({
    status: "success",
    data: {
      data: assets,
    },
  });
});
