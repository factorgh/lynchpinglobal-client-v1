"use client";

import { Card, Form, message, Table, Tag } from "antd";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";

// Sample data for withdrawals
const sampleWithdrawals = [
  {
    key: 1,
    id: 1,
    amount: 1000,
    date: "2024-11-01",
    status: "Pending",
  },
  {
    key: 2,
    id: 2,
    amount: 2000,
    date: "2024-11-15",
    status: "Approved",
  },
];

const WithdrawalPage = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null);

  // Function to open the drawer for creating/editing withdrawals
  const showDrawer = (withdrawal?: any) => {
    setEditingWithdrawal(withdrawal || null);
    form.resetFields();
    setIsDrawerVisible(true);
  };

  // Function to handle drawer closing
  const onCloseDrawer = () => {
    setIsDrawerVisible(false);
    setEditingWithdrawal(null);
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "green";
        if (status === "Approved") {
          color = "red";
        }

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  // Function to handle form submission
  const handleFormSubmit = (values: any) => {
    // If we are editing, update the record, else create a new withdrawal
    if (editingWithdrawal) {
      // Update logic
      message.success("Withdrawal updated successfully!");
    } else {
      // Create logic
      message.success("Withdrawal created successfully!");
    }
    setIsDrawerVisible(false);
    setEditingWithdrawal(null);
  };

  return (
    <div>
      <Wrapper>
        <h1 className="text-2xl font-bold mb-4 text-white mt-7">Withdrawals</h1>
        <Card className="mt-3">
          <Table columns={columns} dataSource={sampleWithdrawals} rowKey="id" />
        </Card>
      </Wrapper>
    </div>
  );
};

export default WithdrawalPage;
