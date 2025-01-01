export const formatPrice = (amount: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return formatter.format(amount);
};

export const formatPriceGHS = (amount: number) => {
  const formatter = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  });

  return formatter.format(amount);
};

export function toTwoDecimalPlaces(value: any) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return "Invalid number";
  }
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
