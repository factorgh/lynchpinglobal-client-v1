"use client";

import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import AppTour from "@/lib/tour/AppTour";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "../../services/store";

const AuthProvider = dynamic(
  () => import("@/context/authContext").then((mod) => mod.AuthProvider),
  {
    ssr: false,
  }
) as React.ComponentType<{ children: React.ReactNode }>;

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<{ role?: string } | null>(null);

  // Fetch user from localStorage on the client
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === "admin" || user.role === "superadmin") {
        router.push("/dashboard"); // Redirect admins to the admin dashboard.
      } else if (user.role === "user") {
        router.push("/landing"); // Redirect regular users to their dashboard.
      } else {
        router.push("/signup"); // Handle unauthorized roles.
      }
    }
  }, [user, router]);

  return (
    <AuthProvider>
      <Provider store={store}>
        <div className="flex text-gray-900 w-full min-h-screen">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>

          {/* Main content area */}
          <div className="relative z-20 flex w-full ">
            <Sidebar />
            <main className="flex flex-col w-full h-full flex-1 bg-gray-50 overflow-auto ">
              <Navbar />
              <div className="overflow-y-auto ">{children}</div>
              {user && (
                <AppTour 
                  persona={user.role === "admin" || user.role === "superadmin" ? "admin" : "client"} 
                  autoStart={true}
                />
              )}
            </main>
          </div>
        </div>
      </Provider>
    </AuthProvider>
  );
};

export default DashboardLayout;
