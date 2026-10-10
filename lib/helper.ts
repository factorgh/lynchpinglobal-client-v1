export const round2 = (value: any): number => {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatPrice = (amount: number) => {
  const safeAmount = round2(amount);
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(safeAmount);
};

export const formatPriceGHS = (amount: number) => {
  const safeAmount = round2(amount);
  const formatter = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(safeAmount);
};

export function toTwoDecimalPlaces(value: any) {
  const num = round2(value);
  return num.toFixed(2);
}

const uploadToCloudinary = async (file: any, uploadPreset: any) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dzvwqvww2/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${file.name}`);
  }
  return response.json();
};

export function formatMultipleCurrency(
  amount: number,
  currency: string
): string {
  if (!currency || typeof currency !== "string") {
    throw new Error("Currency code is required and must be a string.");
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
