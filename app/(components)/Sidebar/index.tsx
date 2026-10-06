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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
        className={`cursor-pointer flex items-center mx-3 my-0.5 ${
          isCollapsed ? "justify-center p-2.5" : "justify-start px-3.5 py-2.5"
        } gap-3 rounded-xl transition-all duration-200 text-xs font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-800 font-bold"
            : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70"
        }`}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            isActive ? "text-emerald-700" : "text-slate-600"
          }`}
        />
        <span className={`${isCollapsed ? "hidden" : "block"}`}>
          {label}
        </span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const { roles } = useAuth();

  return (
    <aside className="flex flex-col h-screen fixed top-0 left-0 w-64 bg-white/90 backdrop-blur-xl border-r border-white/60 shadow-[0_0_20px_rgba(0,0,0,0.03)] z-30 py-5 select-none">
      {/* TOP LOGO */}
      <div className="px-6 pb-4 flex items-center gap-2.5">
        <img className="h-8 w-auto object-contain" src="/logo.png" alt="Lynchpin Global" />
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
            />
            <SidebarLink href="/portfolio" icon={Compass} label="My Mandates" />
            <SidebarLink href="/withdrawal" icon={Wallet} label="Disbursements" />
            <SidebarLink
              href="/terms"
              icon={Handshake}
              label="Terms & Conditions"
            />
          </div>
        ) : (
          <div data-tour="admin-menu">
            <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-6 mb-2">
              Menu
            </div>
            <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarLink
              href="/wealth"
              icon={Compass}
              label="Mandates"
            />
            <SidebarLink href="/assets" icon={ArrowLeftRight} label="Asset Transactions" />
            <SidebarLink
              href="/rentals"
              icon={Banknote}
              label="Loans & Rentals"
            />
            <SidebarLink href="/cashout" icon={ArrowUpRight} label="Disbursements" />
            <SidebarLink href="/users" icon={Users} label="User Mgt." />
            <SidebarLink
              href="/activity"
              icon={Activity}
              label="Activity Log"
            />
            <SidebarLink
              href="/conditions"
              icon={FileUp}
              label="Terms Uploader"
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
  );
};


export default Sidebar;

