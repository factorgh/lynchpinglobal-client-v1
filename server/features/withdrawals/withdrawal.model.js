import mongoose from "mongoose";

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
      enum: ["Pending", "Approved", "Processing", "Cancelled", "Rejected"],
      default: "Pending",
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

const Withdrawal =
  mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
export default Withdrawal;
