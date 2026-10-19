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
      <div className="flex-1 flex flex-col justify-between">
        {/* Row: Title and Icon */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug line-clamp-2 min-h-[30px] sm:min-h-[32px] flex items-center"
            title={title}
          >
            {title}
          </span>
          <div className="text-base sm:text-lg text-slate-600 p-1.5 rounded-lg bg-slate-100 flex-shrink-0 shrink-0">
            {icon}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-baseline justify-between my-2 sm:my-2.5 gap-2 flex-wrap">
          <span className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight break-words">
            {amount}
          </span>
          {action}
        </div>
      </div>

      {/* Accent Indicator */}
      <div className={`mt-auto h-1 w-full rounded-full ${color || "bg-emerald-400"}`}></div>
    </Card>
  );
};

export default LandingCard;

