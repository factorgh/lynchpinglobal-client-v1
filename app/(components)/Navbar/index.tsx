"use client";

import {
  useGetUserNotificationsQuery,
  useReadAllNotificationsMutation,
} from "@/services/notifications";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { Avatar, Badge } from "antd";
import { Inbox, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import InboxForm from "./_components/inboxForm";
import NotificationModal from "./_components/notificationModal";

const Navbar = () => {
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

  const displayName = user?.displayName || user?.name || "Test - ac";

  return (
    <div
      className="flex items-center justify-between w-full px-8 py-3.5 bg-transparent select-none"
      data-tour="navbar"
    >
      {/* LEFT SIDE: Search Bar */}
      <div className="relative flex items-center w-72 max-w-sm">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search anything"
          className="w-full pl-10 pr-4 py-2 bg-[#f1f3f5]/80 hover:bg-[#ebedf0] focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-emerald-300 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
        />
      </div>

      {/* RIGHT SIDE: Status Badge & Notifications & Profile */}
      <div className="flex items-center gap-3.5">
        {/* Status Pill Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-slate-200/80 rounded-full shadow-xs text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="tracking-tight">{displayName}</span>
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
    </div>
  );
};

export default Navbar;

