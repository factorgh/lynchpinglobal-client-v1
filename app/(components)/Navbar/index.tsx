"use client";

import { BellAlertIcon } from "@heroicons/react/24/outline";
import { Avatar, Badge } from "antd";
import { Inbox } from "lucide-react";
import moment from "moment";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(user);

  // Date formatter
  const getCurrentFormattedDate = () => {
    const currentDate = moment();
    const dayWithOrdinal = currentDate.format("Do").toUpperCase();
    const monthAndYear = currentDate.format("MMMM, YYYY");
    return `${dayWithOrdinal}, ${monthAndYear}`;
  };

  return (
    <div className="flex justify-end items-center w-full  border-b border-gray-200 p-2 ">
      {/* LEFT SIDE */}

      {/* RIGHT SIDE */}
      <div className="flex justify-between items-center gap-5 mr-5">
        {/* Notification Bell Icon */}

        <div className="flex items-center gap-3 cursor-pointer px-4 py-2 bg-gray-100 rounded-md shadow-sm hover:bg-blue-50 transition duration-300 ease-in-out">
          <span className="text-gray-700 font-semibold text-sm">
            Welcome, <span className="  text-ray-500">{user.name}</span>
          </span>
        </div>

        <hr className="w-0 h-7 border border-solid border-l border-gray-300 mx-3" />
        <div className="flex items-center justify-center gap-5">
          <Badge count={5}>
            <Avatar
              className="bg-gray-100"
              icon={<BellAlertIcon fontSize={15} color="black" />}
              shape="circle"
              size="small"
            />
          </Badge>
          {user.role !== "admin" && <Inbox />}
        </div>
        {/* Profile Image and Link */}
      </div>
    </div>
  );
};

export default Navbar;
