import { Modal } from "antd";
import moment from "moment";

const NotificationModal = ({
  showNotification,
  setShowNotification,
  notifications,
}: any) => {
  return (
    <Modal
      title="Notifications"
      width={1000}
      open={showNotification}
      onCancel={() => setShowNotification(false)}
      footer={null}
    >
      {notifications?.map((notification: any) => (
        <div key={notification._id}>
          <p>{notification.title}</p>
          <p>{notification.message}</p>
          <p>{moment(notification.createdAt).fromNow()}</p>
        </div>
      ))}
    </Modal>
  );
};

export default NotificationModal;
