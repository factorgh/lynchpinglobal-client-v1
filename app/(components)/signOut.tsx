"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const SignOutButton = ({ isCollapsed }: any) => {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
  };

  return (
    <div
      className={`cursor-pointer flex items-center mx-3 my-0.5 ${
        isCollapsed ? "justify-center p-2.5" : "justify-start px-3.5 py-2.5"
      } hover:text-red-600 hover:bg-red-50 text-slate-600 rounded-xl gap-3 transition-all duration-200 text-xs font-medium`}
      onClick={handleSignOut}
    >
      <LogOut className="w-4 h-4 text-slate-500" />
      <span className={`${isCollapsed ? "hidden" : "block"}`}>
        Sign out
      </span>
    </div>
  );
};

export default SignOutButton;

