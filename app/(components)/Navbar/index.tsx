"use client";

import {
  useGetUserNotificationsQuery,
  useReadAllNotificationsMutation,
} from "@/services/notifications";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { Badge } from "antd";
import { Inbox, Menu, User } from "lucide-react";
import React, { useEffect, useState } from "react";
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
      className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3.5 bg-transparent select-none gap-3"
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

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shadow-xs">
          <User className="w-4 h-4 text-slate-500" />
        </div>

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
