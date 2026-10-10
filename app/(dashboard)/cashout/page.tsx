"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Wrapper from "../wealth/_components/wapper";
import PaymentForm from "./payment-form";
import PaymentTable from "./payment-table";
import WithdrawalForm from "./withdrawal-form";
import WithdrawalTable from "./withdrawal-table";
// Import WithdrawalTable component

const CashOutPage: React.FC = () => {
  return (
    <Wrapper>
      <div className="py-5 text-white mb-6 select-none">
        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          Disbursements & Payments
        </h1>
        <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
          Process payments and review client mandate disbursement requests
        </p>
      </div>

      <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
        <Tabs
          defaultValue="payments"
          className="w-full"
          data-tour="cashout-tabs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
            <TabsList data-tour="cashout-tab-list">
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="withdrawals">Mandate Disbursements</TabsTrigger>
            </TabsList>
          </div>

          {/* Payments Tab Content */}
          <TabsContent value="payments">
            <div
              className="flex items-center justify-end mb-4"
              data-tour="cashout-new-payment"
            >
              <PaymentForm />
            </div>
            <div data-tour="payment-table">
              <PaymentTable />
            </div>
          </TabsContent>

          {/* Withdrawals Tab Content */}
          <TabsContent value="withdrawals">
            <div
              className="flex items-center justify-end mb-4"
              data-tour="withdrawal-form"
            >
              <WithdrawalForm />
            </div>
            <div data-tour="admin-withdrawal-table">
              <WithdrawalTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Wrapper>
  );
};

export default CashOutPage;
