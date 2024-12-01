"use client";
import { Button, Card, Drawer, Form, Tabs } from "antd";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import PaymentForm from "./payment-form";
import PaymentTable from "./payment-table";
import WithdrawalForm from "./withdrawal-form";
import WithdrawalTable from "./withdrawal-table";

const CashOutPage: React.FC = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState<"withdrawals" | "payments">(
    "withdrawals"
  );

  const sampleWithdrawals: any = [
    // your sample data for withdrawals
  ];

  const samplePayments: any = [
    // your sample data for payments
  ];

  const showDrawer = (record?: any) => {
    setEditingRecord(record || null);
    setIsDrawerVisible(true);
  };

  const onCloseDrawer = () => {
    setIsDrawerVisible(false);
    setEditingRecord(null);
  };

  const onFormSubmit = (values: any) => {
    // handle form submission for withdrawal/payment
  };

  return (
    <Wrapper>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "withdrawals" | "payments")}
      >
        <Tabs.TabPane tab="Withdrawals" key="withdrawals">
          <Button onClick={() => showDrawer()}>Create Withdrawal</Button>
          <Card bordered={false}>
            <WithdrawalTable
              dataSource={sampleWithdrawals}
              onEdit={showDrawer}
            />
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Payments" key="payments">
          <Button onClick={() => showDrawer()}>Create Payment</Button>
          <Card bordered={false}>
            <PaymentTable dataSource={samplePayments} onEdit={showDrawer} />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Drawer visible={isDrawerVisible} onClose={onCloseDrawer}>
        {activeTab === "withdrawals" ? (
          <WithdrawalForm
            form={form}
            onFinish={onFormSubmit}
            initialValues={editingRecord}
          />
        ) : (
          <PaymentForm
            form={form}
            onFinish={onFormSubmit}
            initialValues={editingRecord}
          />
        )}
      </Drawer>
    </Wrapper>
  );
};

export default CashOutPage;
