"use client";

import { useGetUsersQuery } from "@/services/auth";
import { useCreateNotificationMutation } from "@/services/notifications";
import { useCreateWithdrawalMutation } from "@/services/withdrawals";
import { PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Drawer, Form, Input, Select } from "antd";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
const WithdrawalForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createPayment, { isLoading }] = useCreateWithdrawalMutation();
  const { data, isFetching } = useGetUsersQuery(null);
  const [users, setUsers] = useState<any[]>([]);
  const [form] = Form.useForm();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [selectedUser, setSelectedUser] = useState<any[]>([]);
  const [createNotification] = useCreateNotificationMutation();

  // Hnadle file category

  // Update user list when data is fetched
  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  const handleFormSubmit = async (values: any) => {
    try {
      // The API records the activity log entry and any principal deduction.
      await createPayment(values).unwrap();
      // Send notifications
      await createNotification({
        title: "Disbursement Information",
        message: "Disbursement has been made successfully",
        users: [values.user],
      });
      toast.success("Disbursement made successfully");
      form.resetFields();
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating entry:", error);
      toast.error(error?.data?.message || "An error occurred");
    }
  };

  // Show drawer
  const showDrawer = () => setOpen(true);

  // Close drawer
  const onClose = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={showDrawer}
        data-tour="withdrawal-new-request"
        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <PlusOutlined className="text-xs" />
        <span>Mandate Disbursement</span>
      </button>
      <Drawer
        title="Create Mandate Disbursement"
        width={400}
        onClose={onClose}
        open={open}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          hideRequiredMark
        >
          <Form.Item
            name="user"
            label="User"
            rules={[{ required: true, message: "Please select a user" }]}
          >
            <Select
              placeholder="Select a user"
              showSearch
              filterOption={(input, option: any) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={users?.map((user: any) => ({
                value: user._id,
                label: `${user.displayName || user.name} (@${user.name}${
                  user.license ? `, ${user.license}` : ""
                })`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Amount (GHS)"
            name="amount"
            rules={[
              {
                required: true,
                message: `Please input the disbursement amount!`,
              },
            ]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            label="Request Date"
            name="requestedDate"
            rules={[
              {
                required: true,
                message: `Please select the disbursement request date!`,
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Approval Date"
            name="approvedDate"
            dependencies={["status"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const status = getFieldValue("status");
                  if (
                    (status === "Approved" || status === "Processing") &&
                    !value
                  ) {
                    return Promise.reject(
                      new Error(
                        "Approval date is required when status is Approved or Processing.",
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[
              {
                required: true,
                message: `Please select the disbursement status!`,
              },
            ]}
          >
            <Select>
              <Select.Option value="Pending">Pending</Select.Option>
              <Select.Option value="Approved">Approved</Select.Option>
              <Select.Option value="Processing">Processing</Select.Option>
              <Select.Option value="Rejected">Rejected</Select.Option>
              <Select.Option value="Cancelled">Cancelled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              loading={isLoading}
              type="primary"
              htmlType="submit"
              block
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
            >
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default WithdrawalForm;
