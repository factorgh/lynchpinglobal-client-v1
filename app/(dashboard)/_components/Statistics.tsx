"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useGetAllInvestmentsQuery } from "@/services/investment";
import { formatPriceGHS, round2 } from "@/lib/helper";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Wallet, Percent, Calendar } from "lucide-react";
import moment from "moment";

interface StatisticsProps {
  investments?: any[];
}

export default function Statistics({ investments: propInvestments }: StatisticsProps) {
  const { data: investmentsResponse, isLoading } = useGetAllInvestmentsQuery(null);
  const [viewMode, setViewMode] = useState<"quarterly" | "monthly">("quarterly");

  // Get investment list from props or query
  const rawInvestments: any[] = useMemo(() => {
    if (propInvestments) return propInvestments;
    return investmentsResponse?.data || [];
  }, [propInvestments, investmentsResponse]);

  // Aggregate by Quarter
  const quarterlyData = useMemo(() => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const currentYear = new Date().getFullYear();

    const qMap: Record<string, { principal: number; yield: number; addOns: number; count: number }> = {
      Q1: { principal: 0, yield: 0, addOns: 0, count: 0 },
      Q2: { principal: 0, yield: 0, addOns: 0, count: 0 },
      Q3: { principal: 0, yield: 0, addOns: 0, count: 0 },
      Q4: { principal: 0, yield: 0, addOns: 0, count: 0 },
    };

    rawInvestments.forEach((inv: any) => {
      // Determine quarter from investment field or date
      let q = inv.quarter;
      if (!q && (inv.startDate || inv.createdAt)) {
        const d = new Date(inv.startDate || inv.createdAt);
        const qNum = Math.ceil((d.getMonth() + 1) / 3);
        q = `Q${qNum}`;
      }

      if (q && qMap[q]) {
        const principal = Number(inv.principal) || 0;
        const accrued = Number(inv.totalAccruedReturn || inv.principalAccruedReturn || inv.performanceYield) || 0;
        const addOnsTotal = (inv.addOns || []).reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);

        qMap[q].principal = round2(qMap[q].principal + principal);
        qMap[q].yield = round2(qMap[q].yield + accrued);
        qMap[q].addOns = round2(qMap[q].addOns + addOnsTotal);
        qMap[q].count += 1;
      }
    });

    return quarters.map((q) => {
      const info = qMap[q];
      const totalCapital = round2(info.principal + info.addOns);
      return {
        period: q,
        label: `${q} (${q === "Q1" ? "Jan-Mar" : q === "Q2" ? "Apr-Jun" : q === "Q3" ? "Jul-Sep" : "Oct-Dec"})`,
        capital: totalCapital,
        principal: info.principal,
        yield: info.yield,
        count: info.count,
        year: currentYear,
      };
    });
  }, [rawInvestments]);

  // Aggregate by Month (Current year)
  const monthlyData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const currentYear = new Date().getFullYear();

    const mMap: Record<string, { capital: number; yield: number; count: number }> = {};
    months.forEach((m) => {
      mMap[m] = { capital: 0, yield: 0, count: 0 };
    });

    rawInvestments.forEach((inv: any) => {
      const d = inv.startDate ? new Date(inv.startDate) : inv.createdAt ? new Date(inv.createdAt) : null;
      if (d) {
        const monthName = months[d.getMonth()];
        if (monthName && mMap[monthName]) {
          const principal = Number(inv.principal) || 0;
          const accrued = Number(inv.totalAccruedReturn || inv.principalAccruedReturn) || 0;
          mMap[monthName].capital = round2(mMap[monthName].capital + principal);
          mMap[monthName].yield = round2(mMap[monthName].yield + accrued);
          mMap[monthName].count += 1;
        }
      }
    });

    return months.map((m) => ({
      period: m,
      label: `${m} ${currentYear}`,
      capital: mMap[m].capital,
      yield: mMap[m].yield,
      count: mMap[m].count,
      year: currentYear,
    }));
  }, [rawInvestments]);

  const activeChartData = viewMode === "quarterly" ? quarterlyData : monthlyData;

  // Executive Top-line metrics
  const totals = useMemo(() => {
    const totalCapital = rawInvestments.reduce((sum, inv) => sum + (Number(inv.principal) || 0), 0);
    const totalYield = rawInvestments.reduce(
      (sum, inv) => sum + (Number(inv.totalAccruedReturn || inv.principalAccruedReturn) || 0),
      0
    );
    const avgRate =
      rawInvestments.length > 0
        ? round2(
            rawInvestments.reduce((sum, inv) => sum + (Number(inv.guaranteedRate) || 0), 0) /
              rawInvestments.length
          )
        : 8.0;

    return { totalCapital, totalYield, avgRate, count: rawInvestments.length };
  }, [rawInvestments]);

  // Currency Y-axis formatter
  const formatYAxis = (val: number) => {
    if (val === 0) return "GH₵0";
    if (val >= 1000000) return `GH₵${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `GH₵${(val / 1000).toFixed(0)}k`;
    return `GH₵${val}`;
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[200px] select-none">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-bold text-slate-200">{dataPoint.label}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {dataPoint.count} Mandate{dataPoint.count !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
                <span>Deployed Capital:</span>
              </span>
              <span className="font-bold text-emerald-400">
                {formatPriceGHS(dataPoint.capital)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span>
                <span>Accrued Yield:</span>
              </span>
              <span className="font-bold text-sky-400">
                {formatPriceGHS(dataPoint.yield)}
              </span>
            </div>

            {dataPoint.capital > 0 && (
              <div className="pt-1 mt-1 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Yield Ratio:</span>
                <span className="font-semibold text-slate-300">
                  {((dataPoint.yield / dataPoint.capital) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="relative flex flex-col min-w-0 break-words w-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl p-4 sm:p-6 border border-white/60 bg-white/85 backdrop-blur-md">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h6 className="text-slate-900 text-base font-bold tracking-tight">
              Mandate Performance & Trajectory
            </h6>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Live Data
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Client capital deployment vs. accrued returns across active quarters
          </p>
        </div>

        {/* View Mode Toggle Button */}
        <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => setViewMode("quarterly")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "quarterly"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Quarterly
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "monthly"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50/80 rounded-xl p-3 mb-4 border border-slate-100">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Wallet className="w-3 h-3 text-emerald-600" />
            <span>Active Capital</span>
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800 truncate mt-0.5">
            {formatPriceGHS(totals.totalCapital)}
          </span>
        </div>

        <div className="flex flex-col border-l border-slate-200/80 pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-sky-600" />
            <span>Accrued Yield</span>
          </span>
          <span className="text-sm sm:text-base font-extrabold text-sky-700 truncate mt-0.5">
            {formatPriceGHS(totals.totalYield)}
          </span>
        </div>

        <div className="flex flex-col border-l border-slate-200/80 pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3 h-3 text-amber-600" />
            <span>Avg Rate</span>
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800 truncate mt-0.5">
            {totals.avgRate}%
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeChartData}
            barGap={6}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
              width={65}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(15, 23, 42, 0.03)" }}
            />
            {/* Primary Bar: Deployed Capital */}
            <Bar
              dataKey="capital"
              name="Deployed Capital"
              fill="#059669"
              radius={[6, 6, 0, 0]}
              barSize={viewMode === "quarterly" ? 36 : 16}
            />
            {/* Secondary Bar / Line: Accrued Yield */}
            <Bar
              dataKey="yield"
              name="Accrued Yield"
              fill="#38bdf8"
              radius={[6, 6, 0, 0]}
              barSize={viewMode === "quarterly" ? 22 : 12}
            />
            <Line
              type="monotone"
              dataKey="yield"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0284c7" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#059669]"></span>
            <span className="font-semibold text-slate-700">Deployed Capital (GHS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#38bdf8]"></span>
            <span className="font-semibold text-slate-700">Accrued Yield (GHS)</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Source: Active Lynchpin Global Mandates
        </span>
      </div>
    </Card>
  );
}


