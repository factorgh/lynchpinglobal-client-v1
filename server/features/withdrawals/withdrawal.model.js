import mongoose from "mongoose";

/** Disbursements only allow Pending / Approved / Cancelled. */
export const normalizeDisbursementStatus = (status) => {
  if (status === undefined || status === null || status === "") return status;
  const s = String(status).trim().toLowerCase();
  if (s === "processing") return "Approved";
  if (s === "rejected") return "Cancelled";
  if (s === "approved") return "Approved";
  if (s === "cancelled") return "Cancelled";
  if (s === "pending") return "Pending";
  return status;
};

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    approvedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Cancelled"],
      default: "Pending",
      set: (value) => normalizeDisbursementStatus(value),
    },
    // Mandate the money was taken from, so any reversal restores the same mandate.
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
    },
    // Amount currently deducted from that mandate's principal (0 when nothing is deducted).
    deductedAmount: {
      type: Number,
      default: undefined,
    },
  },
  { timestamps: true },
);

// Drop any previously compiled model (stale middleware from hot reload).
if (mongoose.models.Withdrawal) {
  delete mongoose.models.Withdrawal;
}
if (mongoose.connection?.models?.Withdrawal) {
  delete mongoose.connection.models.Withdrawal;
}

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);
export default Withdrawal;
