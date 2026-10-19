import { Card } from "antd";
import React from "react";

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  amount: string;
  color?: string;
  percentageChange?: string;
  trendColor?: string;
  subtitle?: string;
}

const CustomCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  amount,
  color,
  subtitle,
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

        {/* Amount & Subtitle in middle of tall card */}
        <div className="flex-1 flex flex-col justify-center my-2 sm:my-3">
          <span className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight break-words">
            {amount}
          </span>
          {subtitle && (
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Accent Indicator */}
      <div className={`mt-auto h-1 w-full rounded-full ${color || "bg-slate-400"}`}></div>
    </Card>
  );
};

export default CustomCard;

