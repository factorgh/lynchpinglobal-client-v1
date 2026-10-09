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
import { verifyToken } from "./features/auth/middleware/verification.js";
import User from "./features/auth/models/user.model.js";

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
} from "./features/investment/controller/investment.controller.js";
import {
  addAddOnToInvestment,
  updateAddOnStatus,
  deleteAddOn,
} from "./features/investment/controller/add_on_controller.js";
import { addOneOffsToInvestment } from "./features/investment/controller/one_off.controller.js";

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
  const { currentPassword, newPassword, newPasswordConfirm, identifier } = req.body;
  let user = req.user;

  if (!user && identifier) {
    user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { name: identifier }],
    }).select("+password");
  } else if (user) {
    user = await User.findById(user._id).select("+password");
  }

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  const isCorrect = await user.correctPassword(currentPassword, user.password);
  if (!isCorrect) {
    return res.status(401).json({ status: "fail", message: "Incorrect current password" });
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm || newPassword;
  user.mustChangePassword = false;
  await user.save();

  return res.status(200).json({ status: "success", message: "Password updated successfully" });
};

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
      if (method === "GET") return runHandlerChain(webReq, params, [getAllUsers]);
    }
    if (segs[1] === "admin" && method === "GET") {
      return runHandlerChain(webReq, params, [getAllAdmin]);
    }
    if (segs[1] === "partners" && method === "GET") {
      return runHandlerChain(webReq, params, [getAllUsers]);
    }
    if (segs[1] === "updateMe" && method === "PATCH") {
      return runHandlerChain(webReq, params, [verifyToken, updateMe]);
    }
    if (segs[1] === "deleteMe" && method === "DELETE") {
      return runHandlerChain(webReq, params, [verifyToken, deleteMe]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getUser]);
      if (method === "PUT") return runHandlerChain(webReq, params, [updateUser]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteUser]);
    }
    if (segs.length === 2 && segs[1]) {
      params.id = segs[1];
      if (method === "GET") return runHandlerChain(webReq, params, [getUser]);
      if (method === "PATCH" || method === "PUT") return runHandlerChain(webReq, params, [updateUser]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteUser]);
    }
  }

  // 3. INVESTMENTS ROUTES
  if (prefix === "investments") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllInvestments]);
      if (method === "POST") return runHandlerChain(webReq, params, [createInvestment]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getInvestment]);
    }
    if (segs[1] === "archive" && method === "POST") {
      return runHandlerChain(webReq, params, [
        verifyToken,
        async (_req, res) => {
          await archiveTransactions();
          res.status(200).json({ status: "success", message: "Transactions archived successfully" });
        },
      ]);
    }
    if (segs[1] === "rollover") {
      if (segs[2] === "candidates" && method === "GET") {
        return runHandlerChain(webReq, params, [verifyToken, getRolloverCandidates]);
      }
      if (segs[2] === "execute-single" && method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, executeSingleRollover]);
      }
      if (segs[2] === "execute-batch" && method === "POST") {
        return runHandlerChain(webReq, params, [verifyToken, executeBatchRollover]);
      }
      if (method === "POST") {
        return runHandlerChain(webReq, params, [
          verifyToken,
          async (_req, res) => {
            await rolloverInvestments();
            res.status(200).json({ status: "success", message: "Investments rolled over successfully" });
          },
        ]);
      }
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getInvestment]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, updateInvestment]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, deleteInvestment]);
    }
  }

  // 4. ADD-ON ROUTES
  if (prefix === "add-on") {
    if (segs.length === 1 && method === "POST") {
      return runHandlerChain(webReq, params, [addAddOnToInvestment]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "PUT") return runHandlerChain(webReq, params, [updateAddOnStatus]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteAddOn]);
    }
  }

  // 5. ONE-OFF / ADD-OFFS ROUTES
  if (prefix === "add-offs" || prefix === "one-offs") {
    if (segs.length === 1 && method === "POST") {
      return runHandlerChain(webReq, params, [addOneOffsToInvestment]);
    }
  }

  // 6. ASSETS ROUTES
  if (prefix === "assets") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllAssets]);
      if (method === "POST") return runHandlerChain(webReq, params, [createAsset]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getAssetByUser]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getAsset]);
      if (method === "PUT") return runHandlerChain(webReq, params, [updateAsset]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteAsset]);
    }
  }

  // 7. LOANS ROUTES
  if (prefix === "loans") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllLoans]);
      if (method === "POST") return runHandlerChain(webReq, params, [createLoan]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserLoans]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getLoan]);
      if (method === "PUT") return runHandlerChain(webReq, params, [updateLoan]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteLoan]);
    }
  }

  // 8. RENTALS ROUTES
  if (prefix === "rentals") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllRentals]);
      if (method === "POST") return runHandlerChain(webReq, params, [createRental]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserRentals]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getRental]);
      if (method === "PUT") return runHandlerChain(webReq, params, [updateRental]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteRental]);
    }
  }

  // 9. PAYMENTS ROUTES
  if (prefix === "payments") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllPayments]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, createPayment]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserPayments]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getPayment]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, updatePayment]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, deletePayment]);
    }
  }

  // 10. WITHDRAWALS ROUTES
  if (prefix === "withdrawals") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllWithdrawals]);
      if (method === "POST") return runHandlerChain(webReq, params, [verifyToken, createWithdrawal]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getUserWithdrawals]);
    }
    if (segs[1] === "single" && segs[2]) {
      params.id = segs[2];
      if (method === "GET") return runHandlerChain(webReq, params, [getWithdrawal]);
      if (method === "PUT") return runHandlerChain(webReq, params, [verifyToken, updateWithdrawal]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [verifyToken, deleteWithdrawal]);
    }
  }

  // 11. NOTIFICATIONS ROUTES
  if (prefix === "notifications") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllNotifications]);
      if (method === "POST") return runHandlerChain(webReq, params, [createNotification]);
    }
    if (segs[1] === "user" && method === "GET") {
      return runHandlerChain(webReq, params, [verifyToken, getNotificationByUser]);
    }
    if (segs[1] === "readAll" && segs[2]) {
      params.id = segs[2];
      if (method === "PUT") return runHandlerChain(webReq, params, [readAllNotifications]);
    }
    if (segs.length === 2 && segs[1] && method === "DELETE") {
      params.id = segs[1];
      return runHandlerChain(webReq, params, [deleteNotification]);
    }
  }

  // 12. ACTIVITY-LOGS ROUTES
  if (prefix === "activity-logs") {
    if (segs.length === 1) {
      if (method === "GET") return runHandlerChain(webReq, params, [getAllActivityLogs]);
      if (method === "POST") return runHandlerChain(webReq, params, [createActivityLog]);
    }
    if (segs.length === 2 && segs[1]) {
      params.id = segs[1];
      if (method === "GET") return runHandlerChain(webReq, params, [getActivityLog]);
      if (method === "PATCH") return runHandlerChain(webReq, params, [updateActivityLog]);
      if (method === "DELETE") return runHandlerChain(webReq, params, [deleteActivityLog]);
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

  return NextResponse.json(
    { status: "fail", message: `Route ${method} /api/v1/${segs.join("/")} not found` },
    { status: 404 }
  );
}
