import { Card } from "@/components/ui/card";
import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
  color?: "blue" | "green" | "purple" | "red";
}

export const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: DashboardCardProps) => {
  return (
    <Card className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 tracking-tight">
          {title}
        </span>
        <div className="w-7 h-7 rounded-lg border border-slate-200/70 bg-slate-50/60 flex items-center justify-center text-slate-400">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-slate-900 mt-3 tracking-tight">
        {value}
      </div>
      <p className="text-[11px] text-slate-400 mt-1 font-medium">
        {subtitle}
      </p>
    </Card>
  );
};

