import moment from "moment";
import Investment from "../features/investment/model/investment.model.js";
import { calculateDailyRate, round2 } from "./halper.js";
import { getQuarterDetails } from "./handle_date_range.js";

export const recalculateInvestment = async (investmentId) => {
  try {
    const investment = await Investment.findById(investmentId).populate([
      "addOns",
      "oneOffs",
    ]);
    if (!investment) {
      console.warn(`[Recalculate] Investment ${investmentId} not found`);
      return;
    }

    const currentDate = moment();
    const calculationEndDate = moment.min(currentDate, moment(investment.quarterEndDate));
    const quarterDays = getQuarterDetails(investment.startDate || investment.creationDate || new Date());

    const daysSinceStart = Math.max(0, calculationEndDate.diff(moment(investment.startDate), "days"));

    console.log(
      `[Day Count Log] Investment ID: ${investmentId} | Start Date: ${moment(investment.startDate).format("YYYY-MM-DD")} | End Date: ${calculationEndDate.format("YYYY-MM-DD")} | Days Elapsed: ${daysSinceStart} | Quarter Days: ${quarterDays}`
    );

    // ----- Principal Return Calculation -----
    let principalReturn = 0;
    if (daysSinceStart > 0) {
      const principalDailyReturn = calculateDailyRate(
        investment.principal,
        investment.guaranteedRate,
        quarterDays
      );
      principalReturn = round2(principalDailyReturn * daysSinceStart);
    }
    investment.principalAccruedReturn = principalReturn;

    // ----- Add-on Interest Calculation -----
    let totalAddOnReturn = 0;
    for (const addOn of investment.addOns) {
      if (addOn.status !== "active") continue;

      const addOnEndDate = moment.min(currentDate, moment(investment.quarterEndDate));
      const addOnDays = Math.max(0, addOnEndDate.diff(moment(addOn.startDate), "days"));

      console.log(
        `[Day Count Log] AddOn ID: ${addOn._id} | Start Date: ${moment(addOn.startDate).format("YYYY-MM-DD")} | End Date: ${addOnEndDate.format("YYYY-MM-DD")} | Resulting Day Count: ${addOnDays}`
      );

      if (addOnDays <= 0) {
        addOn.accruedAddOnInterest = 0;
        await addOn.save();
        continue;
      }

      // Only charge interest if amount is at least 5000 GHS
      if (addOn.amount < 5000) {
        addOn.accruedAddOnInterest = 0;
        await addOn.save();
        continue;
      }

      const dailyAddOnReturn = calculateDailyRate(
        addOn.amount,
        investment.guaranteedRate,
        quarterDays
      );

      const addOnInterest = round2(dailyAddOnReturn * addOnDays);
      addOn.accruedAddOnInterest = addOnInterest;
      await addOn.save(); // Persist the add-on document update
      totalAddOnReturn = round2(totalAddOnReturn + addOnInterest);
    }

    investment.addOnAccruedReturn = totalAddOnReturn;

    // ----- Service Fee Calculation -----
    const grossReturn = round2(principalReturn + totalAddOnReturn);
    const managementFee = round2(
      (grossReturn * (investment.managementFeeRate !== undefined ? investment.managementFeeRate : 20)) / 100
    );
    investment.managementFee = managementFee;

    // ----- Total Accrued Return -----
    const performanceYield = round2(investment.performanceYield || 0);
    const operationalCost = round2(investment.operationalCost || 0);
    investment.totalAccruedReturn = round2(
      Math.max(
        grossReturn + performanceYield - (managementFee + operationalCost),
        0
      )
    );

    await investment.save();
    console.log(
      `[Recalculate] Updated investment ${investment._id} | Principal: ${principalReturn.toFixed(
        2
      )}, Add-ons: ${totalAddOnReturn.toFixed(
        2
      )}, Total: ${investment.totalAccruedReturn.toFixed(2)}`
    );
  } catch (error) {
    console.error("[Recalculate] Error recalculating investment:", error.message || error);
  }
};
