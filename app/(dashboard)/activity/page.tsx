"use client";

import { useGetActivityLogsQuery } from "@/services/activity-logs";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  EditOutlined,
  SearchOutlined,
  HistoryOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Select, Empty, Spin, Input } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import TimelineWidget from "./_components/TimelineItem";

const { Option } = Select;

const ActivityPage: React.FC = () => {
  const { data: activities, isLoading, error } = useGetActivityLogsQuery(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<"all" | "deletes" | "creates" | "updates">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const allActivitiesRaw = useMemo(() => {
    return activities?.data?.data || [];
  }, [activities]);

  // Overall metric counters
  const metrics = useMemo(() => {
    let deletes = 0;
    let creates = 0;
    let updates = 0;

    allActivitiesRaw.forEach((a: any) => {
      const act = (a.activity || "").toLowerCase();
      if (act.includes("delete")) deletes += 1;
      else if (act.includes("create") || act.includes("new") || act.includes("entry")) creates += 1;
      else if (act.includes("update") || act.includes("edit") || act.includes("change")) updates += 1;
    });

    return {
      total: allActivitiesRaw.length,
      deletes,
      creates,
      updates,
    };
  }, [allActivitiesRaw]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    let filtered = allActivitiesRaw;

    // Filter by time
    if (timeFilter === "7days") {
      const sevenDaysAgo = moment().subtract(7, "days");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(sevenDaysAgo)
      );
    } else if (timeFilter === "14days") {
      const fourteenDaysAgo = moment().subtract(14, "days");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(fourteenDaysAgo)
      );
    } else if (timeFilter === "1month") {
      const oneMonthAgo = moment().subtract(1, "month");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(oneMonthAgo)
      );
    }

    // Filter by action type
    if (actionFilter === "deletes") {
      filtered = filtered.filter((activity: any) =>
        (activity.activity || "").toLowerCase().includes("delete")
      );
    } else if (actionFilter === "creates") {
      filtered = filtered.filter((activity: any) => {
        const act = (activity.activity || "").toLowerCase();
        return act.includes("create") || act.includes("new") || act.includes("entry");
      });
    } else if (actionFilter === "updates") {
      filtered = filtered.filter((activity: any) => {
        const act = (activity.activity || "").toLowerCase();
        return act.includes("update") || act.includes("edit") || act.includes("change");
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((activity: any) => {
        const title = (activity.activity || "").toLowerCase();
        const desc = (activity.description || "").toLowerCase();
        const actorName = (activity.user?.name || activity.user?.displayName || "").toLowerCase();
        const targetName = (activity.targetName || activity.targetUser?.name || activity.targetUser?.displayName || "").toLowerCase();
        const targetLicense = (activity.targetLicense || activity.targetUser?.license || "").toLowerCase();
        const targetAccount = (activity.targetAccount || "").toLowerCase();

        return (
          title.includes(q) ||
          desc.includes(q) ||
          actorName.includes(q) ||
          targetName.includes(q) ||
          targetLicense.includes(q) ||
          targetAccount.includes(q)
        );
      });
    }

    // Sort by latest first
    return [...filtered].sort(
      (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [allActivitiesRaw, timeFilter, actionFilter, searchQuery]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, actionFilter, searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedActivities = useMemo(() => {
    return filteredActivities.slice(startIndex, startIndex + pageSize);
  }, [filteredActivities, startIndex, pageSize]);

  return (
    <Wrapper>
      <div className="py-5 select-none text-white">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                Activity & Audit Log
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/30">
                {metrics.total} recorded
              </span>
            </div>
            <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
              Monitor administrative operations, user actions, system transactions, and deletions
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 self-stretch lg:self-auto">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/60 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <HistoryOutlined className="text-xs" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Total</p>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5 leading-none">{metrics.total}</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/60 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <DeleteOutlined className="text-xs" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-500 uppercase leading-none">Deletions</p>
                <p className="text-xs font-extrabold text-rose-700 mt-0.5 leading-none">{metrics.deletes}</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/60 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <EditOutlined className="text-xs" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase leading-none">Updates</p>
                <p className="text-xs font-extrabold text-blue-700 mt-0.5 leading-none">{metrics.updates}</p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/60 shadow-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PlusCircleOutlined className="text-xs" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase leading-none">Creations</p>
                <p className="text-xs font-extrabold text-emerald-700 mt-0.5 leading-none">{metrics.creates}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm mb-4 text-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs / Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActionFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  actionFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Activities ({metrics.total})
              </button>

              <button
                type="button"
                onClick={() => setActionFilter("deletes")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  actionFilter === "deletes"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                <DeleteOutlined className="text-xs" />
                Deletions ({metrics.deletes})
              </button>

              <button
                type="button"
                onClick={() => setActionFilter("updates")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  actionFilter === "updates"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                }`}
              >
                <EditOutlined className="text-xs" />
                Updates ({metrics.updates})
              </button>

              <button
                type="button"
                onClick={() => setActionFilter("creates")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  actionFilter === "creates"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <PlusCircleOutlined className="text-xs" />
                Creations ({metrics.creates})
              </button>
            </div>

            {/* Search Input & Time Filter */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <div className="flex-1 sm:w-56 bg-slate-50 rounded-xl px-2.5 py-1 border border-slate-200 flex items-center">
                <SearchOutlined className="text-slate-400 mr-1.5 text-xs" />
                <input
                  type="text"
                  placeholder="Search log entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
                />
              </div>

              <div className="bg-slate-50 rounded-xl px-2 py-0.5 border border-slate-200 shrink-0">
                <Select
                  value={timeFilter}
                  onChange={(val) => setTimeFilter(val)}
                  style={{ width: 115 }}
                  bordered={false}
                  className="font-semibold text-slate-800 text-xs"
                >
                  <Option value="all">All Time</Option>
                  <Option value="7days">Last 7 days</Option>
                  <Option value="14days">Last 14 days</Option>
                  <Option value="1month">Last 30 days</Option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Feed Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/60 shadow-sm text-slate-800">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Spin size="large" />
              <p className="text-xs font-semibold text-slate-500">Loading audit records...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-500 text-xs font-semibold">
              Failed to load activity logs. Please refresh and try again.
            </div>
          ) : paginatedActivities.length === 0 ? (
            <div className="py-16 text-center">
              <Empty
                description={
                  actionFilter === "deletes"
                    ? "No deletion records match the current filter"
                    : "No activities match your search or filter criteria"
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedActivities.map((activity: any) => (
                <TimelineWidget
                  key={activity._id}
                  title={activity.activity}
                  description={activity.description}
                  user={activity.user}
                  targetUser={activity.targetUser}
                  targetName={activity.targetName}
                  targetLicense={activity.targetLicense}
                  targetAccount={activity.targetAccount}
                  entityType={activity.entityType}
                  amount={activity.amount}
                  timestamp={activity.createdAt || activity.date}
                />
              ))}
            </div>
          )}

          {/* Clean Pagination Bar */}
          {!isLoading && totalItems > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Counter / Page size */}
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span>
                  Showing{" "}
                  <strong className="text-slate-800 font-bold">
                    {startIndex + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-slate-800 font-bold">
                    {Math.min(startIndex + pageSize, totalItems)}
                  </strong>{" "}
                  of <strong className="text-slate-800 font-bold">{totalItems}</strong> entries
                </span>

                <span className="text-slate-300">•</span>

                <div className="flex items-center gap-1.5">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={6}>6</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-semibold px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-extrabold text-slate-800 font-mono">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-semibold px-2.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default ActivityPage;
