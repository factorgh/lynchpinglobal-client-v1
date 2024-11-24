"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Notification() {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={5000}
      hideProgressBar={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  );
}

// "use client";

// import Navbar from "@/app/(components)/Navbar";
// import Sidebar from "@/app/(components)/Sidebar";
// import dynamic from "next/dynamic";
// import React from "react";
// import { Provider } from "react-redux";
// import { store } from "../../services/store";
// // import { AuthContextType } from "@/context/authContext"; // Import the AuthContext type

// // Dynamically import AuthProvider (client-side only)
// const AuthProvider = dynamic(
//   () => import("@/context/authContext").then((mod) => mod.AuthProvider),
//   {
//     ssr: false,
//   }
// ) as React.ComponentType<{ children: React.ReactNode }>;

// const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <AuthProvider>
//       <Provider store={store}>
//         <div className="flex bg-gray-50 text-gray-900 w-full min-h-screen">
//           <Sidebar />
//           <main className="flex flex-col w-full h-full flex-1 bg-gray-50 overflow-auto">
//             <Navbar />
//             <div className="overflow-y-auto">{children}</div>
//           </main>
//         </div>
//       </Provider>
//     </AuthProvider>
//   );
// };

// export default DashboardLayout;
