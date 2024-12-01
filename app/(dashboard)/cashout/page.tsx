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
      <Tabs defaultValue="payments" className="w-[100%] mt-6">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        {/* Payments Tab Content */}
        <TabsContent value="payments">
          <div className="flex items-center justify-end mb-3">
            <PaymentForm />
          </div>
          <PaymentTable /> {/* Render the Payment Table component */}
        </TabsContent>

        {/* Withdrawals Tab Content */}
        <TabsContent value="withdrawals">
          <div className="flex items-center justify-end mb-3">
            <WithdrawalForm />
          </div>
          <WithdrawalTable /> {/* Render the Withdrawal Table component */}
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
};

export default CashOutPage;
