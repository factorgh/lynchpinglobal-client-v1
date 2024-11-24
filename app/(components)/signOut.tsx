"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const SignOutButton = ({ isCollapsed, isActive, Icon }: any) => {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();

    router.replace("/login");
  };

  return (
    <div
      className={`cursor-pointer flex items-center ${
        isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
      } hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
        isActive ? "bg-blue-200 text-white" : ""
      }`}
      onClick={handleSignOut} // Handle sign-out on click
    >
      <LogOut className="w-6 h-6 !text-gray-700" />
      <span
        className={`${
          isCollapsed ? "hidden" : "block"
        } font-medium text-gray-700`}
      >
        Sign out
      </span>
    </div>
  );
};

export default SignOutButton;
