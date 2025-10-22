import {
  useGetUserNotificationsQuery,
  useReadAllNotificationsMutation,
} from "@/services/notifications";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { Avatar, Badge, Tag } from "antd";
import { Inbox } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import InboxForm from "./_components/inboxForm";
import NotificationModal from "./_components/notificationModal";

const Navbar = () => {
  const [showInboxForm, setShowInboxForm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const { data: allNotifications, refetch } =
    useGetUserNotificationsQuery(null); // Include refetch for notifications
  const [readAll] = useReadAllNotificationsMutation();

  console.log(allNotifications?.data);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(user);

  const handleShowInboxForm = () => {
    setShowInboxForm(true);
  };

  const handleReadAllNotifications = async () => {
    console.log(user._id);
    try {
      // Mark all notifications as read
      await readAll(user._id);
      // After marking as read, refetch the notifications to update the UI
      refetch();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Date formatter
  const getCurrentFormattedDate = () => {
    const currentDate = moment();
    const dayWithOrdinal = currentDate.format("Do").toUpperCase();
    const monthAndYear = currentDate.format("MMMM, YYYY");
    return `${dayWithOrdinal}, ${monthAndYear}`;
  };

  return (
    <div className="flex justify-end items-center w-full  border-b border-gray-200 p-2 " data-tour="navbar">
      {/* LEFT SIDE */}

      {/* RIGHT SIDE */}
      <div className="flex justify-between items-center gap-5 mr-5">
        {/* Notification Bell Icon */}
        <div className="flex items-center gap-3 cursor-pointer px-4 py-2 bg-gray-100 rounded-md shadow-sm hover:bg-blue-50 transition duration-300 ease-in-out">
          <span className="text-gray-700 font-semibold text-sm">
            <Tag color="geekblue">{user.displayName}</Tag>
          </span>
        </div>

        <hr className="w-0 h-7 border border-solid border-l border-gray-300 mx-3" />
        <div className="flex items-center justify-center gap-5">
          <Badge
            className="cursor-pointer"
            onClick={() => {
              console.log("clicked");
              setShowNotification(true);
              handleReadAllNotifications();
              console.log("read");
            }}
            count={
              allNotifications?.data.filter(
                (notification: any) => notification.read === false
              ).length
            }
            data-tour="notifications"
          >
            <Avatar
              className="bg-gray-100"
              icon={<BellAlertIcon fontSize={15} color="black" />}
              shape="circle"
              size="small"
            />
          </Badge>
          {user.role !== "admin" && (
            <Inbox className="cursor-pointer" onClick={handleShowInboxForm} />
          )}
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
        {/* Profile Image and Link */}
      </div>
    </div>
  );
};

export default Navbar;
