import AppError from "../../../utils/appError.js";
import catchAsync from "../../error/catch-async-error.js";
import User from "../models/user.model.js";
import ActivityLog from "../../activity-log/activity.model.js";

const filteredObj = (obj, ...allowedFields) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const updateMe = catchAsync(async (req, res, next) => {
  //  Create an error if user tries to update password

  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  // Filter object to limit updating fields
  const filteredBody = filteredObj(
    req.body,
    "name",
    "email",
    "displayName",
    "phone",
    "photo",
    "agreedToTerms",
    "agreedToTermsAt",
    "mustChangePassword"
  );

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "succes",
    updatedUser,
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const {
    name,
    displayName,
    email,
    password,
    passwordConfirm,
    license,
    role = "user",
    designation,
    phone,
    photo,
  } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email, and password are required", 400));
  }

  const sanitizedEmail = String(email).trim().toLowerCase();
  const sanitizedName = String(name).trim();
  const sanitizedDisplayName =
    displayName && String(displayName).trim()
      ? String(displayName).trim()
      : sanitizedName;

  // Check if email already exists
  const existingEmail = await User.findOne({ email: sanitizedEmail });
  if (existingEmail) {
    return next(new AppError("Email already registered", 400));
  }

  // Check if name already exists
  const existingName = await User.findOne({ name: sanitizedName });
  if (existingName) {
    return next(new AppError("Username already exists", 400));
  }

  const effectivePasswordConfirm = passwordConfirm || password;

  const userData = {
    name: sanitizedName,
    displayName: sanitizedDisplayName,
    email: sanitizedEmail,
    password,
    passwordConfirm: effectivePasswordConfirm,
    role,
    designation: designation ? String(designation).trim() : undefined,
    phone: phone ? String(phone).trim() : undefined,
    photo: photo ? String(photo).trim() : undefined,
    mustChangePassword: true,
    agreedToTerms: false,
  };

  if (license && String(license).trim()) {
    userData.license = String(license).trim();
  }

  const newUser = await User.create(userData);
  newUser.password = undefined;

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
    user: newUser,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const allUsers = await User.find({ role: "user" });
  console.log("allUsers", allUsers);
  res.status(200).json({
    status: "success",
    allUsers,
  });
});
export const getAllAdmin = catchAsync(async (req, res, next) => {
  const users = await User.find({ role: "admin" });

  res.status(200).json({
    status: "success",
    users,
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({
    status: "success",
    user,
  });
});

// Delete a user
export const deleteUser = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndDelete(req.params.id);

  if (doc) {
    try {
      await ActivityLog.create({
        user: req.user?._id || doc._id,
        activity: "User Deleted",
        description: `User "${doc.name || doc.displayName || doc.email}" (${doc.license || doc._id}) was deleted`,
      });
    } catch (err) {
      console.error("Activity logging failed in deleteUser:", err);
    }
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Update a user
export const updateUser = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    updatedUser,
  });
});

// Tour tracking controllers
export const getSeenTours = catchAsync(async (req, res, next) => {
  const userId = req.user?.id || req.user?._id;
  const user = await User.findById(userId).select("seenTours");
  res.status(200).json({
    status: "success",
    seenTours: user?.seenTours || [],
  });
});

export const markTourSeen = catchAsync(async (req, res, next) => {
  const userId = req.user?.id || req.user?._id;
  const { tourKey } = req.body;
  if (!tourKey) {
    return next(new AppError("Please provide a tourKey", 400));
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { seenTours: tourKey } },
    { new: true, runValidators: true }
  ).select("seenTours");

  res.status(200).json({
    status: "success",
    seenTours: user?.seenTours || [],
  });
});

export const resetSeenTours = catchAsync(async (req, res, next) => {
  const userId = req.user?.id || req.user?._id;
  const { tourKey } = req.body || {};
  const update =
    tourKey && tourKey !== "all"
      ? { $pull: { seenTours: tourKey } }
      : { $set: { seenTours: [] } };

  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  }).select("seenTours");

  res.status(200).json({
    status: "success",
    seenTours: user?.seenTours || [],
  });
});
