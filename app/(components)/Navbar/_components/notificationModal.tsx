import { UserOutlined } from "@ant-design/icons";
import { Card, Divider, Modal, Tag, Typography } from "antd";
import moment from "moment";

const { Title, Text } = Typography;

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
      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {notifications?.length > 0 ? (
          notifications.map((notification: any) => (
            <Card key={notification._id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {/* User Avatar (or default icon) */}
                <UserOutlined style={{ fontSize: 24, marginRight: 12 }} />
                <div>
                  {/* Notification Title */}
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {notification.title}
                  </Title>
                  {/* Notification Message */}
                  <Text style={{ display: "block", marginBottom: 8 }}>
                    {notification.message}
                  </Text>
                  {/* Notification Timestamp */}
                  <Tag color="blue" style={{ fontSize: 12 }}>
                    {moment(notification.createdAt).fromNow()}
                  </Tag>
                </div>
              </div>
              <Divider style={{ margin: "16px 0" }} />
            </Card>
          ))
        ) : (
          <h3>No Notifications</h3>
        )}
      </div>
    </Modal>
  );
};

export default NotificationModal;
