"use client";

import { useGetActivityLogsQuery } from "@/services/activity-logs";
import { SmileOutlined } from "@ant-design/icons";
import { Select, Timeline, Empty, Spin } from "antd";
import moment from "moment";
import React from "react";
import Wrapper from "../wealth/_components/wapper";
import TimelineWidget from "./_components/TimelineItem";

const { Option } = Select;

const ActivityPage: React.FC = () => {
  const { data: activities, isLoading, error } = useGetActivityLogsQuery(null);
  const [filter, setFilter] = React.useState("all");

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

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
      const oneMonthAgo = moment().subtract(1, "month");
      filtered = filtered.filter((activity: any) =>
        moment(activity.createdAt).isAfter(oneMonthAgo)
      );
    }

    return filtered;
  }, [activities, filter]);

  return (
    <Wrapper>
      <div className="py-5 select-none text-white">
        {/* Page Header aligned with global design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Activity & Audit Log
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
              Monitor administrative operations, user actions, and system transactions
            </p>
          </div>

          {/* Filter Dropdown */}
          <div className="self-start sm:self-auto bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/60 shadow-xs">
            <Select
              value={filter}
              onChange={handleFilterChange}
              style={{ width: 150 }}
              bordered={false}
              className="font-semibold text-slate-800 text-xs"
              data-tour="activity-filters"
            >
              <Option value="all">All Activities</Option>
              <Option value="7days">Last 7 days</Option>
              <Option value="14days">Last 14 days</Option>
              <Option value="1month">Last 1 month</Option>
            </Select>
          </div>
        </div>

        {/* Timeline Container Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-slate-800">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-500 text-xs">
              Failed to load activity logs. Please try again.
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-12 text-center">
              <Empty description="No activities found for the selected period" />
            </div>
          ) : (
            <Timeline data-tour="activity-table" className="pt-2">
              {filteredActivities.map((activity: any) => (
                <Timeline.Item
                  key={activity._id}
                  dot={
                    <SmileOutlined style={{ fontSize: "15px", color: "#059669" }} />
                  }
                >
                  <TimelineWidget
                    dotColor="#059669"
                    title={activity.activity}
                    description={activity.description}
                    user={activity.user?.name}
                    timestamp={activity.createdAt}
                    icon={<SmileOutlined />}
                  />
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default ActivityPage;
