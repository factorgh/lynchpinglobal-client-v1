import mongoose from "mongoose";
import ActivityLog from "./activity.model.js";
import User from "../auth/models/user.model.js";

const userLabel = (u) => (u ? u.displayName || u.name || u.email || "" : "");

const formatValue = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    return JSON.stringify(value);
  }
  return String(value);
};

const sameValue = (a, b) => {
  if (a instanceof Date || b instanceof Date) {
    const ta = a ? new Date(a).getTime() : null;
    const tb = b ? new Date(b).getTime() : null;
    return ta === tb;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a || []) === JSON.stringify(b || []);
  }
  return String(a ?? "") === String(b ?? "");
};

/**
 * Build a list of { field, label, from, to } for fields whose value changed.
 * `fields` is a map of field path -> human label.
 */
export const diffFields = (before = {}, after = {}, fields = {}) => {
  const changes = [];
  for (const [field, label] of Object.entries(fields)) {
    const from = before?.[field];
    const to = after?.[field];
    if (!sameValue(from, to)) {
      changes.push({ field, label, from: formatValue(from), to: formatValue(to) });
    }
  }
  return changes;
};

const fileNameFromUrl = (url) =>
  String(url || "")
    .split("/")
    .pop()
    ?.split("?")[0] || String(url || "");

/** Describe added / removed files between two URL arrays. */
export const diffFileLists = (before = [], after = [], label = "Documents") => {
  const prev = new Set((before || []).map(String));
  const next = new Set((after || []).map(String));
  const added = [...next].filter((u) => !prev.has(u));
  const removed = [...prev].filter((u) => !next.has(u));
  const changes = [];
  if (added.length) {
    changes.push({
      field: "files",
      label: `${label} added`,
      from: "—",
      to: added.map(fileNameFromUrl).join(", "),
    });
  }
  if (removed.length) {
    changes.push({
      field: "files",
      label: `${label} removed`,
      from: removed.map(fileNameFromUrl).join(", "),
      to: "—",
    });
  }
  return changes;
};

export const describeChanges = (changes = []) =>
  changes.map((c) => `${c.label}: "${c.from}" → "${c.to}"`).join("; ");

/**
 * Persist an activity log entry. Never throws so business operations are not
 * blocked by audit failures.
 * @param {{ req?: any, actor?: any, activity: string, description: string, target?: any,
 *   targetName?: string, targetLicense?: string, targetAccount?: string, entityType?: string,
 *   entityId?: any, amount?: number, changes?: any[], metadata?: Record<string, any> }} entry
 */
export const logActivity = async ({
  req,
  actor,
  activity,
  description,
  target,
  targetName,
  targetLicense,
  targetAccount,
  entityType,
  entityId,
  amount,
  changes,
  metadata,
}) => {
  try {
    const actorDoc = actor || req?.user || null;

    let targetDoc = null;
    if (target && typeof target === "object" && (target.name || target.email)) {
      targetDoc = target;
    } else if (target && mongoose.isValidObjectId(String(target))) {
      targetDoc = await User.findById(String(target))
        .select("name displayName email license role")
        .lean();
    }

    const targetId = targetDoc?._id || (mongoose.isValidObjectId(String(target || "")) ? target : undefined);

    await ActivityLog.create({
      user: actorDoc?._id || undefined,
      activity,
      description,
      targetUser: targetId || undefined,
      targetName: targetName || userLabel(targetDoc) || undefined,
      targetLicense: targetLicense || targetDoc?.license || undefined,
      targetAccount,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      amount,
      metadata: {
        ...(metadata || {}),
        ...(changes && changes.length ? { changes } : {}),
        actorName: userLabel(actorDoc) || undefined,
        actorLicense: actorDoc?.license || undefined,
        actorRole: actorDoc?.role || undefined,
        targetEmail: targetDoc?.email || undefined,
      },
    });
  } catch (err) {
    console.error(`[activity-log] Failed to record "${activity}":`, err);
  }
};

export default logActivity;
