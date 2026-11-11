import { NextRequest, NextResponse } from "next/server";
import { runHandlerChain } from "./apiAdapter";

// Auth controllers
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
} from "./features/auth/controllers/auth.controller.js";
import { verifyToken, restrictTo } from "./features/auth/middleware/verification.js";
import User from "./features/auth/models/user.model.js";
import { logActivity } from "./features/activity-log/logActivity.js";
import { getPasswordError } from "@/lib/passwordPolicy";

// User controllers
import {
  getAll as getAllUsers,
  getAllAdmin,
  updateMe,
  deleteMe,
  updateUser,
  deleteUser,
  getUser,
  getSeenTours,
  markTourSeen,
  resetSeenTours,
  createUser,
} from "./features/auth/controllers/user.controller.js";

// Investment controllers
import {
  createInvestment,
  deleteInvestment,
  getAllInvestments,
  getInvestment,
  updateInvestment,
  archiveTransactions,
  rolloverInvestments,
  getRolloverCandidates,
  executeSingleRollover,
  executeBatchRollover,
  calculateDailyAccruals,
} from "./features/investment/controller/investment.controller.js";
import {
  addAddOnToInvestment,
  updateAddOnStatus,
  deleteAddOn,
} from "./features/investment/controller/add_on_controller.js";

// Assets controllers
import {
  createAsset,
  deleteAsset,
  getAllAssets,
  getAsset,
  getAssetByUser,
  updateAsset,
} from "./features/assets/controller/assets_controller.js";

// Loans controllers
import {
  createLoan,
  deleteLoan,
  getAllLoans,
  getLoan,
  getUserLoans,
  updateLoan,
} from "./features/loans/loans.controller.js";

// Rentals controllers
import {
  createRental,
  deleteRental,
  getAllRentals,
  getRental,
  getUserRentals,
  updateRental,
} from "./features/rentals/rentals.controller.js";

// Payments controllers
import {
  createPayment,
  deletePayment,
  getAllPayments,
  getPayment,
  getUserPayments,
  updatePayment,
} from "./features/payments/payments.controller.js";

// Withdrawals controllers
import {
  createWithdrawal,
  deleteWithdrawal,
  getAllWithdrawals,
  getUserWithdrawals,
  getWithdrawal,
  updateWithdrawal,
} from "./features/withdrawals/withdrawal.controller.js";

// Notifications controllers
import {
  createNotification,
  deleteNotification,
  getAllNotifications,
  getNotificationByUser,
  readAllNotifications,
} from "./features/notifications/controllers/notification.js";

// Activity log controllers
import {
  createActivityLog,
  deleteActivityLog,
  getActivityLog,
  getAllActivityLogs,
  updateActivityLog,
} from "./features/activity-log/activity_controller.js";

// Uploads
import {
  handleUploads,
  listStoredUploadsDb,
  listUploadsFromProvider,
  deleteUploadedFile,
} from "./features/uploads/upload.controller";

// Change Password Handler
const changePassword = async (req: any, res: any) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body || {};

  if (!req.user?._id) {
    return res.status(401).json({ status: "fail", message: "Please log in to change your password" });
  }
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: "fail",
      message: "Please enter your current password and a new password",
    });
  }
  if (newPasswordConfirm !== undefined && newPassword !== newPasswordConfirm) {
    return res.status(400).json({ status: "fail", message: "New passwords do not match" });
  }
  const policyError = getPasswordError(newPassword);
  if (policyError) {
    return res.status(400).json({ status: "fail", message: policyError });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({
      status: "fail",
      message: "Your new password must be different from your current password",
    });
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  const isCorrect = await user.comparePassword(currentPassword, user.password);
  if (!isCorrect) {
    return res.status(401).json({
      status: "fail",
      message: "Your current (temporary) password is incorrect",
    });
  }

  const wasTemporary = Boolean(user.mustChangePassword);
  user.password = newPassword;
  user.passwordConfirm = newPassword;
  user.mustChangePassword = false;
  await user.save();

  await logActivity({
    req,
    actor: user,
    activity: wasTemporary ? "Temporary Password Replaced" : "Password Changed",
    description: `${user.displayName || user.name} changed their ${wasTemporary ? "temporary " : ""}password.`,
    target: user,
    targetAccount: `@${user.name}`,
    entityType: "User",
    entityId: user._id,
  });

  return res.status(200).json({ status: "success", message: "Password updated successfully" });
};

const adminOnly = restrictTo("admin", "superadmin");

export async function dispatchApiRequest(
  webReq: NextRequest,
  routeSegments: string[]
): Promise<NextResponse> {
  const method = webReq.method.toUpperCase();
  const segs = routeSegments.filter(Boolean);
  const params: Record<string, string> = {};

  // Root /api/v1
  if (segs.length === 0) {
    return NextResponse.json({
      status: "success",
      message: "API is running 🚀",
    });
  }

  const prefix = segs[0];

  // 1. AUTH ROUTES
  if (prefix === "auth") {
    const sub = segs[1];
    if (method === "POST" && sub === "signup") {
      return runHandlerChain(webReq, params, [signup]);
    }
    if (method === "POST" && sub === "login") {
      return runHandlerChain(webReq, params, [login]);
    }
    if (method === "POST" && sub === "forgot-password") {
      return runHandlerChain(webReq, params, [forgotPassword]);
    }
    if (method === "PATCH" && sub === "reset-password" && segs[2]) {
      params.token = segs[2];
      return runHandlerChain(webReq, params, [resetPassword]);
    }
    if (method === "POST" && (sub === "changePassword" || sub === "change-password")) {
      return runHandlerChain(webReq, params, [verifyToken, changePassword]);
    }
    if (method === "PATCH" && sub === "updatePassword") {
      return runHandlerChain(webReq, params, [verifyToken, changePassword]);
    }
    if (method === "POST" && sub === "logout") {
      return runHandlerChain(webReq, params, [verifyToken, logout]);
    }
    if (method === "GET" && sub === "profile") {
      return runHandlerChain(webReq, params, [verifyToken, getProfile]);
    }
  }

  // 2. USERS ROUTES
  if (prefix === "users") {
    if (segs[1] === "tours") {
      if (segs.length === 2 && method === "GET") {
        return runHandlerChain(webReq, params, [verifyToken, getSeenTours]);
      }
      if (segs[2] === "seen" && method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, markTourSeen]);
      }
      if (segs[2] === "reset" && method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, resetSeenTours]);
      }
    }
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllUsers]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createUser]);
    }
    if (segs[1] === "admin" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getAllAdmin]);
    }
    if (segs[1] === "partners" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllUsers]);
    }
    if (segs[1] === "updateMe" && method === "PATCH") {
      return runHandlerChain(webReq, params, [verifyToken, updateMe]);
    }
    if (segs[1] === "deleteMe" && method === "DELETE") {
      return runHandlerChain(webReq, params, [verifyToken, deleteMe]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, getUser]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateUser]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteUser]);
    }
    if (segs.length === 2 && segs[1]) {
      params.id = segs[1];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, getUser]);
      if (method === "PATCH" || method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateUser]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteUser]);
    }
  }

  // 3. INVESTMENTS ROUTES
  if (prefix === "investments") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllInvestments]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createInvestment]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getInvestment]);
    }
    if (segs[1] === "archive" && method === "POST") {
      return runHandlerChain(webReq, params, [
        verifyToken,
        adminOnly,
        async (_req, res) => {
          await archiveTransactions();
          res.status(200).json({ status: "success", message: "Transactions archived successfully" });
        },
      ]);
    }
    if (segs[1] === "accruals") {
      return runHandlerChain(webReq, params, [calculateDailyAccruals]);
    }
    if (segs[1] === "rollover") {
      if (segs[2] === "candidates" && method === "GET") {
        return runHandlerChain(webReq, params, [verifyToken, adminOnly, getRolloverCandidates]);
      }
      if (segs[2] === "execute-single" && method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, adminOnly, executeSingleRollover]);
      }
      if (segs[2] === "execute-batch" && method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, adminOnly, executeBatchRollover]);
      }
      if (method === "POST") {
        return runHandlerChain(webReq, params, [
          verifyToken,
          adminOnly,
          async (_req, res) => {
            await rolloverInvestments();
            res.status(200).json({ status: "success", message: "Investments rolled over successfully" });
          },
        ]);
      }
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, getInvestment]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, updateInvestment]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteInvestment]);
    }
  }

  // 4. ADD-ON ROUTES
  if (prefix === "add-on") {
    if (segs.length === 1 && method === "POST") {
      return runHandlerChain(webReq, params, [verifyToken, adminOnly, addAddOnToInvestment]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateAddOnStatus]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteAddOn]);
    }
  }


  // 6. ASSETS ROUTES
  if (prefix === "assets") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllAssets]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createAsset]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getAssetByUser]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAsset]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateAsset]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteAsset]);
    }
  }

  // 7. LOANS ROUTES
  if (prefix === "loans") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllLoans]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createLoan]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserLoans]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getLoan]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateLoan]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteLoan]);
    }
  }

  // 8. RENTALS ROUTES
  if (prefix === "rentals") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllRentals]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createRental]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserRentals]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getRental]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateRental]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteRental]);
    }
  }

  // 9. PAYMENTS ROUTES
  if (prefix === "payments") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllPayments]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createPayment]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserPayments]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getPayment]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updatePayment]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deletePayment]);
    }
  }

  // 10. WITHDRAWALS ROUTES
  if (prefix === "withdrawals") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllWithdrawals]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createWithdrawal]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserWithdrawals]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getWithdrawal]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateWithdrawal]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteWithdrawal]);
    }
  }

  // 11. NOTIFICATIONS ROUTES
  if (prefix === "notifications") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllNotifications]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, createNotification]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getNotificationByUser]);
    }
    if (segs[1] === "readAll" && segs[2]) {
      params.id = segs[2];
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, readAllNotifications]);
    }
    if (segs.length === 2 && segs[1] && method === "DELETE") {
      params.id = segs[1];
      return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteNotification]);
    }
  }

  // 12. ACTIVITY-LOGS ROUTES
  if (prefix === "activity-logs") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getAllActivityLogs]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, adminOnly, createActivityLog]);
    }
    if (segs.length === 2 && segs[1]) {
      params.id = segs[1];
      if (method === "GET") return runHandlerChain(webReq, params, [verifyToken, adminOnly, getActivityLog]);
      if (method === "PATCH") return runHandlerChain(webReq, params, [verifyToken, adminOnly, updateActivityLog]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, adminOnly, deleteActivityLog]);
    }
  }

  // 13. UPLOADS ROUTES
  if (prefix === "uploads") {
    if (segs.length === 1) {
      if (method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, handleUploads]);
      }
      if (method === "DELETE") {
        return runHandlerChain(webReq, params, [verifyToken, deleteUploadedFile]);
      }
    }
    if (segs[1] === "db" && method === "GET") {
      return runHandlerChain(webReq, params, [listStoredUploadsDb]);
    }
    if (segs[1] === "list" && method === "GET") {
      return runHandlerChain(webReq, params, [listUploadsFromProvider]);
    }
  }

  // 14. CRON AUTOMATION ROUTES
  if (prefix === "cron") {
    if (segs[1] === "daily-accruals" || segs[1] === "accruals") {
      return runHandlerChain(webReq, params, [calculateDailyAccruals]);
    }
  }

  return NextResponse.json(
    { status: "fail", message: `Route ${method} /api/v1/${segs.join("/")} not found` },
    { status: 404 }
  );
}
