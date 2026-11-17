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

withdrawalSchema.pre("validate", function (next) {
  if (this.isModified("status") || this.isNew) {
    this.status = normalizeDisbursementStatus(this.status) || "Pending";
  }
  next();
});

const Withdrawal =
  mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
export default Withdrawal;
