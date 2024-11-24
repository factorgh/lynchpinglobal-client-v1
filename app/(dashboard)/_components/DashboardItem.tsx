import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface DashboardCardProps {
  title: string;
  value: string;
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
  trend,
  color = "blue",
}: DashboardCardProps) => {
  const colorClasses = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    purple: "bg-purple-100",
    red: "bg-red-100",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    red: "text-red-600",
  };

  const bgColorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 translate-y-[-50%] rounded-full ${bgColorClasses[color]} opacity-10`}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        {/* {trend && (
          <div className="flex items-center mt-2">
            <ChevronUp
              className={`h-4 w-4 ${
                trend >= 0 ? "text-green-500" : "text-red-500"
              }`}
            />
            <span
              className={`text-sm ${
                trend >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(trend)}% from last month
            </span>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};
