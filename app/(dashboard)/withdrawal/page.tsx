"use client";

import { Form, message, Table, Tabs, Tag } from "antd";
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
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "All Withdrawals",
              children: (
                <div>
                  <div className="flex justify-between items-center">
                    <h2>My Withdrawals</h2>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={sampleWithdrawals}
                    rowKey="id"
                  />
                </div>
              ),
            },
          ]}
        />
      </Wrapper>
    </div>
  );
};

export default WithdrawalPage;
