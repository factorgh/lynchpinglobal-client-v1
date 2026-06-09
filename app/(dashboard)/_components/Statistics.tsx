"use client";
import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "January", currentQuarter: 65, lastQuarter: 40 },
  { month: "February", currentQuarter: 78, lastQuarter: 68 },
  { month: "March", currentQuarter: 66, lastQuarter: 86 },
  { month: "April", currentQuarter: 44, lastQuarter: 74 },
  { month: "May", currentQuarter: 56, lastQuarter: 56 },
  { month: "June", currentQuarter: 67, lastQuarter: 60 },
  { month: "July", currentQuarter: 75, lastQuarter: 87 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-3.5 rounded-xl shadow-xl space-y-2">
        <p className="font-semibold text-slate-800 text-xs tracking-tight">{label}</p>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0284c7" }}></span>
          <span className="text-slate-600 text-xs font-medium">
            Current Quarter: <span className="font-bold text-slate-900">{payload[0]?.value}</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#c084fc" }}></span>
          <span className="text-slate-600 text-xs font-medium">
            Last Quarter: <span className="font-bold text-slate-900">{payload[1]?.value}</span>
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default function Statistics() {
  if (!data || data.length === 0) {
    return (
      <Card className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-md rounded-2xl p-6 border-0 bg-white">
        <div className="text-center py-10">
          <h6 className="text-slate-400 text-sm font-semibold">
            No data available
          </h6>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative flex flex-col min-w-0 break-words w-full shadow-md rounded-2xl p-6 border-0 bg-white">
      <div className="rounded-t mb-2 bg-transparent">
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
          height: "400px",
          borderRadius: "16px",
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={data}
            barGap={6}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="currentQuarterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.75}/>
              </linearGradient>
              <linearGradient id="lastQuarterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#e879f9" stopOpacity={0.75}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
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
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} 
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: '#f8fafc', opacity: 0.5 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingTop: "24px",
                fontSize: "12px",
                fontWeight: "500",
                color: "#64748b",
              }}
            />
            <Bar
              dataKey="currentQuarter"
              name="Current Quarter"
              fill="url(#currentQuarterGradient)"
              radius={[4, 4, 0, 0]}
              barSize={14}
            />
            <Bar
              dataKey="lastQuarter"
              name="Last Quarter"
              fill="url(#lastQuarterGradient)"
              radius={[4, 4, 0, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
