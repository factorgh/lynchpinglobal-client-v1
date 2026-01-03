"use client";

import { useAuth } from "@/context/authContext";
import {
  Activity,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clipboard,
  Combine,
  Gauge,
  Group,
  Handshake,
  Layout,
  LucideIcon,
  ReceiptText,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Dynamically import SignOutButton to disable SSR
import dynamic from "next/dynamic";
const SignOutButton = dynamic(() => import("../signOut"), { ssr: false });

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed?: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed = false,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        } hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-white" : ""
        }`}
      >
        <Icon className="w-6 h-6 !text-gray-700" />
        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-medium text-gray-700`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const { roles } = useAuth();
  const sidebarClassNames = "flex flex-col h-full w-64 bg-gray-50";

  return (
    <div className="flex flex-col h-screen fixed w-64 bg-gray-50 border-r border-gray-200 gap-5">
      {/* TOP LOGO */}
      <div className="flex gap-3 justify-center  items-center pt-3 ">
        <img className="w-40 h-10" src="/logo.png" alt="logo" />
      </div>

      {/* LINKS */}
      <div className="flex-grow mt-2" data-tour="sidebar-nav">
        {roles === "user" ? (
          <div data-tour="client-menu">
            <SidebarLink
              href="/landing"
              icon={ChartNoAxesCombined}
              label="Dashboard"
            />
            <SidebarLink href="/portfolio" icon={Gauge} label="My Portfolio" />
            <SidebarLink href="/withdrawal" icon={Wallet} label="Withdrawal" />
            <SidebarLink
              href="/terms"
              icon={Handshake}
              label="Terms & Conditions"
            />
          </div>
        ) : (
          <div data-tour="admin-menu">
            <SidebarLink href="/dashboard" icon={Layout} label="Dashboard" />
            <SidebarLink
              href="/wealth"
              icon={CircleDollarSign}
              label="Wealth"
            />
            <SidebarLink href="/assets" icon={Wallet} label="Assets Mgt." />
            <SidebarLink
              href="/rentals"
              icon={Clipboard}
              label="Loans & Rentals"
            />
            <SidebarLink href="/cashout" icon={Combine} label="Cashouts" />
            <SidebarLink href="/users" icon={Group} label="User Mgt." />
            <SidebarLink
              href="/activity"
              icon={Activity}
              label="Activity Log"
            />
            <SidebarLink
              href="/conditions"
              icon={ReceiptText}
              label="Terms Uploader"
            />
          </div>
        )}
        {/* Dynamically imported SignOutButton */}
        <SignOutButton />
      </div>

      {/* FOOTER */}
      {/* <div className="mb-10 text-center h-full flex-col justify-end">
        <p className="text-xs text-gray-500">&copy; 2024 Factorgh</p>
      </div> */}
    </div>
  );
};

export default Sidebar;
