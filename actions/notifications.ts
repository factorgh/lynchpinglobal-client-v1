"use server";

import connectDB from "@/lib/db";
import Notification from "@/server/features/notifications/models/notification.js";
import { revalidatePath } from "next/cache";

export async function getUserNotificationsAction(userId: string) {
  try {
    await connectDB();
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(notifications)) };
  } catch (error: any) {
    console.error("getUserNotificationsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch notifications" };
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    await connectDB();
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    ).lean();
    revalidatePath("/notifications");
    return { success: true, data: JSON.parse(JSON.stringify(notification)) };
  } catch (error: any) {
    console.error("markNotificationReadAction error:", error);
    return { success: false, error: error.message || "Failed to mark notification read" };
  }
}

export async function createNotificationAction(data: any) {
  try {
    await connectDB();
    const notification = await Notification.create(data);
    return { success: true, data: JSON.parse(JSON.stringify(notification)) };
  } catch (error: any) {
    console.error("createNotificationAction error:", error);
    return { success: false, error: error.message || "Failed to create notification" };
  }
}
