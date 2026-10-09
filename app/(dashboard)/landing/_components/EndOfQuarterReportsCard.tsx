"use client";

import React, { useState } from "react";
import { Card, Button, Progress, Tag, Tooltip } from "antd";
import {
  FileTextOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  LockOutlined,
  CheckCircleFilled,
  RiseOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { formatPriceGHS } from "@/lib/helper";
import { QuarterlyDocumentModal } from "./QuarterlyDocumentModal";

interface EndOfQuarterReportsCardProps {
  quarter: string;
  totalBalance: number;
  principal: number;
  accruedInterest: number;
  addOns: number;
  addonAccruedReturn: number;
  oneOffs: number;
  performanceYield: number;
  managementFee: number;
  operationalCost: number;
  guaranteedRate: number;
  activeInvestmentsCount: number;
}

export const EndOfQuarterReportsCard: React.FC<EndOfQuarterReportsCardProps> = ({
  quarter = "Q4",
  totalBalance,
  principal,
  accruedInterest,
  addOns,
  addonAccruedReturn,
  oneOffs,
  performanceYield,
  managementFee,
  operationalCost,
  guaranteedRate,
  activeInvestmentsCount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<
    "mandate-statement" | "yield-report"
  >("mandate-statement");

  const today = new Date();
  const year = today.getFullYear();

  // Determine current quarter end date
  const quarterEndDates: Record<string, { month: number; day: number }> = {
    Q1: { month: 2, day: 31 }, // Mar 31 (0-indexed: 2)
    Q2: { month: 5, day: 30 }, // Jun 30 (0-indexed: 5)
    Q3: { month: 8, day: 30 }, // Sep 30 (0-indexed: 8)
    Q4: { month: 11, day: 31 }, // Dec 31 (0-indexed: 11)
  };

  const quarterStartDates: Record<string, { month: number; day: number }> = {
    Q1: { month: 0, day: 1 },
    Q2: { month: 3, day: 1 },
    Q3: { month: 6, day: 1 },
    Q4: { month: 9, day: 1 },
  };

  const endConfig = quarterEndDates[quarter] || { month: 11, day: 31 };
  const startConfig = quarterStartDates[quarter] || { month: 9, day: 1 };

  const quarterEndDate = new Date(year, endConfig.month, endConfig.day, 23, 59, 59);
  const quarterStartDate = new Date(year, startConfig.month, startConfig.day, 0, 0, 0);

  const totalQuarterDays = Math.max(
    1,
    Math.round(
      (quarterEndDate.getTime() - quarterStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const diffMs = quarterEndDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.min(
    totalQuarterDays,
    Math.max(
      0,
      Math.floor(
        (today.getTime() - quarterStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    )
  );

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((daysElapsed / totalQuarterDays) * 100))
  );

  const isClosed = daysRemaining === 0;

  const formattedQuarterEnd = quarterEndDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const openDocument = (type: "mandate-statement" | "yield-report") => {
    setSelectedDocType(type);
    setIsModalOpen(true);
  };

  const netAccruedReturn =
    accruedInterest + addonAccruedReturn + performanceYield;

  return (
    <>
      <Card
        className="h-full rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between overflow-hidden bg-white"
        bodyStyle={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white text-xl shadow-md shadow-indigo-500/20 shrink-0">
                <FolderOpenOutlined />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  End-Of-Quarter Reports
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {quarter} {year} Official Partner Reconciliation & Statements
                </p>
              </div>
            </div>

            {isClosed ? (
              <Tag
                color="success"
                className="px-3 py-1 rounded-full text-xs font-semibold"
              >
                <CheckCircleFilled className="mr-1" /> Reports Finalized
              </Tag>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Accruing Daily
              </span>
            )}
          </div>

          {/* Daily Count Hero Banner */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 border border-slate-200/80 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {daysRemaining}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Days Remaining
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <ClockCircleOutlined className="text-blue-500" />
                  Until {quarter} closing on {formattedQuarterEnd}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-xs font-semibold text-gray-700">
                  Day {daysElapsed}
                </span>
                <span className="text-xs text-gray-400">
                  {" "}
                  / {totalQuarterDays}
                </span>
                <p className="text-[11px] text-blue-600 font-medium">
                  {progressPercent}% of Quarter Elapsed
                </p>
              </div>
            </div>

            {/* Quarter Timeline Progress Bar */}
            <div className="mt-3">
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor={{
                  "0%": "#3b82f6",
                  "50%": "#6366f1",
                  "100%": "#10b981",
                }}
                trailColor="#e2e8f0"
                size={["100%", 7]}
              />
            </div>
          </div>

          {/* Reports Grid Section */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report 1: Quarterly Mandate Statement */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between hover:border-blue-300 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                      <FileTextOutlined />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                        Quarterly Mandate Statement
                      </h4>
                      <span className="text-[11px] text-gray-500">
                        Official Partner Statement
                      </span>
                    </div>
                  </div>
                  <Tag
                    color={isClosed ? "green" : "blue"}
                    className="m-0 text-[10px] font-semibold rounded-full"
                  >
                    {isClosed ? "Ready" : "Accruing"}
                  </Tag>
                </div>

                <div className="space-y-1.5 my-3 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Active Principal:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceGHS(principal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Accrued Return:</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatPriceGHS(accruedInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Projected Valuation:</span>
                    <span className="font-bold text-blue-700">
                      {formatPriceGHS(totalBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <Button
                  size="small"
                  type={isClosed ? "primary" : "default"}
                  icon={<EyeOutlined />}
                  onClick={() => openDocument("mandate-statement")}
                  className={`flex-1 font-semibold rounded-lg text-xs h-8 ${
                    isClosed
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-blue-200 text-blue-700 hover:text-blue-800 bg-blue-50/40"
                  }`}
                >
                  {isClosed ? "View Statement" : "Preview Statement"}
                </Button>

                {isClosed ? (
                  <Button
                    size="small"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => openDocument("mandate-statement")}
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-lg text-xs h-8"
                  >
                    PDF
                  </Button>
                ) : (
                  <Tooltip
                    title={`Signed statement available on quarter close (${formattedQuarterEnd})`}
                  >
                    <Button
                      size="small"
                      disabled
                      icon={<LockOutlined />}
                      className="rounded-lg text-xs h-8 bg-gray-100 text-gray-400 border-gray-200"
                    >
                      Locked
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Report 2: Disbursement & Yield Report */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                      <PieChartOutlined />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                        Disbursement & Yield Report
                      </h4>
                      <span className="text-[11px] text-gray-500">
                        Accruals & Return Schedule
                      </span>
                    </div>
                  </div>
                  <Tag
                    color={isClosed ? "green" : "cyan"}
                    className="m-0 text-[10px] font-semibold rounded-full"
                  >
                    {isClosed ? "Reconciled" : "30/360 Daily"}
                  </Tag>
                </div>

                <div className="space-y-1.5 my-3 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Scheduled Return:</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatPriceGHS(netAccruedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>One-Off Disb.:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceGHS(oneOffs)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total Portfolio:</span>
                    <span className="font-bold text-emerald-700">
                      {formatPriceGHS(totalBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <Button
                  size="small"
                  type={isClosed ? "primary" : "default"}
                  icon={<EyeOutlined />}
                  onClick={() => openDocument("yield-report")}
                  className={`flex-1 font-semibold rounded-lg text-xs h-8 ${
                    isClosed
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "border-emerald-200 text-emerald-700 hover:text-emerald-800 bg-emerald-50/40"
                  }`}
                >
                  {isClosed ? "View Schedule" : "Preview Schedule"}
                </Button>

                {isClosed ? (
                  <Button
                    size="small"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => openDocument("yield-report")}
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-lg text-xs h-8"
                  >
                    PDF
                  </Button>
                ) : (
                  <Tooltip
                    title={`Payout schedule released on quarter settlement (${formattedQuarterEnd})`}
                  >
                    <Button
                      size="small"
                      disabled
                      icon={<LockOutlined />}
                      className="rounded-lg text-xs h-8 bg-gray-100 text-gray-400 border-gray-200"
                    >
                      Locked
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Document Preview & Printable Modal */}
      <QuarterlyDocumentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType={selectedDocType}
        quarter={quarter}
        year={year}
        data={{
          totalBalance,
          principal,
          accruedInterest,
          addOns,
          addonAccruedReturn,
          oneOffs,
          performanceYield,
          managementFee,
          operationalCost,
          guaranteedRate,
          activeInvestmentsCount,
          quarterEndDate: formattedQuarterEnd,
          daysElapsed,
          totalDays: totalQuarterDays,
          isClosed,
        }}
      />
    </>
  );
};

export default EndOfQuarterReportsCard;
