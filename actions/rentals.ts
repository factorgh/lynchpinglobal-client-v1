"use server";

import connectDB from "@/lib/db";
import Rental from "@/server/features/rentals/rentals.model.js";
import { revalidatePath } from "next/cache";

export async function getAllRentalsAction() {
  try {
    await connectDB();
    const rentals = await Rental.find()
      .populate("userId", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(rentals)) };
  } catch (error: any) {
    console.error("getAllRentalsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch rentals" };
  }
}

export async function getUserRentalsAction(userId: string) {
  try {
    await connectDB();
    const rentals = await Rental.find({ userId })
      .populate("userId", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(rentals)) };
  } catch (error: any) {
    console.error("getUserRentalsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch user rentals" };
  }
}

export async function createRentalAction(data: any) {
  try {
    await connectDB();
    const rental = await Rental.create(data);
    revalidatePath("/rentals");
    return { success: true, data: JSON.parse(JSON.stringify(rental)) };
  } catch (error: any) {
    console.error("createRentalAction error:", error);
    return { success: false, error: error.message || "Failed to create rental" };
  }
}

export async function updateRentalAction(id: string, data: any) {
  try {
    await connectDB();
    const updated = await Rental.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return { success: false, error: "Rental not found" };
    revalidatePath("/rentals");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateRentalAction error:", error);
    return { success: false, error: error.message || "Failed to update rental" };
  }
}

export async function deleteRentalAction(id: string) {
  try {
    await connectDB();
    const deleted = await Rental.findByIdAndDelete(id);
    if (!deleted) return { success: false, error: "Rental not found" };
    revalidatePath("/rentals");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deleteRentalAction error:", error);
    return { success: false, error: error.message || "Failed to delete rental" };
  }
}
