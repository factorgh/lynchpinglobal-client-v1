"use client";

import {
  useGetUserNotificationsQuery,
  useReadAllNotificationsMutation,
} from "@/services/notifications";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { Badge, Dropdown } from "antd";
import { Inbox, Menu, User } from "lucide-react";
import { DownOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import InboxForm from "./_components/inboxForm";
import NotificationModal from "./_components/notificationModal";
import GlobalSearch from "./_components/GlobalSearch";

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const [showInboxForm, setShowInboxForm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [user, setUser] = useState<any>({});
  const { data: allNotifications, refetch } =
    useGetUserNotificationsQuery(null);
  const [readAll] = useReadAllNotificationsMutation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleShowInboxForm = () => {
    setShowInboxForm(true);
  };

  const handleReadAllNotifications = async () => {
    try {
      if (user?._id) {
        await readAll(user._id);
        refetch();
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const displayName = user?.displayName || user?.name || "Member";

  return (
    <header
      className="flex items-center justify-between w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 bg-transparent select-none gap-2 sm:gap-3"
      data-tour="navbar"
    >
      {/* LEFT SIDE: Mobile Menu Toggle + Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-lg">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 rounded-xl bg-white/90 border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Menu className="w-4 h-4 text-slate-700" />
        </button>

        {/* Global Search Feature */}
        <div className="flex-1 min-w-0">
          <GlobalSearch />
        </div>
      </div>

      {/* RIGHT SIDE: Status Badge & Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Status Pill Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-slate-200/80 rounded-full shadow-xs text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="tracking-tight truncate max-w-[120px] lg:max-w-none">
            {displayName}
          </span>
        </div>

        {/* Notifications */}
        <Badge
          className="cursor-pointer"
          onClick={() => {
            setShowNotification(true);
            handleReadAllNotifications();
          }}
          count={
            allNotifications?.data?.filter(
              (notification: any) => notification.read === false
            )?.length || 0
          }
          data-tour="notifications"
        >
          <div className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs">
            <BellAlertIcon className="w-4 h-4 text-slate-600" />
          </div>
        </Badge>

        {user?.role !== "admin" && (
          <div
            onClick={handleShowInboxForm}
            className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <Inbox className="w-4 h-4 text-slate-600" />
          </div>
        )}

        {/* Profile Avatar & Interactive Menu */}
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: "profile-info",
                label: (
                  <div className="px-2 py-1.5 border-b border-slate-100 min-w-[190px]">
                    <p className="font-bold text-xs text-slate-900 leading-tight">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {user?.role || "Member"}
                    </span>
                  </div>
                ),
                disabled: true,
              },
              ...(user?.role === "admin" || user?.role === "superadmin"
                ? [
                    {
                      key: "clients",
                      label: <Link href="/clients" className="text-xs font-medium text-slate-700">Clients Directory</Link>,
                    },
                    {
                      key: "users",
                      label: <Link href="/users" className="text-xs font-medium text-slate-700">User Management</Link>,
                    },
                  ]
                : []),
              {
                key: "password",
                label: <Link href="/users/change-password" className="text-xs font-medium text-slate-700">Change Password</Link>,
              },
              {
                type: "divider",
              },
              {
                key: "logout",
                danger: true,
                label: (
                  <span
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = "/login";
                    }}
                    className="text-xs font-semibold text-rose-600 block cursor-pointer"
                  >
                    Sign Out
                  </span>
                ),
              },
            ],
          }}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-emerald-400/50 transition-all cursor-pointer bg-white/60 shadow-xs"
            aria-label="User Account Menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shadow-xs overflow-hidden">
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <DownOutlined className="text-[10px] text-slate-400 mr-1 hidden sm:block" />
          </button>
        </Dropdown>

        {showInboxForm && (
          <InboxForm
            showInboxForm={showInboxForm}
            setShowInboxForm={setShowInboxForm}
          />
        )}
        {showNotification && (
          <NotificationModal
            showNotification={showNotification}
            setShowNotification={setShowNotification}
            notifications={allNotifications?.data}
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;
