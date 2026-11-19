"use server";

import connectDB from "@/lib/db";
import Withdrawal from "@/server/features/withdrawals/withdrawal.model.js";
import Investment from "@/server/features/investment/model/investment.model.js";
import {
  applyPrincipalChange,
  snapshotPrincipalState,
  restorePrincipalState,
} from "@/server/utils/principalAdjustment.js";
import { withMongoTransaction } from "@/server/utils/withMongoTransaction.js";
import { revalidatePath } from "next/cache";

export async function getAllWithdrawalsAction() {
  try {
    await connectDB();
    const withdrawals = await Withdrawal.find()
      .populate("user", "name email phone")
      .populate("investment", "principal guaranteedRate accruedReturn")
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(withdrawals)) };
  } catch (error: any) {
    console.error("getAllWithdrawalsAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch disbursements",
    };
  }
}

export async function getUserWithdrawalsAction(userId: string) {
  try {
    await connectDB();
    const withdrawals = await Withdrawal.find({ user: userId })
      .populate("user", "name email phone")
      .populate("investment", "principal guaranteedRate accruedReturn")
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(withdrawals)) };
  } catch (error: any) {
    console.error("getUserWithdrawalsAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user disbursements",
    };
  }
}

export async function createWithdrawalAction(data: {
  userId: string;
  investmentId?: string;
  amount: number;
  paymentMethod?: string;
  accountDetails?: any;
}) {
  try {
    await connectDB();
    const withdrawal = await Withdrawal.create({
      user: data.userId,
      investment: data.investmentId,
      amount: data.amount,
      requestedDate: new Date(),
      status: "Pending",
      deductedAmount: 0,
    });

    revalidatePath("/cashout");
    return { success: true, data: JSON.parse(JSON.stringify(withdrawal)) };
  } catch (error: any) {
    console.error("createWithdrawalAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to create disbursement",
    };
  }
}

const isApprovedStatus = (status: any) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === "approved" || s === "processing";
};

const currentDeduction = (doc: any) => {
  if (typeof doc?.deductedAmount === "number") return Number(doc.deductedAmount) || 0;
  return isApprovedStatus(doc?.status) ? Number(doc?.amount) || 0 : 0;
};

export async function updateWithdrawalAction(id: string, data: any) {
  try {
    await connectDB();
    const oldDoc = await Withdrawal.findById(id);
    if (!oldDoc) {
      return { success: false, error: "Disbursement not found" };
    }

    const nextStatus = data.status ?? oldDoc.status;
    const nextAmount =
      data.amount !== undefined ? Number(data.amount) : Number(oldDoc.amount);
    const alreadyDeducted = currentDeduction(oldDoc);
    const shouldBeDeducted = isApprovedStatus(nextStatus) ? nextAmount : 0;
    const delta = shouldBeDeducted - alreadyDeducted;

    let investment = null;
    if (delta !== 0) {
      if (oldDoc.investment) {
        investment = await Investment.findById(oldDoc.investment).select(
          "+archived +active",
        );
      }
      if (!investment) {
        investment = await Investment.findOne({
          $or: [
            { userId: oldDoc.user },
            { "owners.user": oldDoc.user },
          ],
          active: { $ne: false },
          archived: { $ne: true },
        }).select("+archived +active");
      }
      if (!investment) {
        return { success: false, error: "Linked mandate not found" };
      }
    }

    const runUpdate = async (session: any = null) => {
      if (delta !== 0 && investment) {
        await applyPrincipalChange(investment, delta, session);
      }
      const working = session
        ? await Withdrawal.findById(id).session(session)
        : oldDoc;
      if (!working) {
        throw new Error("Disbursement not found");
      }
      Object.assign(working, data, {
        status: nextStatus,
        amount: nextAmount,
        deductedAmount: shouldBeDeducted,
        approvedDate: isApprovedStatus(nextStatus)
          ? data.approvedDate ?? working.approvedDate
          : undefined,
      });
      if (investment) working.investment = investment._id;
      return working.save(session ? { session } : undefined);
    };

    const updated = await withMongoTransaction(
      (session: any) => runUpdate(session),
      async () => {
        const snap = investment ? snapshotPrincipalState(investment) : null;
        try {
          return await runUpdate(null);
        } catch (err) {
          if (snap) await restorePrincipalState(snap);
          throw err;
        }
      },
    );

    revalidatePath("/cashout");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateWithdrawalAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to update disbursement",
    };
  }
}

export async function deleteWithdrawalAction(id: string) {
  try {
    await connectDB();
    const doc = await Withdrawal.findById(id);
    if (!doc) {
      return { success: false, error: "Disbursement not found" };
    }

    const deducted = currentDeduction(doc);
    let investment = null;
    if (deducted > 0) {
      if (doc.investment) {
        investment = await Investment.findById(doc.investment).select(
          "+archived +active",
        );
      }
      if (!investment) {
        investment = await Investment.findOne({
          $or: [
            { userId: doc.user },
            { "owners.user": doc.user },
          ],
        }).select("+archived +active");
      }
    }

    const runDelete = async (session: any = null) => {
      if (deducted > 0 && investment) {
        await applyPrincipalChange(investment, -deducted, session);
      }
      await Withdrawal.findByIdAndDelete(id, session ? { session } : undefined);
    };

    await withMongoTransaction(
      (session: any) => runDelete(session),
      async () => {
        const snap = investment ? snapshotPrincipalState(investment) : null;
        try {
          await runDelete(null);
        } catch (err) {
          if (snap) await restorePrincipalState(snap);
          throw err;
        }
      },
    );

    revalidatePath("/cashout");
    return { success: true };
  } catch (error: any) {
    console.error("deleteWithdrawalAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete disbursement",
    };
  }
}
