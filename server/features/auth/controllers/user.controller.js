import AppError from "../../../utils/appError.js";
import catchAsync from "../../error/catch-async-error.js";
import User from "../models/user.model.js";
import {
  logActivity,
  diffFields,
  describeChanges,
} from "../../activity-log/logActivity.js";

const filteredObj = (obj, ...allowedFields) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAdminRole = (user) => ["admin", "superadmin"].includes(user?.role);

const PROFILE_FIELDS = {
  name: "Username",
  displayName: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  license: "Client ID",
  role: "System Role",
  designation: "Designation",
  photo: "Profile Photo",
};

const userLabel = (u) => u?.displayName || u?.name || u?.email || "User";

// Returns an error message when username / email / client ID is already used by another account.
const findCredentialConflict = async (updates, excludeId) => {
  const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};
  if (updates.name) {
    const taken = await User.findOne({
      ...notSelf,
      name: new RegExp(`^${escapeRegex(updates.name)}$`, "i"),
    }).select("_id");
    if (taken) return "That username is already taken. Please choose another.";
  }
  if (updates.email) {
    const taken = await User.findOne({ ...notSelf, email: updates.email }).select("_id");
    if (taken) return "That email address is already registered to another account.";
  }
  if (updates.license) {
    const taken = await User.findOne({ ...notSelf, license: updates.license }).select("_id");
    if (taken) return `Client ID "${updates.license}" is already assigned to another account.`;
  }
  return null;
};

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  // mustChangePassword is only cleared by a successful password change.
  const filteredBody = filteredObj(
    req.body,
    "name",
    "email",
    "displayName",
    "phone",
    "photo",
    "agreedToTerms",
    "agreedToTermsAt"
  );
  if (typeof filteredBody.name === "string") filteredBody.name = filteredBody.name.trim();
  if (typeof filteredBody.displayName === "string")
    filteredBody.displayName = filteredBody.displayName.trim();
  if (typeof filteredBody.email === "string")
    filteredBody.email = filteredBody.email.trim().toLowerCase();
  if (filteredBody.name === "") delete filteredBody.name;
  if (filteredBody.email === "") delete filteredBody.email;

  const before = await User.findById(req.user._id).lean();
  if (!before) return next(new AppError("User not found", 404));

  const conflict = await findCredentialConflict(
    {
      name: filteredBody.name !== before.name ? filteredBody.name : undefined,
      email: filteredBody.email !== before.email ? filteredBody.email : undefined,
    },
    before._id
  );
  if (conflict) return next(new AppError(conflict, 400));

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  const changes = diffFields(before, updatedUser.toObject(), PROFILE_FIELDS);
  if (changes.length) {
    await logActivity({
      req,
      activity: "User Profile Updated",
      description: `${userLabel(updatedUser)} updated their own profile. ${describeChanges(changes)}`,
      target: updatedUser,
      targetAccount: `@${updatedUser.name}`,
      entityType: "User",
      entityId: updatedUser._id,
      changes,
    });
  }
  if (filteredBody.agreedToTerms === true && !before.agreedToTerms) {
    await logActivity({
      req,
      activity: "Mandate Governance Accepted",
      description: `${userLabel(updatedUser)} accepted the Client Onboarding & Mandate Governance terms.`,
      target: updatedUser,
      targetAccount: `@${updatedUser.name}`,
      entityType: "User",
      entityId: updatedUser._id,
    });
  }

  res.status(200).json({
    status: "success",
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

  const conflict = await findCredentialConflict({
    name: sanitizedName,
    email: sanitizedEmail,
    license: license ? String(license).trim() : undefined,
  });
  if (conflict) return next(new AppError(conflict, 400));

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

  await logActivity({
    req,
    activity: "User Account Created",
    description: `${role === "user" ? "Client" : "Admin"} account "${userLabel(newUser)}" (@${newUser.name}, ${newUser.email}, Client ID ${newUser.license || "—"}) was created with a temporary password.`,
    target: newUser,
    targetAccount: `@${newUser.name}`,
    entityType: "User",
    entityId: newUser._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
    user: newUser,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const query = {};
  if (req.query?.role && req.query.role !== "all") {
    query.role = req.query.role;
  }
  const allUsers = await User.find(query).sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    allUsers,
  });
});
export const getAllAdmin = catchAsync(async (req, res, next) => {
  // Clients use this list to address requests, so only expose identifying fields to them.
  const query = User.find({
    role: { $in: ["admin", "superadmin"] },
  }).sort({ createdAt: -1 });
  if (!isAdminRole(req.user)) query.select("_id name displayName role");
  const users = await query;

  res.status(200).json({
    status: "success",
    users,
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  if (!isAdminRole(req.user) && String(req.user?._id) !== String(req.params.id)) {
    return next(new AppError("You do not have permission to view this account", 403));
  }
  const user = await User.findById(req.params.id);
  res.status(200).json({
    status: "success",
    user,
  });
});

// Delete a user
export const deleteUser = catchAsync(async (req, res, next) => {
  if (String(req.user?._id) === String(req.params.id)) {
    return next(new AppError("You cannot delete your own account from User Management", 400));
  }

  const doc = await User.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError("No user found with that ID", 404));
  }

  const isAdminAccount = isAdminRole(doc);
  // Snapshot the identity so the log stays readable after the account is gone.
  await logActivity({
    req,
    activity: isAdminAccount ? "Admin Account Deleted" : "Client Account Deleted",
    description: `${isAdminAccount ? "Admin" : "Client"} account "${userLabel(doc)}" (@${doc.name}, ${doc.email}, ${doc.license || "no Client ID"}) was permanently deleted.`,
    target: doc._id,
    targetName: userLabel(doc),
    targetLicense: doc.license,
    targetAccount: `@${doc.name}`,
    entityType: "User",
    entityId: doc._id,
    metadata: {
      deletedAccount: {
        name: doc.name,
        displayName: doc.displayName,
        email: doc.email,
        license: doc.license,
        role: doc.role,
      },
    },
  });

  res.status(200).json({
    status: "success",
    message: `${userLabel(doc)} was deleted`,
    data: null,
  });
});

// Update a user (Admin update - access credentials username, email, password are changeable by client only)
export const updateUser = catchAsync(async (req, res, next) => {
  const updateData = { ...req.body };
  // Access credentials (username, email, password) are strictly changeable by client only
  delete updateData.name;
  delete updateData.username;
  delete updateData.email;
  delete updateData.password;
  delete updateData.passwordConfirm;
  delete updateData.passwordHistory;
  delete updateData.mustChangePassword;
  delete updateData._id;
  if (typeof updateData.license === "string") {
    updateData.license = updateData.license.trim();
    if (!updateData.license) delete updateData.license;
  }

  const before = await User.findById(req.params.id).lean();
  if (!before) return next(new AppError("No user found with that ID", 404));

  const conflict = await findCredentialConflict(
    { license: updateData.license !== before.license ? updateData.license : undefined },
    before._id
  );
  if (conflict) return next(new AppError(conflict, 400));

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  const changes = diffFields(before, updatedUser.toObject(), PROFILE_FIELDS);
  if (changes.length) {
    await logActivity({
      req,
      activity: changes.some((c) => c.field === "license")
        ? "Client ID Changed"
        : "User Profile Updated",
      description: `Account "${userLabel(updatedUser)}" (@${updatedUser.name}) was updated. ${describeChanges(changes)}`,
      target: updatedUser,
      targetAccount: `@${updatedUser.name}`,
      entityType: "User",
      entityId: updatedUser._id,
      changes,
    });
  }

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
