"use server";

import connectDB from "@/lib/db";
import Withdrawal from "@/server/features/withdrawals/withdrawal.model.js";
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

export async function updateWithdrawalAction(id: string, data: any) {
  try {
    await connectDB();
    const updated = await Withdrawal.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return { success: false, error: "Withdrawal not found" };
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
    const deleted = await Withdrawal.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, error: "Withdrawal not found" };
    }

    revalidatePath("/cashout");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deleteWithdrawalAction error:", error);
    return { success: false, error: error.message || "Failed to delete withdrawal" };
  }
}
