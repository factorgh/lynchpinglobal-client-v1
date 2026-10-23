"use client";

import React from "react";
import { Tooltip } from "antd";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { ShieldCheck, UserCheck, ArrowRight, Wallet, CreditCard } from "lucide-react";

export interface ActivityActor {
  _id?: string;
  name?: string; // username
  displayName?: string;
  email?: string;
  role?: string;
  license?: string;
  photo?: string;
  designation?: string;
}

export interface ActivityTarget {
  _id?: string;
  name?: string;
  displayName?: string;
  license?: string;
  email?: string;
  role?: string;
  photo?: string;
}

export interface TimelineItemProps {
  title: string;
  description: string;
  user?: ActivityActor | string | any;
  targetUser?: ActivityTarget | string | any;
  targetName?: string;
  targetLicense?: string;
  targetAccount?: string;
  entityType?: string;
  amount?: number;
  timestamp: Date | string;
}

const TimelineWidget: React.FC<TimelineItemProps> = ({
  title,
  description,
  user,
  targetUser,
  targetName,
  targetLicense,
  targetAccount,
  entityType,
  amount,
  timestamp,
}) => {
  const isDelete = (title || "").toLowerCase().includes("delete");
  const isCreate =
    (title || "").toLowerCase().includes("create") ||
    (title || "").toLowerCase().includes("new") ||
    (title || "").toLowerCase().includes("entry");
  const isUpdate =
    (title || "").toLowerCase().includes("update") ||
    (title || "").toLowerCase().includes("edit") ||
    (title || "").toLowerCase().includes("change") ||
    (title || "").toLowerCase().includes("mark");

  // Determine theme styles
  let theme = {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    cardBg: "bg-white hover:bg-blue-50/20",
    cardBorder: "border-slate-200/90 hover:border-blue-300",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "UPDATED",
    icon: <EditOutlined className="text-sm text-blue-600" />,
  };

  if (isDelete) {
    theme = {
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      cardBg: "bg-rose-50/30 hover:bg-rose-50/60",
      cardBorder: "border-rose-200 hover:border-rose-300",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
      badgeText: "DELETED",
      icon: <DeleteOutlined className="text-sm text-rose-600" />,
    };
  } else if (isCreate) {
    theme = {
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      cardBg: "bg-white hover:bg-emerald-50/20",
      cardBorder: "border-slate-200/90 hover:border-emerald-300",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badgeText: "CREATED",
      icon: <PlusCircleOutlined className="text-sm text-emerald-600" />,
    };
  } else if (!isUpdate) {
    theme = {
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-200",
      cardBg: "bg-white hover:bg-slate-50",
      cardBorder: "border-slate-200/90 hover:border-slate-300",
      badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
      badgeText: "SYSTEM",
      icon: <InfoCircleOutlined className="text-sm text-slate-600" />,
    };
  }

  // Parse Actor info
  const actorObj: ActivityActor | null = typeof user === "object" && user ? user : null;
  const actorName =
    actorObj?.displayName || actorObj?.name || (typeof user === "string" ? user : "System Administrator");
  const actorUsername = actorObj?.name && actorObj.name !== actorName ? actorObj.name : null;
  const actorRole = (actorObj?.role || "admin").toLowerCase();
  const actorLicense = actorObj?.license;
  const actorPhoto = actorObj?.photo;

  // Parse Target Account / Client info
  const targetUserObj: ActivityTarget | null =
    typeof targetUser === "object" && targetUser ? targetUser : null;
  const resolvedTargetName =
    targetName ||
    targetUserObj?.displayName ||
    targetUserObj?.name ||
    null;
  const resolvedTargetLicense =
    targetLicense || targetUserObj?.license || null;
  const resolvedTargetAccount = targetAccount || null;

  // Initials generator
  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formattedTimestamp = moment(timestamp).fromNow();
  const exactTime = moment(timestamp).format("MMM D, YYYY • h:mm:ss A");

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col gap-3.5 ${theme.cardBg} ${theme.cardBorder}`}
    >
      {/* Top Bar: Action Badge + Title + Exact Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${theme.bgColor} ${theme.borderColor}`}
          >
            {theme.icon}
          </div>

          <h3 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
            {title}
          </h3>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${theme.badgeBg}`}
          >
            {theme.badgeText}
          </span>

          {entityType && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {entityType}
            </span>
          )}
        </div>

        <Tooltip title={`Exact record time: ${exactTime}`} placement="top">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-mono text-[11px]">
              <ClockCircleOutlined className="text-[10px] text-slate-400" />
              {formattedTimestamp}
            </span>
            <span className="text-[10px] text-slate-400 hidden md:inline">
              ({moment(timestamp).format("MMM D, h:mm A")})
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Description Content */}
      <div className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
        {description}
      </div>

      {/* Audit Meta Grid: Performed By (Actor) vs Target Account (Client Affected) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        {/* ACTOR CARD: Who performed the action */}
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-purple-200">
            {actorPhoto ? (
              <img src={actorPhoto} alt={actorName} className="w-full h-full object-cover" />
            ) : (
              getInitials(actorName)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <UserOutlined className="text-[9px]" /> Performed By (Actor)
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                  actorRole === "superadmin"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : actorRole === "admin"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {actorRole === "superadmin"
                  ? "Super Admin"
                  : actorRole === "admin"
                  ? "Admin"
                  : "Staff / User"}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
              <span className="font-bold text-xs text-slate-900 truncate">
                {actorName}
              </span>
              {actorUsername && (
                <span className="text-[10px] font-mono text-slate-400 truncate">
                  @{actorUsername}
                </span>
              )}
              {actorLicense && (
                <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                  {actorLicense}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TARGET CARD: Which account / client was affected */}
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/80">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-400" /> Account Affected (Target)
              </span>

              {amount !== undefined && amount !== null && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  GHS {Number(amount).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 truncate">
              <span className="font-bold text-xs text-slate-900 truncate">
                {resolvedTargetName || "System / Master Account"}
              </span>

              {resolvedTargetLicense && (
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-200">
                  {resolvedTargetLicense}
                </span>
              )}

              {resolvedTargetAccount && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 truncate">
                  {resolvedTargetAccount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineWidget;
