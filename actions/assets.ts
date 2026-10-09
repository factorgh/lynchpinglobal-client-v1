"use server";

import connectDB from "@/lib/db";
import Assets from "@/server/features/assets/model/assets_model.js";
import { revalidatePath } from "next/cache";

export async function getAllAssetsAction() {
  try {
    await connectDB();
    const assets = await Assets.find()
      .populate("owners.user", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(assets)) };
  } catch (error: any) {
    console.error("getAllAssetsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch assets" };
  }
}

export async function getUserAssetsAction(userId: string) {
  try {
    await connectDB();
    const assets = await Assets.find({ "owners.user": userId })
      .populate("owners.user", "name email phone")
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(assets)) };
  } catch (error: any) {
    console.error("getUserAssetsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch user assets" };
  }
}

export async function createAssetAction(data: any) {
  try {
    await connectDB();
    const asset = await Assets.create(data);
    revalidatePath("/assets");
    return { success: true, data: JSON.parse(JSON.stringify(asset)) };
  } catch (error: any) {
    console.error("createAssetAction error:", error);
    return { success: false, error: error.message || "Failed to create asset" };
  }
}

export async function updateAssetAction(id: string, data: any) {
  try {
    await connectDB();
    const updated = await Assets.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return { success: false, error: "Asset not found" };
    revalidatePath("/assets");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateAssetAction error:", error);
    return { success: false, error: error.message || "Failed to update asset" };
  }
}

export async function deleteAssetAction(id: string) {
  try {
    await connectDB();
    const deleted = await Assets.findByIdAndDelete(id);
    if (!deleted) return { success: false, error: "Asset not found" };
    revalidatePath("/assets");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deleteAssetAction error:", error);
    return { success: false, error: error.message || "Failed to delete asset" };
  }
}
