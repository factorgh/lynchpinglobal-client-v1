import { Card } from "antd";
import React from "react";

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  amount: string;
  percentageChange?: string;
  trendColor?: string;
}

const CustomCard: React.FC<DashboardCardProps> = ({ icon, title, amount }) => {
  return (
    <Card
      className="max-w-sm h-60 bg-gradient-to-br rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 relative"
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px",
      }}
    >
      {/* Icon positioned at the top-right */}
      <div className="absolute top-4 right-4 text-3xl text-gray-600">
        {icon}
      </div>

      {/* Title */}
      <div className="text-center mt-12 mb-4">
        {" "}
        {/* Adjust top margin for spacing */}
        <span className="text-xs uppercase font-medium tracking-wider text-gray-500">
          {title}
        </span>
      </div>

      {/* Amount */}
      <div className="flex justify-center items-center mt-2">
        <span className="text-sm font-semibold text-gray-800">{amount}</span>
      </div>

      {/* Divider */}
      <div className="mt-4 h-1 w-full bg-gradient-to-r from-sky-400 to-green-400 rounded-full"></div>
    </Card>
  );
};

export default CustomCard;
