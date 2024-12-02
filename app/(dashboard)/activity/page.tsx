"use client";

// Import necessary components
import { useGetActivityLogsQuery } from "@/services/activity-logs";
import { SmileOutlined } from "@ant-design/icons";
import { Timeline } from "antd";
import Wrapper from "../wealth/_components/wapper";
import TimelineWidget from "./_components/TimelineItem"; // Ensure this component is correct

const ActivityPage: React.FC = () => {
  const { data: activities, isLoading, error } = useGetActivityLogsQuery(null);

  // Safeguard: If data is loading or an error occurred
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching activities.</div>;
  }

  // Handle case where no activities are available
  if (!activities?.data || activities.data.length === 0) {
    return <div>No activities found.</div>;
  }

  return (
    <Wrapper>
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          marginBottom: "20px",
          marginTop: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "10px",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "5px",
          }}
        >
          Weekly Activity Report
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#4b5563",
            marginBottom: "20px",
          }}
        >
          Monitor all administrative activities on the dashboard for better
          tracking and transparency.
        </p>

        <Timeline>
          {activities?.data.data.map((activity: any) => (
            <Timeline.Item
              key={activity._id}
              dot={
                <SmileOutlined style={{ fontSize: "16px", color: "#0ea5e9" }} />
              }
            >
              <TimelineWidget
                dotColor="#0ea5e9"
                title={activity.activity}
                description={activity.description}
                user={activity.user.name}
                timestamp={activity.createdAt} // Format the timestamp
                icon={<SmileOutlined />}
              />
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </Wrapper>
  );
};

export default ActivityPage;
