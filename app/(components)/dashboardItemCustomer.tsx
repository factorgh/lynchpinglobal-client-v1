"use client";

import { formatPriceGHS } from "@/lib/helper";
import React from "react";

interface DashboardItemCustomerProps {
  item: {
    title: string;
    number: number;
    change: number;
    icon: React.ReactNode;
  };
}

const DashboardItemCustomer: React.FC<DashboardItemCustomerProps> = ({
  item,
}) => {
  return (
    <div className="bg-gradient-to-br from-white via-gray-100 to-gray-200 hover:bg-gradient-to-tl hover:from-gray-200 hover:via-gray-300 hover:to-white p-5 rounded-xl flex gap-5 cursor-pointer w-full shadow-md hover:shadow-lg transition duration-200 ease-in-out">
      <div className="text-xl text-blue-500 bg-blue-100 w-12 h-12 rounded-full p-2 flex items-center justify-center">
        {item.icon}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm uppercase tracking-wide text-gray-600 font-medium">
          {item.title}
        </span>
        <span className="text-2xl font-bold text-gray-800">
          {formatPriceGHS(item.number)}
        </span>
      </div>
    </div>
  );
};

export default DashboardItemCustomer;
