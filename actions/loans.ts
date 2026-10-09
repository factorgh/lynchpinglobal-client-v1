"use server";

import connectDB from "@/lib/db";
import Loan from "@/server/features/loans/loans.model.js";
import { revalidatePath } from "next/cache";

export async function getAllLoansAction() {
  try {
    await connectDB();
    const loans = await Loan.find()
      .populate("userId", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(loans)) };
  } catch (error: any) {
    console.error("getAllLoansAction error:", error);
    return { success: false, error: error.message || "Failed to fetch loans" };
  }
}

export async function getUserLoansAction(userId: string) {
  try {
    await connectDB();
    const loans = await Loan.find({ userId })
      .populate("userId", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(loans)) };
  } catch (error: any) {
    console.error("getUserLoansAction error:", error);
    return { success: false, error: error.message || "Failed to fetch user loans" };
  }
}

export async function createLoanAction(data: any) {
  try {
    await connectDB();
    const loan = await Loan.create(data);
    revalidatePath("/loans");
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (error: any) {
    console.error("createLoanAction error:", error);
    return { success: false, error: error.message || "Failed to create loan" };
  }
}

export async function updateLoanAction(id: string, data: any) {
  try {
    await connectDB();
    const updated = await Loan.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return { success: false, error: "Loan not found" };
    revalidatePath("/loans");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateLoanAction error:", error);
    return { success: false, error: error.message || "Failed to update loan" };
  }
}

export async function deleteLoanAction(id: string) {
  try {
    await connectDB();
    const deleted = await Loan.findByIdAndDelete(id);
    if (!deleted) return { success: false, error: "Loan not found" };
    revalidatePath("/loans");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deleteLoanAction error:", error);
    return { success: false, error: error.message || "Failed to delete loan" };
  }
}
