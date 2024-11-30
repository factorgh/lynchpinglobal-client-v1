"use client";
import { SmileOutlined } from "@ant-design/icons";
import { Card, Timeline, Tooltip } from "antd";
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
                <Card className="bg-gray-100 rounded-md">
                  <div className="p-3 border border-gray-200 bg-white rounded-md">
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
                      Description: Initiated an investment portfolio for client
                      X.
                    </p>
                    <p style={{ fontSize: "14px", color: "#4b5563" }}>
                      User: John Doe (Admin)
                    </p>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      2015-09-01 | 09:00 AM | Duration: 30 mins
                    </span>
                  </div>
                </Card>
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
                <Card className="bg-gray-100 rounded-md">
                  <div className="p-3 border border-gray-200 bg-white rounded-md">
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
                      Description: Initiated an investment portfolio for client
                      X.
                    </p>
                    <p style={{ fontSize: "14px", color: "#4b5563" }}>
                      User: John Doe (Admin)
                    </p>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      2015-09-01 | 09:00 AM | Duration: 30 mins
                    </span>
                  </div>
                </Card>
              </Tooltip>
            ),
          },
          {
            dot: (
              <SmileOutlined style={{ fontSize: "16px", color: "#0ea5e9" }} />
            ),
            children: (
              <Tooltip title="Custom activity logged successfully.">
                <Card className="bg-gray-100 rounded-md">
                  <div className="p-3 border border-gray-200 bg-white rounded-md">
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
                      Description: Initiated an investment portfolio for client
                      X.
                    </p>
                    <p style={{ fontSize: "14px", color: "#4b5563" }}>
                      User: John Doe (Admin)
                    </p>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      2015-09-01 | 09:00 AM | Duration: 30 mins
                    </span>
                  </div>
                </Card>
              </Tooltip>
            ),
          },
        ]}
      />
    </div>
  </Wrapper>
);

export default ActivityPage;
