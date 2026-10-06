"use client";
import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "Jan", currentQuarter: 65, lastQuarter: 40 },
  { month: "Feb", currentQuarter: 78, lastQuarter: 68 },
  { month: "Mar", currentQuarter: 66, lastQuarter: 86 },
  { month: "Apr", currentQuarter: 44, lastQuarter: 74 },
  { month: "May", currentQuarter: 56, lastQuarter: 56 },
  { month: "Jun", currentQuarter: 67, lastQuarter: 60 },
  { month: "Jul", currentQuarter: 75, lastQuarter: 87 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] text-white p-2.5 rounded-lg shadow-xl text-[11px] font-medium space-y-1 min-w-[90px]">
        <p className="text-slate-300 font-semibold border-b border-slate-700/60 pb-1 text-[10px]">
          {label} 2024
        </p>
        <div className="flex items-center justify-between gap-3 text-slate-200 pt-0.5">
          <span>Current</span>
          <span className="font-bold text-white">{payload[0]?.value}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-200">
          <span>Last</span>
          <span className="font-bold text-white">{payload[1]?.value}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default function Statistics() {
  if (!data || data.length === 0) {
    return (
      <Card className="relative flex flex-col min-w-0 break-words w-full shadow-sm rounded-2xl p-6 border border-slate-100 bg-white">
        <div className="text-center py-10">
          <h6 className="text-slate-400 text-sm font-semibold">
            No data available
          </h6>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative flex flex-col min-w-0 break-words w-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] rounded-2xl p-6 border border-slate-100/90 bg-white">
      <div className="mb-4">
        <h6 className="text-slate-900 mb-0.5 text-base font-bold tracking-tight">
          Statistics
        </h6>
        <p className="text-slate-400 text-xs font-medium">
          Investment metrics over the last year
        </p>
      </div>
      <div
        style={{
          width: "100%",
          height: "280px",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barGap={4}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f8fafc", opacity: 0.6 }}
            />
            <Bar
              dataKey="currentQuarter"
              name="Current quarter"
              fill="#1e7e48"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
            <Bar
              dataKey="lastQuarter"
              name="Last quarter"
              fill="#a3e635"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend below the chart */}
      <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1e7e48]"></span>
          <span>Current quarter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#a3e635]"></span>
          <span>Last quarter</span>
        </div>
      </div>
    </Card>
  );
}

