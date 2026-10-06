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
    <Card className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 tracking-tight">
          {title}
        </span>
        <div className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100/90 flex items-center justify-center text-slate-600">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
        {value}
      </div>
      <p className="text-xs text-slate-500 mt-1 font-medium">
        {subtitle}
      </p>
    </Card>
  );
};


