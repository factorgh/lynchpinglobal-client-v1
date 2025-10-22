"use client";

import InboxForm from "@/app/(components)/Navbar/_components/inboxForm";
import { formatPriceGHS } from "@/lib/helper";
import { useGetWithdrawalsQuery } from "@/services/withdrawals";
import { Button, Card, Form, message, Table, Tag } from "antd";
import moment from "moment";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";

// Sample data for withdrawals

const WithdrawalPage = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null);
  const { data: withdrawals, isFetching } = useGetWithdrawalsQuery(null);
  const [showInboxForm, setShowInboxForm] = useState(false);
  console.log(withdrawals?.data.data);

  // Function to open the drawer for creating/editing withdrawals
  const showDrawer = (withdrawal?: any) => {
    setEditingWithdrawal(withdrawal || null);
    form.resetFields();
    setIsDrawerVisible(true);
  };

  const handleShowInboxForm = () => {
    setShowInboxForm(true);
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
      dataIndex: "_id",
      key: "_id",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatPriceGHS(amount),
    },
    {
      title: "Date",
      dataIndex: "requestedDate",
      key: "requestedDate",
      render: (requestedDate: any) =>
        moment(requestedDate).format("YYYY-MM-DD"), // Format the date relative to now
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4 text-white mt-7">
            Withdrawals
          </h1>
          <Button type="primary" onClick={handleShowInboxForm} data-tour="withdrawal-new-request">
            Make a Request
          </Button>
        </div>
        {showInboxForm && (
          <InboxForm
            showInboxForm={showInboxForm}
            setShowInboxForm={setShowInboxForm}
          />
        )}
        <Card className="mt-3">
          <div data-tour="withdrawal-table">
          <Table
            loading={isFetching}
            columns={columns}
            dataSource={withdrawals?.data.data}
            rowKey="id"
          />
          </div>
        </Card>
      </Wrapper>
    </div>
  );
};

export default WithdrawalPage;
