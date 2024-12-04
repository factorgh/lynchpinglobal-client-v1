"use client";

// Import necessary components
import { useGetActivityLogsQuery } from "@/services/activity-logs";
import { SmileOutlined } from "@ant-design/icons";
import { Select, Timeline } from "antd";
import moment from "moment";
import React from "react";
import Wrapper from "../wealth/_components/wapper";
import TimelineWidget from "./_components/TimelineItem"; // Ensure this component is correct

const { Option } = Select;

const ActivityPage: React.FC = () => {
  const { data: activities, isLoading, error } = useGetActivityLogsQuery(null);

  const [filter, setFilter] = React.useState("all");

  // Handle the filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Function to filter activities based on selected filter
  const filteredActivities = React.useMemo(() => {
    if (!activities?.data) return [];

    let filtered = activities?.data.data;

    if (filter === "7days") {
      const sevenDaysAgo = moment().subtract(7, "days");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(sevenDaysAgo)
      );
    } else if (filter === "14days") {
      const fourteenDaysAgo = moment().subtract(14, "days");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(fourteenDaysAgo)
      );
    } else if (filter === "1month") {
      const oneMonthAgo = moment().subtract(1, "months");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(oneMonthAgo)
      );
    }

    return filtered;
  }, [activities?.data, filter]);

  // Avoid state update in the render cycle
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between", // Space between title and filter
            alignItems: "center",
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
            Activity Logs Report
          </h2>

          {/* Filter Dropdown */}
          <Select
            value={filter}
            onChange={handleFilterChange}
            style={{ width: 180 }}
          >
            <Option value="all">All Activities</Option>
            <Option value="7days">Last 7 days</Option>
            <Option value="14days">Last 14 days</Option>
            <Option value="1month">Last 1 month</Option>
          </Select>
        </div>

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
          {filteredActivities.map((activity: any) => (
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
