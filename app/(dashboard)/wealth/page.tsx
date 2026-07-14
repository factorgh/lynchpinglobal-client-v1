"use client";

import { useState } from "react";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";
import Wrapper from "./_components/wapper";
import WealthForm from "./_components/wealth-form";
import WealthTable from "./_components/wealth-table";

const Wealth = () => {
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  return (
    <Wrapper>
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f9fafb", // Light background color
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
          marginBottom: "20px",
          marginTop: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #e5e7eb", // Underline for separation
            paddingBottom: "10px",
          }}
          data-tour="wealth-header"
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#111827",
            }}
          >
            Mandate Management
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Select
              defaultValue="all"
              style={{ width: 140 }}
              onChange={(val) => setQuarterFilter(val)}
              options={[
                { value: "all", label: "All Quarters" },
                { value: "Q1", label: "Q1" },
                { value: "Q2", label: "Q2" },
                { value: "Q3", label: "Q3" },
                { value: "Q4", label: "Q4" },
              ]}
            />
            <DatePicker
              picker="year"
              placeholder="All Years"
              style={{ width: 120 }}
              value={yearFilter !== "all" ? dayjs(yearFilter, "YYYY") : null}
              onChange={(date) => setYearFilter(date ? date.format("YYYY") : "all")}
            />
            <WealthForm />
          </div>
        </div>
        <p
          style={{
            fontSize: "16px",
            color: "#4b5563",
            marginTop: "10px",
            marginBottom: "20px",
          }}
        >
          Latest mandate transactions
        </p>
        <div data-tour="wealth-table">
          <WealthTable quarterFilter={quarterFilter} yearFilter={yearFilter} />
        </div>
      </div>
    </Wrapper>
  );
};

export default Wealth;
