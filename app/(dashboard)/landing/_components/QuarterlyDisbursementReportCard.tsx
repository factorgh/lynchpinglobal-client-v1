"use client";

import React, { useState } from "react";
import { Card, Button, Progress, Tag } from "antd";
import {
  PieChartOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  LockOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { formatPriceGHS } from "@/lib/helper";
import { QuarterlyDocumentModal } from "./QuarterlyDocumentModal";

interface QuarterlyDisbursementReportCardProps {
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

export const QuarterlyDisbursementReportCard: React.FC<
  QuarterlyDisbursementReportCardProps
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
    Q1: { month: 2, day: 31 },
    Q2: { month: 5, day: 30 },
    Q3: { month: 8, day: 30 },
    Q4: { month: 11, day: 31 },
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

  const totalAccruedDisbursements =
    accruedInterest + addonAccruedReturn + oneOffs + performanceYield;

  return (
    <>
      <Card
        className="h-full rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200/90 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-emerald-50/30"
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
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xl shadow-md shadow-emerald-500/25 shrink-0">
                <PieChartOutlined />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Ledger Report
                </h3>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Disbursement & Yield Ledger ({quarter} {year})
                </p>
              </div>
            </div>

            {isClosed ? (
              <Tag
                color="success"
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold m-0"
              >
                <CheckCircleFilled className="mr-1" /> Reconciled
              </Tag>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Accruing Daily
              </span>
            )}
          </div>

          {/* Ledger Overview Hero Box (Empty document state when accruing, finalized ledger when closed) */}
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-white to-emerald-50/50 border border-emerald-100 shadow-sm flex flex-col justify-between text-center relative overflow-hidden min-h-[220px]">
            {isClosed ? (
              <div className="flex flex-col items-center justify-center my-auto py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 text-2xl shadow-sm mb-3">
                  <FileDoneOutlined />
                </div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Reconciled Ledger Ready
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-950 mb-1">
                  {formatPriceGHS(totalAccruedDisbursements)}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Audited closing for {quarter} {year}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-auto py-1">
                {/* Visual Empty Document Graphic */}
                <div className="relative mb-3">
                  <div className="w-14 h-16 rounded-xl bg-white border-2 border-dashed border-emerald-300 shadow-2xs flex flex-col items-center justify-center p-2">
                    <FileTextOutlined className="text-2xl text-emerald-500 mb-1" />
                    {/* Simulated document lines */}
                    <div className="w-7 h-1 bg-emerald-200 rounded-full mb-1"></div>
                    <div className="w-4 h-1 bg-emerald-100 rounded-full"></div>
                  </div>
                  <span className="absolute -bottom-1 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    Pending
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
                  No Ledger Generated Yet
                </h4>

                <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mb-3">
                  Official disbursement & yield ledger will be compiled upon {quarter} reconciliation closing.
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <ClockCircleOutlined className="text-emerald-500 text-xs" />
                  <span>Scheduled for <strong className="text-emerald-900">{formattedQuarterEnd}</strong></span>
                </div>
              </div>
            )}

            {/* Bottom summary pill strip */}
            <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-emerald-100">
              <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Mandate Portfolios
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {activeInvestmentsCount} {activeInvestmentsCount === 1 ? "Mandate" : "Mandates"}
                </span>
              </div>
              <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Status
                </span>
                <span className="text-xs font-bold text-emerald-800 truncate block">
                  {isClosed ? "Audited & Reconciled" : "Accruing Daily"}
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
                  className="flex-1 font-semibold rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700"
                >
                  View Ledger Report
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
                  Preview available on quarter ledger close
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  {formattedQuarterEnd}
                </span>
              </div>
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
