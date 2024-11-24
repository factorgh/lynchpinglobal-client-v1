"use client";

import moment from "moment";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(user);

  // Date formatter
  const getCurrentFormattedDate = () => {
    const currentDate = moment(); // Fetch current date
    const dayWithOrdinal = currentDate.format("Do").toUpperCase(); // Get day with ordinal suffix in uppercase
    const monthAndYear = currentDate.format("MMMM, YYYY"); // Get full month and year
    return `${dayWithOrdinal}, ${monthAndYear}`; // Combine and return formatted date
  };

  return (
    <div className="flex justify-end items-center w-full mb-7 border-b border-gray-200 p-2 ">
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
        {getCurrentFormattedDate()}
        {/* Profile Image and Link */}
      </div>
    </div>
  );
};

export default Navbar;
