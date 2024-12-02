// TimelineItem.tsx

import { Card, Tooltip } from "antd";
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

  return (
    <Tooltip title={description}>
      <Card className="bg-gray-100 rounded-md">
        <div className="p-3 border border-gray-200 bg-white rounded-md">
          <p
            style={{
              margin: 0,
              fontWeight: "bold",
              fontSize: "16px",
              color: dotColor === "#10b981" ? dotColor : "#ef4444",
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: "14px", color: "#4b5563" }}>{description}</p>
          <p style={{ fontSize: "14px", color: "#4b5563" }}>User: {user}</p>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            {moment(timestamp).fromNow()} |
          </span>
        </div>
      </Card>
    </Tooltip>
  );
};

export default TimelineWidget;
