import { v4 as uuidv4 } from "uuid"; 

export const generateTransactionId = () => {
  return uuidv4(); // Generates a unique UUID
};

export const calculateDailyRate = (principal, expectedRate, quarterDays) => {
  const returnValue = (principal * expectedRate) / 100 / quarterDays;
  return returnValue;
};

export const round2 = (num) => {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
};

export const roundToTwo = round2;

export const calulcateManagementFee = () => {};
