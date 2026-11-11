import catchAsync from "../../error/catch-async-error.js";
import AppError from "../../../utils/appError.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "../../factory/factory-functions.js";

import Notification from "../models/notification.js";

export const createNotification = createOne(Notification);

export const deleteNotification = deleteOne(Notification);
export const updateNotification = updateOne(Notification);
export const getAllNotifications = getAll(Notification);
export const getNotification = getOne(Notification);

// Read all notifications
// Controller method for marking all notifications as read
export const readAllNotifications = catchAsync(async (req, res, next) => {
  try {
    // Only the logged-in user's own notifications can be marked as read.
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Please log in",
      });
    }

    const result = await Notification.updateMany(
      {
        users: userId,
        read: false,
      },
      { $set: { read: true } }
    );

    res.status(200).json({
      status: "success",
      data: {
        message: "All notifications marked as read",
        modified: result.modifiedCount || 0,
      },
    });
  } catch (err) {
    return next(err); // Let your global error handler deal with the error
  }
});

// Get notification by specific user
export const getNotificationByUser = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found. Please log in.", 401)); // Return an error if req.user is not found
  }
  // Use $in to find notifications where the user's _id is in the 'users' array
  const notifications = await Notification.find({
    users: req.user._id,
  }).sort({ createdAt: -1 });

  // Always 200 with the user's own list (possibly empty) so stale data is never kept by the client cache.
  res.status(200).json({
    status: "success",
    data: notifications || [],
  });
});
