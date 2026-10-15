import catchAsync from "../error/catch-async-error.js";
import {
  createOne,
  deleteOne,
  getOne,
  updateOne,
} from "../factory/factory-functions.js";

import ActivityLog from "./activity.model.js";

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
// export const getAllActivityLogs = getAll(ActivityLog);

export const getAllActivityLogs = catchAsync(async (req, res, next) => {
  const payments = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .populate("user");

  res.status(200).json({
    status: "success",
    data: {
      data: payments,
    },
  });
});
export const getActivityLog = getOne(ActivityLog);
