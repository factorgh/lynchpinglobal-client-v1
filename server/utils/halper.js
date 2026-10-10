import { v4 as uuidv4 } from "uuid"; 

export const generateTransactionId = () => {
  return uuidv4(); // Generates a unique UUID
};

export const round2 = (num) => {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
};

export const roundToTwo = round2;

export const calculateDailyRate = (principal, expectedRate, quarterDays) => {
  const returnValue =
    (Number(principal || 0) * Number(expectedRate || 0)) / 100 / Number(quarterDays || 90);
  return round2(returnValue);
};

export const calulcateManagementFee = () => {};
