"use server";

import connectDB from "@/lib/db";
import Investment from "@/server/features/investment/model/investment.model.js";
import { AddOn } from "@/server/features/investment/model/add_on.model.js";
import { OneOff } from "@/server/features/investment/model/one_off.model.js";
import User from "@/server/features/auth/models/user.model.js";
import { generateTransactionId } from "@/server/utils/halper.js";
import { getQuarterEndDate } from "@/server/utils/handle_date_range.js";
import { calculateDynamicAccruedReturn } from "@/server/utils/handle_dynamic_rate.js";
import { recalculateInvestment } from "@/server/utils/recalculate.js";
import { revalidatePath } from "next/cache";

export async function getAllInvestmentsAction() {
  try {
    await connectDB();
    const investments = await Investment.find()
      .populate("userId", "name email phone photo")
      .populate("owners.user", "name email phone photo")
      .populate("addOns")
      .populate("oneOffs")
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(investments)) };
  } catch (error: any) {
    console.error("getAllInvestmentsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch investments" };
  }
}

export async function getUserInvestmentsAction(userId: string) {
  try {
    await connectDB();
    const investments = await Investment.find({
      $or: [{ userId }, { "owners.user": userId }],
    })
      .populate("userId", "name email phone")
      .populate("owners.user", "name email phone")
      .populate("addOns")
      .populate("oneOffs")
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(investments)) };
  } catch (error: any) {
    console.error("getUserInvestmentsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch user investments" };
  }
}

export async function createInvestmentAction(formData: {
  userId: string;
  principal: number;
  guaranteedRate?: number;
  managementFeeRate?: number;
  operationalCost?: number;
  performanceYield?: number;
  others?: number;
  mandate?: string;
  partnerForm?: string;
  certificate?: string;
  checklist?: string;
  owners?: any[];
}) {
  try {
    await connectDB();

    const {
      userId,
      principal,
      guaranteedRate = 8,
      managementFeeRate = 0,
      operationalCost = 0,
      performanceYield = 0,
      others = 0,
      mandate,
      partnerForm,
      certificate,
      checklist,
      owners,
    } = formData;

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const creationDate = new Date();
    const quarterEndDate = getQuarterEndDate(creationDate);

    const principalAccruedReturn =
      (await calculateDynamicAccruedReturn(
        principal,
        creationDate,
        quarterEndDate,
        guaranteedRate
      )) || 0;

    const totalAccrued = principalAccruedReturn + performanceYield;
    const transformedTotalAccrued = Number(totalAccrued) || 0;

    let managementFeeTotal = 0;
    if (transformedTotalAccrued > 0 && managementFeeRate) {
      managementFeeTotal = (transformedTotalAccrued * managementFeeRate) / 100;
    }

    const totalAccruedReturn = transformedTotalAccrued - managementFeeTotal;
    const transformedTotalAccruedReturn = Math.max(Number(totalAccruedReturn) || 0, 0);

    const newInvestment = await Investment.create({
      userId,
      principal,
      guaranteedRate,
      managementFeeRate,
      operationalCost,
      performanceYield,
      others,
      mandate,
      partnerForm,
      certificate,
      checklist,
      transactionId: generateTransactionId(),
      accruedReturn: transformedTotalAccruedReturn,
      accruedDailyReturn: (guaranteedRate / 100) * principal,
      owners: owners || [{ user: userId, role: "primary" }],
      isJoint: Boolean(owners && owners.length > 1),
    });

    revalidatePath("/investments");
    return { success: true, data: JSON.parse(JSON.stringify(newInvestment)) };
  } catch (error: any) {
    console.error("createInvestmentAction error:", error);
    return { success: false, error: error.message || "Failed to create investment" };
  }
}

export async function updateInvestmentAction(id: string, data: any) {
  try {
    await connectDB();
    const updated = await Investment.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return { success: false, error: "Investment not found" };
    }

    await recalculateInvestment(id);
    revalidatePath("/investments");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("updateInvestmentAction error:", error);
    return { success: false, error: error.message || "Failed to update investment" };
  }
}

export async function deleteInvestmentAction(id: string) {
  try {
    await connectDB();
    const deleted = await Investment.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, error: "Investment not found" };
    }

    revalidatePath("/investments");
    return { success: true, data: null };
  } catch (error: any) {
    console.error("deleteInvestmentAction error:", error);
    return { success: false, error: error.message || "Failed to delete investment" };
  }
}

export async function addAddOnAction(data: {
  amount: number;
  investmentId: string;
  status?: string;
}) {
  try {
    await connectDB();
    const investment = await Investment.findById(data.investmentId);
    if (!investment) {
      return { success: false, error: "Investment not found" };
    }

    const savedAddOn = await AddOn.create({
      amount: data.amount,
      rate: investment.guaranteedRate,
      dateOfEntry: Date.now(),
      startDate: new Date(),
      status: data.status || "pending",
    });

    investment.addOns.push(savedAddOn._id);
    investment.lastModified = new Date();
    await investment.save();

    await recalculateInvestment(data.investmentId);
    revalidatePath("/investments");

    return { success: true, data: JSON.parse(JSON.stringify(savedAddOn)) };
  } catch (error: any) {
    console.error("addAddOnAction error:", error);
    return { success: false, error: error.message || "Failed to add add-on" };
  }
}

export async function addOneOffAction(data: {
  amount: number;
  oneOffYield: number;
  currency?: string;
  investmentId: string;
}) {
  try {
    await connectDB();
    const investment = await Investment.findById(data.investmentId);
    if (!investment) {
      return { success: false, error: "Investment not found" };
    }

    const createdOneOff = await OneOff.create({
      amount: data.amount,
      oneOffYield: data.oneOffYield,
      dateOfEntry: Date.now(),
      currency: data.currency || "USD",
    });

    investment.oneOffs.push(createdOneOff._id);
    investment.lastModified = new Date();
    await investment.save();

    await recalculateInvestment(data.investmentId);
    revalidatePath("/investments");

    return { success: true, data: JSON.parse(JSON.stringify(createdOneOff)) };
  } catch (error: any) {
    console.error("addOneOffAction error:", error);
    return { success: false, error: error.message || "Failed to add one-off" };
  }
}
