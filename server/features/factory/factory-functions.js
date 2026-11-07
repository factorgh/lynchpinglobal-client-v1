import APIFeatures from "../../utils/apiFeatures.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import ActivityLog from "../activity-log/activity.model.js";
import User from "../auth/models/user.model.js";

const getModelLabel = (modelName) => {
  if (modelName === "Assets") return "Asset Transaction";
  if (modelName === "Loan") return "Loan";
  if (modelName === "Rental") return "Rental";
  if (modelName === "User") return "User";
  if (modelName === "AddOn") return "Add-on";
  if (modelName === "Payment") return "Payment";
  if (modelName === "Withdrawal") return "Disbursement";
  if (modelName === "Investment") return "Mandate";
  return modelName;
};

const resolveTargetDetails = async (doc, Model) => {
  let targetUser = doc.user || doc.userId || (Model.modelName === "User" ? doc._id : null);
  let targetName = doc.displayName || doc.name || null;
  let targetLicense = doc.license || null;

  if (doc.isExternal && doc.externalName) {
    targetName = doc.externalName;
  }

  if (targetUser && (!targetName || !targetLicense)) {
    try {
      const u = await User.findById(targetUser).select("name displayName license email").lean();
      if (u) {
        if (!targetName) targetName = u.displayName || u.name;
        if (!targetLicense) targetLicense = u.license;
      }
    } catch {}
  }

  const modelLabel = getModelLabel(Model.modelName);
  const targetAccount =
    doc.transactionId ||
    doc.rentalName ||
    (doc.isExternal ? "External Loan" : `${modelLabel} #${String(doc._id).slice(-6).toUpperCase()}`);

  const amount = doc.amount || doc.principal || doc.loanAmount || doc.assetValue || undefined;

  return { targetUser, targetName, targetLicense, targetAccount, amount, modelLabel };
};

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    if (Model.modelName !== "ActivityLog") {
      try {
        const { targetUser, targetName, targetLicense, targetAccount, amount, modelLabel } =
          await resolveTargetDetails(doc, Model);

        const description =
          targetName
            ? `${modelLabel} for "${targetName}"${amount ? ` (GHS ${Number(amount).toLocaleString()})` : ""} was deleted`
            : doc.name
            ? `${modelLabel} "${doc.name}" was deleted`
            : amount
            ? `${modelLabel} entry with amount GHS ${Number(amount).toLocaleString()} was deleted`
            : `${modelLabel} entry with ID ${doc._id} was deleted`;

        const logUser = req.user?._id || doc.user || (Model.modelName === "User" ? doc._id : null);

        if (logUser) {
          await ActivityLog.create({
            user: logUser,
            targetUser: targetUser || undefined,
            targetName: targetName || undefined,
            targetLicense: targetLicense || undefined,
            targetAccount,
            entityType: modelLabel,
            entityId: String(doc._id),
            amount,
            activity: `${modelLabel} Deleted`,
            description,
          });
        }
      } catch (logErr) {
        console.error("Activity logging failed in deleteOne:", logErr);
      }
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    if (Model.modelName !== "ActivityLog") {
      try {
        const { targetUser, targetName, targetLicense, targetAccount, amount, modelLabel } =
          await resolveTargetDetails(doc, Model);

        const description =
          targetName
            ? `${modelLabel} for "${targetName}"${amount ? ` (GHS ${Number(amount).toLocaleString()})` : ""} was updated`
            : `${modelLabel} entry with ID ${doc._id} was updated`;

        const logUser = req.user?._id || doc.user || (Model.modelName === "User" ? doc._id : null);

        if (logUser) {
          await ActivityLog.create({
            user: logUser,
            targetUser: targetUser || undefined,
            targetName: targetName || undefined,
            targetLicense: targetLicense || undefined,
            targetAccount,
            entityType: modelLabel,
            entityId: String(doc._id),
            amount,
            activity: `${modelLabel} Updated`,
            description,
          });
        }
      } catch (logErr) {
        console.error("Activity logging failed in updateOne:", logErr);
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (Model.modelName !== "ActivityLog" && Model.modelName !== "Notification") {
      try {
        const { targetUser, targetName, targetLicense, targetAccount, amount, modelLabel } =
          await resolveTargetDetails(doc, Model);

        const description =
          targetName
            ? `New ${modelLabel.toLowerCase()} created for "${targetName}"${amount ? ` with initial amount GHS ${Number(amount).toLocaleString()}` : ""}`
            : `A new ${modelLabel.toLowerCase()} was created`;

        const logUser = req.user?._id || doc.user || (Model.modelName === "User" ? doc._id : null);

        if (logUser) {
          await ActivityLog.create({
            user: logUser,
            targetUser: targetUser || undefined,
            targetName: targetName || undefined,
            targetLicense: targetLicense || undefined,
            targetAccount,
            entityType: modelLabel,
            entityId: String(doc._id),
            amount,
            activity: `New ${modelLabel} Created`,
            description,
          });
        }
      } catch (logErr) {
        console.error("Activity logging failed in createOne:", logErr);
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Here we make sure to apply the sorting based on 'createdAt' in descending order
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort({ createdAt: -1 })
      .limitFields()
      .paginate();

    // Get documents based on the applied features
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
