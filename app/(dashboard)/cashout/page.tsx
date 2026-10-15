"use client";

import React from "react";
import Wrapper from "../wealth/_components/wapper";
import WithdrawalForm from "./withdrawal-form";
import WithdrawalTable from "./withdrawal-table";
import Link from "next/link";
import { InfoCircleOutlined, ExportOutlined } from "@ant-design/icons";

const CashOutPage: React.FC = () => {
  return (
    <Wrapper>
      {/* Page Header */}
      <div className="py-5 text-white mb-6 select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            Mandate Disbursements & Withdrawals
          </h1>
          <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
            Review and execute approved client mandate disbursements and principal withdrawals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WithdrawalForm />
        </div>
      </div>

      {/* Guidance Note: Additional contributions are handled as Add-Ons on the Mandates page */}
      <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md flex items-start gap-3 text-white">
        <InfoCircleOutlined className="text-base text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-emerald-200">
            Mandate Disbursement Operations
          </p>
          <p className="text-white/80 leading-relaxed">
            This module is dedicated exclusively to client withdrawal requests and mandate disbursements.
            To record additional client capital contributions, navigate to the{" "}
            <Link
              href="/wealth"
              className="text-emerald-300 font-bold underline hover:text-white inline-flex items-center gap-1"
            >
              Mandates Directory <ExportOutlined className="text-xs inline" />
            </Link>{" "}
            and attach an <strong>Add-On</strong> directly to the client's active mandate.
          </p>
        </div>
      </div>

      {/* Main Content Area: Mandate Disbursements Table */}
      <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
        <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Disbursement Requests & History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified client mandate withdrawals and historical settlements
            </p>
          </div>
        </div>

        <div data-tour="admin-withdrawal-table">
          <WithdrawalTable />
        </div>
      </div>
    </Wrapper>
  );
};

export default CashOutPage;
