"use client";

import React, { useState } from "react";
import { Card, Button, Progress, Tag } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  LockOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { QuarterlyDocumentModal } from "./QuarterlyDocumentModal";

interface QuarterlyStatementCardProps {
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

export const QuarterlyMandateStatementCard: React.FC<
  QuarterlyStatementCardProps
> = ({
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
  const today = new Date();
  const year = today.getFullYear();

  // Determine current quarter end date
  const quarterEndDates: Record<string, { month: number; day: number }> = {
    Q1: { month: 2, day: 31 }, // Mar 31
    Q2: { month: 5, day: 30 }, // Jun 30
    Q3: { month: 8, day: 30 }, // Sep 30
    Q4: { month: 11, day: 31 }, // Dec 31
  };

  const quarterStartDates: Record<string, { month: number; day: number }> = {
    Q1: { month: 0, day: 1 },
    Q2: { month: 3, day: 1 },
    Q3: { month: 6, day: 1 },
    Q4: { month: 9, day: 1 },
  };

  const endConfig = quarterEndDates[quarter] || { month: 11, day: 31 };
  const startConfig = quarterStartDates[quarter] || { month: 9, day: 1 };

  const quarterEndDate = new Date(
    year,
    endConfig.month,
    endConfig.day,
    23,
    59,
    59
  );
  const quarterStartDate = new Date(
    year,
    startConfig.month,
    startConfig.day,
    0,
    0,
    0
  );

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

  return (
    <>
      <Card
        className="h-full rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200/90 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-blue-50/30"
        bodyStyle={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div className="flex flex-col h-full justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md shadow-blue-500/25 shrink-0">
                <FileTextOutlined />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  End-Of-Quarter Report
                </h3>
                <p className="text-xs text-blue-700 font-medium mt-0.5">
                  Quarterly Mandate Statement ({quarter} {year})
                </p>
              </div>
            </div>

            {isClosed ? (
              <Tag
                color="success"
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold m-0"
              >
                <CheckCircleFilled className="mr-1" /> Ready
              </Tag>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                Accruing Daily
              </span>
            )}
          </div>

          {/* Centralized Count Hero Box */}
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-white to-blue-50/60 border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Top status indicator inside box */}
            <span className="text-[11px] font-semibold text-blue-600 tracking-wider uppercase mb-2">
              Official Statement Countdown
            </span>

            {/* Centralized Big Number */}
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-blue-900 leading-none">
                {daysRemaining}
              </span>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
              Days Remaining
            </span>

            {/* Subtext info */}
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 mb-4">
              <ClockCircleOutlined className="text-blue-500" />
              Until {quarter} closing on{" "}
              <span className="font-semibold text-slate-700">
                {formattedQuarterEnd}
              </span>
            </p>

            {/* Quarter Timeline Progress Bar */}
            <div className="w-full max-w-xs">
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor={{
                  "0%": "#3b82f6",
                  "100%": "#6366f1",
                }}
                trailColor="#e2e8f0"
                size={["100%", 7]}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2">
                <span>Day {daysElapsed} of {totalQuarterDays}</span>
                <span className="text-blue-600 font-semibold">
                  {progressPercent}% Elapsed
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions - Preview only visible on the quarter */}
          <div className="pt-2">
            {isClosed ? (
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 font-semibold rounded-xl text-xs h-9 bg-blue-600 hover:bg-blue-700"
                >
                  View Full Statement
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-xl text-xs h-9"
                >
                  Download PDF
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs shadow-sm">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <LockOutlined className="text-slate-400" />
                  Preview available on quarter close
                </span>
                <span className="text-xs font-semibold text-blue-700">
                  {formattedQuarterEnd}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Full Statement Document Modal */}
      <QuarterlyDocumentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType="mandate-statement"
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

export default QuarterlyMandateStatementCard;
