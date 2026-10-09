"use client";

import React, { useState } from "react";
import { Card, Progress, Tag, Button, Tooltip } from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  LockOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { formatPriceGHS } from "@/lib/helper";
import { QuarterlyDocumentModal } from "./QuarterlyDocumentModal";

interface QuarterlyStatementCardProps {
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

export const QuarterlyMandateStatementCard: React.FC<
  QuarterlyStatementCardProps
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
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md shadow-blue-500/20">
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
              <Tag color="success" className="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <CheckCircleFilled className="mr-1" /> Ready
              </Tag>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                Accruing Daily
              </span>
            )}
          </div>

          {/* Daily Count Hero Box */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 border border-blue-100/60 relative overflow-hidden">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-blue-900">
                    {daysRemaining}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Days Remaining
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <ClockCircleOutlined className="text-blue-500" />
                  Until {quarter} closing on {formattedQuarterEnd}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-gray-700">
                  Day {daysElapsed}
                </span>
                <span className="text-[11px] text-gray-400"> / {totalQuarterDays}</span>
                <p className="text-[10px] text-blue-600 font-medium">
                  {progressPercent}% Elapsed
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
                  "100%": "#6366f1",
                }}
                trailColor="#e2e8f0"
                size={["100%", 7]}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions - Preview only visible on the quarter */}
        <div className="mt-5 pt-3 border-t border-gray-100">
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
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <LockOutlined className="text-slate-400" />
                Preview available on quarter close
              </span>
              <span className="text-[11px] font-semibold text-blue-700">
                {formattedQuarterEnd}
              </span>
            </div>
          )}
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
