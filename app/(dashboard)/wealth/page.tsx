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
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] my-6">
        {/* Header and Filter Controls */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5"
          data-tour="wealth-header"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Mandate Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Latest mandate transactions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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
              className="rounded-xl shadow-xs"
            />
            <DatePicker
              picker="year"
              placeholder="All Years"
              style={{ width: 120 }}
              value={yearFilter !== "all" ? dayjs(yearFilter, "YYYY") : null}
              onChange={(date) =>
                setYearFilter(date ? date.format("YYYY") : "all")
              }
              className="rounded-xl shadow-xs"
            />
            <WealthForm />
          </div>
        </div>

        {/* Shadcn UI Table Component */}
        <div data-tour="wealth-table">
          <WealthTable quarterFilter={quarterFilter} yearFilter={yearFilter} />
        </div>
      </div>
    </Wrapper>
  );
};

export default Wealth;
