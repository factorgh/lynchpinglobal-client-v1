"use server";

import connectDB from "@/lib/db";
import Withdrawal from "@/server/features/withdrawals/withdrawal.model.js";
import Investment from "@/server/features/investment/model/investment.model.js";
import { recalculateInvestment } from "@/server/utils/recalculate.js";
import { revalidatePath } from "next/cache";

export async function getAllWithdrawalsAction() {
  try {
    await connectDB();
    const withdrawals = await Withdrawal.find()
      .populate("userId", "name email phone")
      .populate("investmentId", "principal guaranteedRate accruedReturn")
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(withdrawals)) };
  } catch (error: any) {
    console.error("getAllWithdrawalsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch withdrawals" };
  }
}

export async function getUserWithdrawalsAction(userId: string) {
  try {
    await connectDB();
    const withdrawals = await Withdrawal.find({ userId })
      .populate("userId", "name email phone")
      .populate("investmentId", "principal guaranteedRate accruedReturn")
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(withdrawals)) };
  } catch (error: any) {
    console.error("getUserWithdrawalsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch user withdrawals" };
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
      userId: data.userId,
      investmentId: data.investmentId,
      amount: data.amount,
      paymentMethod: data.paymentMethod || "bank_transfer",
      accountDetails: data.accountDetails,
      status: "pending",
    });

    revalidatePath("/cashout");
    return { success: true, data: JSON.parse(JSON.stringify(withdrawal)) };
  } catch (error: any) {
    console.error("createWithdrawalAction error:", error);
    return { success: false, error: error.message || "Failed to create withdrawal" };
  }
}


const isInactiveStatus = (status: any) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === "cancelled" || s === "rejected";
};

export async function updateWithdrawalAction(id: string, data: any) {
  try {
    await connectDB();
    const oldDoc = await Withdrawal.findById(id);
    if (!oldDoc) {
      return { success: false, error: "Withdrawal not found" };
    }

    const updated = await Withdrawal.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return { success: false, error: "Withdrawal not found" };
    }

    const wasActive = !isInactiveStatus(oldDoc.status);
    const isActive = !isInactiveStatus(updated.status);

    const oldAmount = Number(oldDoc.amount) || 0;
    const newAmount = Number(updated.amount) || 0;

    const prevDeduction = wasActive ? oldAmount : 0;
    const nextDeduction = isActive ? newAmount : 0;

    const principalDelta = prevDeduction - nextDeduction;

    if (principalDelta !== 0) {
      const investment = await Investment.findOne({ userId: updated.user || updated.userId });
      if (investment) {
        investment.principal = Math.max(0, (investment.principal || 0) + principalDelta);
        await investment.save();
        await recalculateInvestment(investment._id);
      }
    }

    revalidatePath("/cashout");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateWithdrawalAction error:", error);
    return { success: false, error: error.message || "Failed to update withdrawal" };
  }
}

export async function deleteWithdrawalAction(id: string) {
  try {
    await connectDB();
    const doc = await Withdrawal.findByIdAndDelete(id);
    if (!doc) {
      return { success: false, error: "Withdrawal not found" };
    }

    const wasActive = !isInactiveStatus(doc.status);
    if (wasActive) {
      const investment = await Investment.findOne({ userId: doc.user || doc.userId });
      if (investment) {
        investment.principal += doc.amount;
        await investment.save();
        await recalculateInvestment(investment._id);
      }
    }

    revalidatePath("/cashout");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deleteWithdrawalAction error:", error);
    return { success: false, error: error.message || "Failed to delete withdrawal" };
  }
}
