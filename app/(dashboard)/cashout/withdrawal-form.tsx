"use client";
import { useGetUsersQuery } from "@/services/auth";
import { Button, DatePicker, Form, Input, Select } from "antd";
import { useEffect, useState } from "react";

const WithdrawalForm = ({ onFinish, initialValues, form }: any) => {
  const [users, setUsers] = useState<any>([]);
  const { data } = useGetUsersQuery(null);

  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  return (
    <Form
      form={form}
      initialValues={initialValues}
      onFinish={onFinish}
      layout="vertical"
    >
      <Form.Item
        name="userId"
        label="User"
        rules={[{ required: true, message: "Please select a user" }]}
      >
        <Select
          placeholder="Select a user"
          showSearch
          filterOption={(input, option: any) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={users?.map((user: any) => ({
            value: user._id,
            label: user.name,
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Amount"
        name="amount"
        rules={[
          {
            required: true,
            message: `Please input the withdrawal amount!`,
          },
        ]}
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        label="Request Date"
        name="requestDate"
        rules={[
          {
            required: true,
            message: `Please select the withdrawal request date!`,
          },
        ]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Approval Date"
        name="approvalDate"
        rules={[
          {
            required: true,
            message: `Please select the withdrawal approval date!`,
          },
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
            message: `Please select the withdrawal status!`,
          },
        ]}
      >
        <Select>
          <Select.Option value="Pending">Pending</Select.Option>
          <Select.Option value="Approved">Approved</Select.Option>
          <Select.Option value="Cancelled">Cancelled</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Create
        </Button>
      </Form.Item>
    </Form>
  );
};

export default WithdrawalForm;
