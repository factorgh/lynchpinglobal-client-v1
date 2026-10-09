"use client";

import { useAuth } from "@/context/authContext";
import {
  Activity,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Compass,
  FileUp,
  Handshake,
  LayoutDashboard,
  LucideIcon,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import React from "react";

const SignOutButton = dynamic(() => import("../signOut"), { ssr: false });

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed = false,
  onClick,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`cursor-pointer flex items-center mx-3 my-0.5 ${
          isCollapsed ? "justify-center p-2.5" : "justify-start px-3.5 py-2.5"
        } gap-3 rounded-xl transition-all duration-200 text-xs font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-800 font-bold shadow-xs"
            : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70"
        }`}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            isActive ? "text-emerald-700" : "text-slate-600"
          }`}
        />
        <span className={`${isCollapsed ? "hidden" : "block"}`}>{label}</span>
      </div>
    </Link>
  );
};

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { roles } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`flex flex-col h-screen fixed top-0 left-0 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl lg:shadow-[0_0_20px_rgba(0,0,0,0.03)] z-50 py-5 select-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* TOP LOGO & Mobile Close Button */}
        <div className="px-6 pb-4 flex items-center justify-between gap-2.5">
          <img
            className="h-8 w-auto object-contain"
            src="/logo.png"
            alt="Lynchpin Global"
          />
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LINKS */}
        <div className="flex-1 overflow-y-auto mt-2" data-tour="sidebar-nav">
          {roles === "user" ? (
            <div data-tour="client-menu">
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-6 mb-2">
                Menu
              </div>
              <SidebarLink
                href="/landing"
                icon={LayoutDashboard}
                label="Dashboard"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/portfolio"
                icon={Compass}
                label="My Mandates"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/withdrawal"
                icon={Wallet}
                label="Disbursements"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/terms"
                icon={Handshake}
                label="Terms & Conditions"
                onClick={onCloseMobile}
              />
            </div>
          ) : (
            <div data-tour="admin-menu">
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-6 mb-2">
                Menu
              </div>
              <SidebarLink
                href="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/wealth"
                icon={Compass}
                label="Mandates"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/assets"
                icon={ArrowLeftRight}
                label="Asset Transactions"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/rentals"
                icon={Banknote}
                label="Loans & Rentals"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/cashout"
                icon={ArrowUpRight}
                label="Disbursements"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/users"
                icon={Users}
                label="User Mgt."
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/activity"
                icon={Activity}
                label="Activity Log"
                onClick={onCloseMobile}
              />
              <SidebarLink
                href="/conditions"
                icon={FileUp}
                label="Terms Uploader"
                onClick={onCloseMobile}
              />
            </div>
          )}
        </div>

        {/* FOOTER / ACCOUNT */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-6 mb-1.5">
            Account
          </div>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
