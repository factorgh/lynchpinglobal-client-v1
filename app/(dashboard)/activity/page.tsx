import { SmileOutlined } from "@ant-design/icons";
import { Timeline, Tooltip } from "antd";
import React from "react";
import Wrapper from "../wealth/_components/wapper";

const ActivityPage: React.FC = () => (
  <Wrapper>
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
      <Timeline
        items={[
          {
            dot: (
              <div
                style={{
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  width: "12px",
                  height: "12px",
                }}
              />
            ),
            children: (
              <Tooltip title="Investment creation completed successfully.">
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "#10b981",
                    }}
                  >
                    Created a new investment
                  </p>
                  <p style={{ fontSize: "14px", color: "#4b5563" }}>
                    Description: Initiated an investment portfolio for client X.
                  </p>
                  <p style={{ fontSize: "14px", color: "#4b5563" }}>
                    User: John Doe (Admin)
                  </p>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    2015-09-01 | 09:00 AM | Duration: 30 mins
                  </span>
                </div>
              </Tooltip>
            ),
          },
          {
            dot: (
              <div
                style={{
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  width: "12px",
                  height: "12px",
                }}
              />
            ),
            children: (
              <Tooltip title="System error encountered during setup.">
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "#ef4444",
                    }}
                  >
                    System error occurred
                  </p>
                  <p style={{ fontSize: "14px", color: "#4b5563" }}>
                    Description: Unable to connect to the database.
                  </p>
                  <p style={{ fontSize: "14px", color: "#4b5563" }}>
                    User: Jane Smith (Tech Support)
                  </p>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    2015-09-01 | 10:30 AM
                  </span>
                </div>
              </Tooltip>
            ),
          },
          {
            dot: (
              <SmileOutlined style={{ fontSize: "16px", color: "#0ea5e9" }} />
            ),
            children: (
              <Tooltip title="Custom activity logged successfully.">
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "#0ea5e9",
                    }}
                  >
                    Custom activity logged
                  </p>
                  <p style={{ fontSize: "14px", color: "#4b5563" }}>
                    Description: User logged a custom activity for tracking.
                  </p>
                  <p style={{ fontSize: "14px", color: "#4b5563" }}>
                    User: Alex Brown (Manager)
                  </p>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    2015-09-01 | 01:00 PM
                  </span>
                </div>
              </Tooltip>
            ),
          },
        ]}
      />
    </div>
  </Wrapper>
);

export default ActivityPage;
