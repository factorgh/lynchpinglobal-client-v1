"use client";

import React, { useState } from "react";
import { Card, Progress, Tag, Button, Tooltip } from "antd";
import {
  PieChartOutlined,
  DownloadOutlined,
  EyeOutlined,
  LockOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { formatPriceGHS } from "@/lib/helper";
import { QuarterlyDocumentModal } from "./QuarterlyDocumentModal";

interface QuarterlyDisbursementReportCardProps {
  quarter: string;
  year?: number;
  totalBalance: number;
  principal: number;
  accruedInterest: number;
  addOns?: number;
  addonAccruedReturn?: number;
  oneOffs?: number;
  performanceYield?: number;
  managementFee?: number;
  operationalCost?: number;
  guaranteedRate?: number;
  activeInvestmentsCount?: number;
}

export const QuarterlyDisbursementReportCard: React.FC<
  QuarterlyDisbursementReportCardProps
> = ({
  quarter,
  year = new Date().getFullYear(),
  totalBalance,
  principal,
  accruedInterest,
  addOns = 0,
  addonAccruedReturn = 0,
  oneOffs = 0,
  performanceYield = 0,
  managementFee = 0,
  operationalCost = 0,
  guaranteedRate = 0,
  activeInvestmentsCount = 1,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quarter Calculation
  const now = new Date();
  const currentMonth = now.getMonth();
  const quarterIndex = Math.floor(currentMonth / 3);
  const quarterStartMonth = quarterIndex * 3;
  const quarterStartDate = new Date(year, quarterStartMonth, 1);
  const nextQuarterStart = new Date(year, quarterStartMonth + 3, 1);
  const quarterEndDate = new Date(nextQuarterStart.getTime() - 1);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalQuarterDays = Math.max(
    1,
    Math.round((nextQuarterStart.getTime() - quarterStartDate.getTime()) / msPerDay)
  );
  const msRemaining = quarterEndDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / msPerDay));
  const daysElapsed = Math.min(
    totalQuarterDays,
    Math.max(1, totalQuarterDays - daysRemaining + 1)
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

  const totalDisbursements = accruedInterest + addonAccruedReturn + oneOffs + performanceYield;

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
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xl shadow-md shadow-emerald-500/20">
                <PieChartOutlined />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  End-Of-Quarter Report
                </h3>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Disbursement & Yield Report ({quarter} {year})
                </p>
              </div>
            </div>

            {isClosed ? (
              <Tag color="success" className="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <CheckCircleFilled className="mr-1" /> Reconciled
              </Tag>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <RiseOutlined className="text-emerald-600" />
                30/360 Daily Rate
              </span>
            )}
          </div>

          {/* Daily Count Hero Box */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30 border border-emerald-100/60 relative overflow-hidden">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-950">
                    {daysRemaining}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Days to Payout
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <ClockCircleOutlined className="text-emerald-500" />
                  Quarterly settlement on {formattedQuarterEnd}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-gray-700">
                  {totalQuarterDays - daysRemaining} Days
                </span>
                <span className="text-[11px] text-gray-400"> Accrued</span>
                <p className="text-[10px] text-emerald-600 font-medium">
                  {progressPercent}% Complete
                </p>
              </div>
            </div>

            {/* Quarter Timeline Progress Bar */}
            <div className="mt-3">
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor={{
                  "0%": "#10b981",
                  "100%": "#0d9488",
                }}
                trailColor="#e2e8f0"
                size={["100%", 7]}
              />
            </div>
          </div>

          {/* Real-Time Yield Highlights */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-gray-50/80 border border-gray-100">
              <span className="text-gray-500 font-medium">Total Accrued Yield:</span>
              <span className="font-bold text-emerald-600">
                +{formatPriceGHS(totalDisbursements)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-gray-50/80 border border-gray-100">
              <span className="text-gray-500 font-medium">
                Contractual Rate:
              </span>
              <span className="font-bold text-gray-800">
                {guaranteedRate ? `${guaranteedRate}% p.a.` : "Active Terms"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-gray-50/80 border border-gray-100">
              <span className="text-gray-500 font-medium">Add-on Return:</span>
              <span className="font-bold text-emerald-700">
                +{formatPriceGHS(addonAccruedReturn)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Button
              type={isClosed ? "primary" : "default"}
              icon={<EyeOutlined />}
              onClick={() => setIsModalOpen(true)}
              className={`flex-1 font-semibold rounded-xl text-xs h-9 ${
                isClosed
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:border-emerald-400 bg-emerald-50/40"
              }`}
            >
              {isClosed ? "View Full Report" : "View Interim Yield Ledger"}
            </Button>

            {isClosed ? (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-xl text-xs h-9"
              >
                Download PDF
              </Button>
            ) : (
              <Tooltip title={`Full audited yield report released upon quarter settlement (${formattedQuarterEnd})`}>
                <Button
                  disabled
                  icon={<LockOutlined />}
                  className="rounded-xl text-xs h-9 bg-gray-100 text-gray-400 border-gray-200"
                >
                  Locked
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </Card>

      {/* Full Yield Document Modal */}
      <QuarterlyDocumentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType="yield-report"
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

export default QuarterlyDisbursementReportCard;
