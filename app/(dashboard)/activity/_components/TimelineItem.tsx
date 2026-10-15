"use client";

import React from "react";
import { Tooltip, Tag } from "antd";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";

interface TimelineItemProps {
  title: string;
  description: string;
  user?: string;
  timestamp: Date | string;
}

const TimelineWidget: React.FC<TimelineItemProps> = ({
  title,
  description,
  user,
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
    (title || "").toLowerCase().includes("change");

  // Determine theme styles
  let theme = {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    cardBg: "bg-white hover:bg-blue-50/20",
    cardBorder: "border-slate-200/80 hover:border-blue-300",
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
      cardBorder: "border-slate-200/80 hover:border-emerald-300",
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
      cardBorder: "border-slate-200/80 hover:border-slate-300",
      badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
      badgeText: "SYSTEM",
      icon: <InfoCircleOutlined className="text-sm text-slate-600" />,
    };
  }

  const formattedTimestamp = moment(timestamp).fromNow();
  const exactTime = moment(timestamp).format("MMM D, YYYY h:mm A");

  return (
    <Tooltip title={`Recorded: ${exactTime}`} placement="top">
      <div
        className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.cardBg} ${theme.cardBorder}`}
      >
        {/* Left Side: Icon + Action Title + Description + Actor */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Action Icon Badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 ${theme.bgColor} ${theme.borderColor}`}
          >
            {theme.icon}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-bold text-xs sm:text-sm tracking-tight ${
                  isDelete ? "text-rose-800" : "text-slate-900"
                }`}
              >
                {title}
              </span>

              <span
                className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${theme.badgeBg}`}
              >
                {theme.badgeText}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-snug line-clamp-2 sm:line-clamp-1">
              {description}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <UserOutlined className="text-[10px] text-slate-400" />
                Performed by:
              </span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                {user || "Administrator"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Timestamp */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 whitespace-nowrap">
            <ClockCircleOutlined className="text-[10px] text-slate-400" />
            {formattedTimestamp}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:block">
            {moment(timestamp).format("h:mm A")}
          </span>
        </div>
      </div>
    </Tooltip>
  );
};

export default TimelineWidget;
