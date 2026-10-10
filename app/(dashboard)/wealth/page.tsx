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
      <div className="py-5 select-none">
        {/* Page Header aligned with global design */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          data-tour="wealth-header"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Mandate Management
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
              Review and manage all client investment mandates
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/60 shadow-xs flex items-center gap-1.5">
              <Select
                defaultValue="all"
                style={{ width: 130 }}
                onChange={(val) => setQuarterFilter(val)}
                options={[
                  { value: "all", label: "All Quarters" },
                  { value: "Q1", label: "Q1" },
                  { value: "Q2", label: "Q2" },
                  { value: "Q3", label: "Q3" },
                  { value: "Q4", label: "Q4" },
                ]}
                bordered={false}
                className="font-semibold text-slate-800 text-xs"
              />
              <DatePicker
                picker="year"
                placeholder="All Years"
                style={{ width: 105 }}
                bordered={false}
                value={yearFilter !== "all" ? dayjs(yearFilter, "YYYY") : null}
                onChange={(date) =>
                  setYearFilter(date ? date.format("YYYY") : "all")
                }
                className="font-semibold text-slate-800 text-xs"
              />
            </div>
            <WealthForm />
          </div>
        </div>

        {/* Mandate Table Card */}
        <div
          className="bg-white/85 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          data-tour="wealth-table"
        >
          <WealthTable quarterFilter={quarterFilter} yearFilter={yearFilter} />
        </div>
      </div>
    </Wrapper>
  );
};

export default Wealth;
