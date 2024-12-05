import { Card, Space, Tag, Tooltip } from "antd";
import moment from "moment";

interface TimelineItemProps {
  dotColor: string;
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  icon?: React.ReactNode; // Optional for custom icons like SmileOutlined
}

const TimelineWidget: React.FC<TimelineItemProps> = ({
  dotColor,
  title,
  description,
  user,
  timestamp,
  icon,
}) => {
  const defaultIcon = (
    <div
      style={{
        backgroundColor: dotColor,
        borderRadius: "50%",
        width: "12px",
        height: "12px",
      }}
    />
  );

  // Formatting the timestamp to show "X ago" format
  const formattedTimestamp = moment(timestamp).fromNow();

  return (
    <Tooltip title={description}>
      <Card
        className="activity-card"
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="activity-content" style={{ padding: 16 }}>
          <Space size="middle">
            {/* Icon section */}
            <div
              style={{
                backgroundColor: dotColor,
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                fontSize: "18px",
              }}
            >
              {icon || defaultIcon}
            </div>

            {/* Text section */}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: "16px",
                  color: dotColor === "#10b981" ? dotColor : "#ef4444",
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: "14px", color: "#4b5563" }}>
                {description}
              </p>

              {/* User info and timestamp */}
              <div style={{ display: "flex", gap: 15, marginTop: 10 }}>
                <p style={{ fontSize: "12px", color: "#4b5563" }}>
                  User: <strong>{user}</strong>
                </p>
                <Tag color="default" style={{ fontSize: "12px" }}>
                  {formattedTimestamp}
                </Tag>
              </div>
            </div>
          </Space>
        </div>
      </Card>
    </Tooltip>
  );
};

export default TimelineWidget;
