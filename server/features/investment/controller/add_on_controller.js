import { AddOn } from "../model/add_on.model.js";
import Investment from "../model/investment.model.js";
import ActivityLog from "../../activity-log/activity.model.js";
import User from "../../auth/models/user.model.js";
import { recalculateInvestment } from "../../../utils/recalculate.js";

export const addAddOnToInvestment = async (req, res, next) => {
  const { amount, investmentId, status } = req.body;

  try {
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Investment not found" });
    }

    const newAddOn = {
      amount,
      rate: investment.guaranteedRate,
      dateOfEntry: Date.now(),
      startDate: new Date(),
      status,
    };
    // Create addon
    const savedAddOn = await AddOn.create(newAddOn);

    console.log("------------------New Add on-----------", newAddOn);
    investment.addOns.push(savedAddOn._id);
    investment.lastModified = new Date();

    await investment.save();

    await recalculateInvestment(investmentId);

    try {
      const actorUser = req.user?._id || investment.userId;
      let clientName = investment.name || "Client";
      let clientLicense = "";

      if (investment.userId) {
        const u = await User.findById(investment.userId).select("name displayName license").lean();
        if (u) {
          clientName = u.displayName || u.name;
          clientLicense = u.license || "";
        }
      }

      await ActivityLog.create({
        user: actorUser,
        targetUser: investment.userId,
        targetName: clientName,
        targetLicense: clientLicense,
        targetAccount: `Mandate #${String(investmentId).slice(-6).toUpperCase()}`,
        entityType: "AddOn",
        entityId: String(savedAddOn._id),
        amount: Number(amount || 0),
        activity: "Mandate Add-On Created",
        description: `Add-on of GHS ${Number(amount || 0).toLocaleString()} added to ${clientName}'s mandate`,
      });
    } catch (logErr) {
      console.error("Activity logging failed in addAddOnToInvestment:", logErr);
    }

    res.status(200).json({ status: "success", data: investment });
  } catch (error) {
    next(error);
  }
};

// Update add on Status
export const updateAddOnStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status,startDate } = req.body;
  try {
    const addOn = await AddOn.findById(id);
    if (!addOn) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add on not found" });
    }
    addOn.status = status;
    addOn.startDate = startDate;
    await addOn.save();

    const investment = await Investment.findOne({ addOns: id });
    if (investment) {
      await recalculateInvestment(investment._id);

      try {
        const actorUser = req.user?._id || investment.userId;
        let clientName = investment.name || "Client";
        let clientLicense = "";

        if (investment.userId) {
          const u = await User.findById(investment.userId).select("name displayName license").lean();
          if (u) {
            clientName = u.displayName || u.name;
            clientLicense = u.license || "";
          }
        }

        await ActivityLog.create({
          user: actorUser,
          targetUser: investment.userId,
          targetName: clientName,
          targetLicense: clientLicense,
          targetAccount: `Mandate #${String(investment._id).slice(-6).toUpperCase()}`,
          entityType: "AddOn",
          entityId: String(id),
          amount: Number(addOn.amount || 0),
          activity: "Mandate Add-On Updated",
          description: `Add-on of GHS ${Number(addOn.amount || 0).toLocaleString()} for ${clientName}'s mandate status updated to "${status}"`,
        });
      } catch (logErr) {
        console.error("Activity logging failed in updateAddOnStatus:", logErr);
      }
    }

    res.status(200).json({ status: "success", data: addOn });
  } catch (error) {
    next(error);
  }
};

// Delete add on
export const deleteAddOn = async (req, res, next) => {
  const { id } = req.params;
  try {
    const addOn = await AddOn.findById(id);
    if (!addOn) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add on not found" });
    }

    // Find all investments referencing this addon and populate their addons to calculate updated totals
    const investments = await Investment.find({ addOns: id }).populate("addOns");

    for (const investment of investments) {
      // Filter out the deleted addon from remaining list
      const remainingAddOns = (investment.addOns || []).filter(
        (addon) => String(addon._id) !== String(id)
      );

      // Sum accrued interest of remaining active addons
      let totalAddOnReturn = 0;
      for (const remainingAddOn of remainingAddOns) {
        if (remainingAddOn.status === "active") {
          totalAddOnReturn += remainingAddOn.accruedAddOnInterest || remainingAddOn.accruedInterest || 0;
        }
      }

      // Update investment's list and accumulated addon return
      investment.addOns = investment.addOns.filter(
        (addonId) => String(addonId._id || addonId) !== String(id)
      );
      investment.addOnAccruedReturn = totalAddOnReturn;

      // Recalculate other financial metrics (management fee, total accrued return)
      const principalReturn = investment.principalAccruedReturn || 0;
      const grossReturn = principalReturn + totalAddOnReturn;
      const managementFee = (grossReturn * (investment.managementFeeRate || 0)) / 100;
      investment.managementFee = managementFee;

      investment.totalAccruedReturn =
        grossReturn +
        (investment.performanceYield || 0) -
        (managementFee + (investment.operationalCost || 0));

      investment.lastModified = new Date();
      await investment.save();
      await recalculateInvestment(investment._id);
    }

    // Delete the addon document
    await AddOn.findByIdAndDelete(id);

    try {
      const inv = investments[0];
      const actorUser = req.user?._id || inv?.userId;
      let clientName = inv?.name || "Client";
      let clientLicense = "";

      if (inv?.userId) {
        const u = await User.findById(inv.userId).select("name displayName license").lean();
        if (u) {
          clientName = u.displayName || u.name;
          clientLicense = u.license || "";
        }
      }

      await ActivityLog.create({
        user: actorUser,
        targetUser: inv?.userId,
        targetName: clientName,
        targetLicense: clientLicense,
        targetAccount: inv ? `Mandate #${String(inv._id).slice(-6).toUpperCase()}` : "Add-on",
        entityType: "AddOn",
        entityId: String(id),
        amount: Number(addOn.amount || 0),
        activity: "Mandate Add-On Deleted",
        description: `Add-on of GHS ${Number(addOn.amount || 0).toLocaleString()} for ${clientName}'s mandate was deleted`,
      });
    } catch (logErr) {
      console.error("Activity logging failed in deleteAddOn:", logErr);
    }

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};
