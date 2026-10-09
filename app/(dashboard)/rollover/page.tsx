"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Select,
  Input,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  RefreshCw,
  Layers,
  Search,
  ArrowRight,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  Settings,
  Sparkles,
  FileText,
} from "lucide-react";
import { formatPriceGHS } from "@/lib/helper";
import Wrapper from "../wealth/_components/wapper";
import {
  useGetRolloverCandidatesQuery,
  useExecuteSingleRolloverMutation,
  useExecuteBatchRolloverMutation,
  useCalculateDailyAccrualsMutation,
} from "@/services/investment";
import RolloverEditModal from "./_components/RolloverEditModal";
import RolloverBatchModal from "./_components/RolloverBatchModal";

// Helper to calculate current and previous quarter
const getDefaultQuarters = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 - 11
  const currentQNum = Math.floor(currentMonth / 3) + 1;
  const currentQ = `Q${currentQNum}`;
  const prevQ = currentQNum === 1 ? "Q4" : `Q${currentQNum - 1}`;
  return { prevQ, currentQ };
};

export default function RolloverPage() {
  const { prevQ: defaultSource, currentQ: defaultTarget } = useMemo(
    () => getDefaultQuarters(),
    []
  );

  const [sourceQuarter, setSourceQuarter] = useState<string>(defaultSource);
  const [targetQuarter, setTargetQuarter] = useState<string>(defaultTarget);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all");

  // Modals state
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // RTK Query hooks
  const {
    data: candidatesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetRolloverCandidatesQuery(
    { sourceQuarter, targetQuarter },
    { refetchOnMountOrArgChange: true }
  );

  const [executeSingleRollover, { isLoading: isSingleLoading }] =
    useExecuteSingleRolloverMutation();
  const [executeBatchRollover, { isLoading: isBatchLoading }] =
    useExecuteBatchRolloverMutation();
  const [calculateDailyAccruals, { isLoading: isAccrualsLoading }] =
    useCalculateDailyAccrualsMutation();

  const candidatesData = candidatesResponse?.data?.candidates || [];
  const summary = candidatesResponse?.data?.summary || {
    totalCandidates: 0,
    alreadyRolledOverCount: 0,
    pendingCount: 0,
    totalEndingPrincipal: 0,
    totalAccruedReturn: 0,
    totalProjectedRollover: 0,
  };

  // Filter candidates by search term & status tab
  const filteredCandidates = useMemo(() => {
    return candidatesData.filter((item: any) => {
      // Status tab filter
      if (activeTab === "pending" && item.isRolledOver) return false;
      if (activeTab === "completed" && !item.isRolledOver) return false;

      // Search term filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const userName = (item.user?.name || item.user?.displayName || "").toLowerCase();
      const userEmail = (item.user?.email || "").toLowerCase();
      const userLicense = (item.user?.license || "").toLowerCase();
      const mandateName = (item.name || "").toLowerCase();
      const txId = (item.transactionId || "").toLowerCase();

      return (
        userName.includes(term) ||
        userEmail.includes(term) ||
        userLicense.includes(term) ||
        mandateName.includes(term) ||
        txId.includes(term)
      );
    });
  }, [candidatesData, activeTab, searchTerm]);

  // Handle single rollover submit from edit modal
  const handleEditModalSubmit = async (payload: any) => {
    try {
      const res: any = await executeSingleRollover(payload).unwrap();
      message.success(
        res?.message ||
          `Mandate successfully rolled over to ${targetQuarter} with manual values!`
      );
      setIsEditModalOpen(false);
      setSelectedCandidate(null);
      refetch();
    } catch (err: any) {
      message.error(
        err?.data?.message || err?.message || "Failed to execute rollover"
      );
    }
  };

  // Quick 100% full compounding rollover
  const handleQuickRollover = async (candidate: any) => {
    try {
      const payload = {
        investmentId: candidate.investmentId,
        targetQuarter,
        newPrincipal: candidate.suggestedNewPrincipal || candidate.netClosingBalance,
        guaranteedRate: candidate.guaranteedRate ?? 8,
        managementFeeRate: candidate.managementFeeRate ?? 20,
        operationalCost: candidate.operationalCost ?? 0,
        performanceYield: candidate.performanceYield ?? 0,
      };

      const res: any = await executeSingleRollover(payload).unwrap();
      message.success(
        res?.message ||
          `Mandate for ${candidate.user?.name || "client"} rolled over to ${targetQuarter}!`
      );
      refetch();
    } catch (err: any) {
      message.error(
        err?.data?.message || err?.message || "Failed to execute quick rollover"
      );
    }
  };

  // Handle batch rollover confirm
  const handleBatchConfirm = async () => {
    const pendingCandidates = candidatesData.filter((c: any) => !c.isRolledOver);
    if (pendingCandidates.length === 0) {
      message.info("No pending mandates to roll over.");
      setIsBatchModalOpen(false);
      return;
    }

    try {
      const rollovers = pendingCandidates.map((c: any) => ({
        investmentId: c.investmentId,
        newPrincipal: c.suggestedNewPrincipal || c.netClosingBalance,
        guaranteedRate: c.guaranteedRate ?? 8,
        managementFeeRate: c.managementFeeRate ?? 20,
        operationalCost: c.operationalCost ?? 0,
        performanceYield: c.performanceYield ?? 0,
        targetQuarter,
      }));

      const res: any = await executeBatchRollover({
        rollovers,
        targetQuarter,
      }).unwrap();

      message.success(
        res?.message ||
          `Batch rollover completed! ${pendingCandidates.length} mandates advanced to ${targetQuarter}.`
      );
      setIsBatchModalOpen(false);
      refetch();
    } catch (err: any) {
      message.error(
        err?.data?.message || err?.message || "Failed to execute batch rollover"
      );
    }
  };

  // Handle run daily accruals
  const handleCalculateAccruals = async () => {
    try {
      const res: any = await calculateDailyAccruals({}).unwrap();
      message.success(
        res?.message || "Daily accruals successfully updated for all active mandates!"
      );
      refetch();
    } catch (err: any) {
      message.error(
        err?.data?.message || err?.message || "Failed to calculate daily accruals"
      );
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Client & License",
      key: "client",
      width: 280,
      render: (_, record) => {
        const clientName = record.user?.name || record.user?.displayName || "Unnamed Client";
        const email = record.user?.email || "No email";
        const license = record.user?.license;
        const initial = clientName.trim().charAt(0).toUpperCase() || "C";

        return (
          <div className="flex items-center space-x-3 py-1">
            {/* Emerald avatar matching Recent Clients */}
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-xs tracking-tight leading-tight truncate">
                  {clientName}
                </span>
                {record.isJoint && (
                  <Tag color="purple" className="text-[10px] px-1.5 py-0 font-bold m-0">
                    Joint
                  </Tag>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5 truncate">
                {email}
              </p>
              {license ? (
                <div className="mt-1">
                  {/* License pill tag matching dashboard screenshot */}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {license}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400">License unassigned</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Mandate",
      key: "mandate",
      width: 190,
      render: (_, record) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block truncate">
            {record.name || "Standard Mandate"}
          </span>
          <span className="text-[11px] text-slate-400 font-mono block">
            ID: {record.transactionId || "—"}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Tag color="orange" className="text-[10px] font-bold px-1.5 py-0 m-0">
              {record.sourceQuarter || sourceQuarter}
            </Tag>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <Tag color="green" className="text-[10px] font-bold px-1.5 py-0 m-0">
              {targetQuarter}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Ending Principal",
      key: "endingPrincipal",
      align: "right",
      width: 140,
      render: (_, record) => (
        <div className="text-right">
          <span className="text-xs font-bold text-slate-700">
            {formatPriceGHS(record.endingPrincipal)}
          </span>
          <span className="text-[10px] text-slate-400 block">Base capital</span>
        </div>
      ),
    },
    {
      title: "Accrued Return",
      key: "accruedReturn",
      align: "right",
      width: 140,
      render: (_, record) => (
        <div className="text-right">
          <span className="text-xs font-black text-emerald-600">
            +{formatPriceGHS(record.accruedReturn)}
          </span>
          <span className="text-[10px] text-emerald-700/70 block">Quarterly yield</span>
        </div>
      ),
    },
    {
      title: "Net Closing Value",
      key: "netClosingBalance",
      align: "right",
      width: 160,
      render: (_, record) => (
        <div className="text-right bg-slate-50/70 px-2 py-1 rounded-lg">
          <span className="text-sm font-black text-slate-900 block">
            {formatPriceGHS(record.netClosingBalance)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium block">
            Principal + Accrued
          </span>
        </div>
      ),
    },
    {
      title: "Rollover Terms",
      key: "rolloverTerms",
      width: 180,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">New Capital:</span>
            <span className="font-bold text-slate-800">
              {formatPriceGHS(record.suggestedNewPrincipal || record.netClosingBalance)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag color="blue" className="text-[10px] font-semibold px-1 py-0 m-0">
              Rate: {record.guaranteedRate ?? 8}%
            </Tag>
            <Tag color="cyan" className="text-[10px] font-semibold px-1 py-0 m-0">
              Fee: {record.managementFeeRate ?? 20}%
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      align: "center",
      render: (_, record) => {
        if (record.isRolledOver) {
          return (
            <Tooltip
              title={`Successfully rolled over into ${targetQuarter}. New Tx ID: ${
                record.existingRolloverTransactionId || "Available"
              }`}
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Rolled Over
              </div>
            </Tooltip>
          );
        }

        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 200,
      render: (_, record) => {
        if (record.isRolledOver) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-medium text-slate-400 italic">
                Advanced into {targetQuarter}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-2">
            {/* Configure button matching Add Client emerald button */}
            <button
              onClick={() => {
                setSelectedCandidate(record);
                setIsEditModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>

            <Popconfirm
              title="Execute 100% Full Rollover?"
              description={`Rolls over ${formatPriceGHS(
                record.netClosingBalance
              )} with 8% rate to ${targetQuarter}.`}
              okText="Roll Over Now"
              cancelText="Cancel"
              okButtonProps={{ className: "bg-emerald-600 text-white font-bold" }}
              onConfirm={() => handleQuickRollover(record)}
            >
              <button
                type="button"
                className="border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 bg-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                100% Quick
              </button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <Wrapper>
      <div className="py-5 select-none">
        {/* Page Header matching Dashboard Screenshot Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm flex items-center gap-2">
              <span>Quarterly Rollover</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                Admin Control
              </span>
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
              Review ending quarter balances, adjust rollover terms individually, or batch advance mandates
            </p>
          </div>

          {/* Header Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Quarter Selector widget */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/60 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ending:
              </span>
              <Select
                value={sourceQuarter}
                onChange={(val) => setSourceQuarter(val)}
                style={{ width: 85 }}
                options={[
                  { value: "Q1", label: "Q1" },
                  { value: "Q2", label: "Q2" },
                  { value: "Q3", label: "Q3" },
                  { value: "Q4", label: "Q4" },
                ]}
                bordered={false}
                className="font-bold text-slate-800"
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                New:
              </span>
              <Select
                value={targetQuarter}
                onChange={(val) => setTargetQuarter(val)}
                style={{ width: 85 }}
                options={[
                  { value: "Q1", label: "Q1" },
                  { value: "Q2", label: "Q2" },
                  { value: "Q3", label: "Q3" },
                  { value: "Q4", label: "Q4" },
                ]}
                bordered={false}
                className="font-bold text-emerald-700"
              />
            </div>

            {/* Run Daily Accruals Button (matching Add Client styling) */}
            <button
              onClick={handleCalculateAccruals}
              disabled={isAccrualsLoading}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAccrualsLoading ? "Calculating..." : "Run Daily Accruals"}</span>
            </button>

            {/* Batch Rollover Button (matching Add Client styling) */}
            <button
              onClick={() => setIsBatchModalOpen(true)}
              disabled={summary.pendingCount === 0 || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Rollover ({summary.pendingCount})</span>
            </button>

            {/* Refresh Button */}
            <Tooltip title="Refresh candidates">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:text-emerald-700 border border-white/60 shadow-xs flex items-center justify-center transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 4 KPI Cards Matching Dashboard Screenshot Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* Card 1: Ending Principal */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Assets & Wealth
              </span>
              <div className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100/90 flex items-center justify-center text-slate-600">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
              {formatPriceGHS(summary.totalEndingPrincipal)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Ending base principal in {sourceQuarter}
            </p>
          </div>

          {/* Card 2: Accrued Returns */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Accrued Profit
              </span>
              <div className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100/90 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2.5 tracking-tight">
              +{formatPriceGHS(summary.totalAccruedReturn)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Client returns to capitalize
            </p>
          </div>

          {/* Card 3: Projected Rollover Capital */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Projected Total
              </span>
              <div className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100/90 flex items-center justify-center text-slate-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
              {formatPriceGHS(summary.totalProjectedRollover)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Projected {targetQuarter} starting sum
            </p>
          </div>

          {/* Card 4: Rollover Progress */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Rollover Progress
              </span>
              <div className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100/90 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
              {summary.alreadyRolledOverCount} / {summary.totalCandidates}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
              <span>{summary.pendingCount} pending</span>
              <span className="font-bold text-emerald-700">
                {summary.totalCandidates > 0
                  ? Math.round(
                      (summary.alreadyRolledOverCount / summary.totalCandidates) * 100
                    )
                  : 0}
                % complete
              </span>
            </p>
          </div>
        </div>

        {/* Table Container Card Matching Dashboard Card Style */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
            {/* Status Tabs with emerald active state */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All Mandates ({candidatesData.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-white text-amber-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending ({summary.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "completed"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Rolled Over ({summary.alreadyRolledOverCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80">
              <Input
                placeholder="Search client name, email, or license..."
                prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                className="rounded-xl h-9 border-slate-200 hover:border-emerald-400 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Rollover Candidates Table */}
          <Table
            columns={columns}
            dataSource={filteredCandidates}
            rowKey={(record) => record.investmentId || record.transactionId}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => (
                <span className="text-xs text-slate-500 font-medium">
                  Showing {range[0]}-{range[1]} of {total} mandates
                </span>
              ),
            }}
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-slate-300" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No Mandates Found
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    There are no mandates matching the selected quarters ({sourceQuarter} →{" "}
                    {targetQuarter}) or search query.
                  </p>
                </div>
              ),
            }}
            scroll={{ x: 1050 }}
            className="rollover-table"
          />
        </div>
      </div>

      {/* Edit / Customize Rollover Modal */}
      {selectedCandidate && (
        <RolloverEditModal
          visible={isEditModalOpen}
          candidate={selectedCandidate}
          targetQuarter={targetQuarter}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCandidate(null);
          }}
          onSubmit={handleEditModalSubmit}
          loading={isSingleLoading}
        />
      )}

      {/* Batch Rollover Modal */}
      <RolloverBatchModal
        visible={isBatchModalOpen}
        candidates={candidatesData}
        targetQuarter={targetQuarter}
        sourceQuarter={sourceQuarter}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={handleBatchConfirm}
        loading={isBatchLoading}
      />
    </Wrapper>
  );
}
