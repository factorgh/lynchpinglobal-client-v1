import APIFeatures from "../../utils/apiFeatures.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../error/catch-async-error.js";
import ActivityLog from "../activity-log/activity.model.js";

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    if (Model.modelName !== "ActivityLog") {
      try {
        const modelLabel =
          Model.modelName === "Assets"
            ? "Asset Transaction"
            : Model.modelName === "Loan"
            ? "Loan"
            : Model.modelName === "Rental"
            ? "Rental"
            : Model.modelName === "User"
            ? "User"
            : Model.modelName === "AddOn"
            ? "Add-on"
            : Model.modelName;

        const description =
          doc.name
            ? `${modelLabel} "${doc.name}" was deleted`
            : doc.amount
            ? `${modelLabel} entry with amount GHS ${doc.amount} was deleted`
            : `${modelLabel} entry with ID ${doc._id} was deleted`;

        const logUser = req.user?._id || doc.user || (Model.modelName === "User" ? doc._id : null);
        if (logUser) {
          await ActivityLog.create({
            user: logUser,
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
