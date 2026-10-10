import { Card } from "antd";
import React from "react";

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  amount: string;
  percentageChange?: string;
  trendColor?: string;
  color?: string;
  action?: React.ReactNode;
}

const LandingCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  amount,
  percentageChange,
  trendColor,
  color,
  action,
}) => {
  return (
    <Card
      className="w-full h-full bg-white/95 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/80 backdrop-blur-xs flex flex-col justify-between"
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px",
          height: "100%",
        },
      }}
    >
      <div>
        {/* Row: Icon and Title */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 line-clamp-1"
            title={title}
          >
            {title}
          </span>
          <div className="text-base sm:text-lg text-slate-600 p-1.5 rounded-lg bg-slate-100 flex-shrink-0">
            {icon}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-baseline justify-between mt-2.5 gap-2">
          <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {amount}
          </span>
          {action}
        </div>
      </div>

      {/* Accent Indicator */}
      <div className={`mt-3 h-1 w-full rounded-full ${color || "bg-emerald-400"}`}></div>
    </Card>
  );
};

export default LandingCard;
