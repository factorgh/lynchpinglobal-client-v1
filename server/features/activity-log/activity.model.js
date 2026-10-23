import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    activity: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Target user / client that the action was performed on
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    targetName: {
      type: String,
      required: false,
    },
    targetLicense: {
      type: String,
      required: false,
    },
    targetAccount: {
      type: String,
      required: false,
    },
    entityType: {
      type: String, // e.g. "Mandate", "Disbursement", "Asset", "Loan", "Rental", "User", "Client"
      required: false,
    },
    entityId: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
