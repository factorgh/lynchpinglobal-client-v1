"use server";

import connectDB from "@/lib/db";
import Payment from "@/server/features/payments/payments.model.js";
import { revalidatePath } from "next/cache";

export async function getAllPaymentsAction() {
  try {
    await connectDB();
    const payments = await Payment.find()
      .populate("userId", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(payments)) };
  } catch (error: any) {
    console.error("getAllPaymentsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch payments" };
  }
}

export async function getUserPaymentsAction(userId: string) {
  try {
    await connectDB();
    const payments = await Payment.find({ userId })
      .populate("userId", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(payments)) };
  } catch (error: any) {
    console.error("getUserPaymentsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch user payments" };
  }
}

export async function createPaymentAction(data: any) {
  try {
    await connectDB();
    const payment = await Payment.create(data);
    revalidatePath("/payments");
    return { success: true, data: JSON.parse(JSON.stringify(payment)) };
  } catch (error: any) {
    console.error("createPaymentAction error:", error);
    return { success: false, error: error.message || "Failed to create payment" };
  }
}

export async function updatePaymentAction(id: string, data: any) {
  try {
    await connectDB();
    const updated = await Payment.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return { success: false, error: "Payment not found" };
    revalidatePath("/payments");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updatePaymentAction error:", error);
    return { success: false, error: error.message || "Failed to update payment" };
  }
}

export async function deletePaymentAction(id: string) {
  try {
    await connectDB();
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) return { success: false, error: "Payment not found" };
    revalidatePath("/payments");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deletePaymentAction error:", error);
    return { success: false, error: error.message || "Failed to delete payment" };
  }
}
