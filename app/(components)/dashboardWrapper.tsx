"use client";

import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import React from "react";
import { Provider } from "react-redux";
import { store } from "../../services/store";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <div className="flex bg-gray-50 text-gray-900 w-full min-h-screen">
        <Sidebar />
        <main
          className="flex flex-col w-full h-full  flex-1 bg-gray-50 overflow-auto 
        
        "
        >
          <Navbar />
          <div className="oveflow-y-auto">{children}</div>
        </main>
      </div>
    </Provider>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default DashboardWrapper;
