"use client";

import { useCreateLoanMutation } from "@/services/loan";
import { PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Drawer, Form, Input, Select } from "antd";
import React, { useState } from "react";
import { toast } from "react-toastify";

const NonClientLoanForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [createLoan, { isLoading }] = useCreateLoanMutation();

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  const handleSubmit = async (values: any) => {
    try {
      const startDateIso = values.startDate?.toDate?.()
        ? values.startDate.toDate().toISOString()
        : values.startDate;
      const dueDateIso = values.dueDate?.toDate?.()
        ? values.dueDate.toDate().toISOString()
        : values.dueDate;
      await createLoan({
        isExternal: true,
        externalName: values.externalName,
        externalPhone: values.externalPhone,
        externalGhanaCard: values.externalGhanaCard,
        loanAmount: Number(values.loanAmount),
        loanRate: Number(values.loanRate),
        overdueRate: Number(values.overdueRate),
        quater: values.quater,
        status: values.status,
        startDate: startDateIso,
        dueDate: dueDateIso,
      }).unwrap();
      toast.success("Non-client loan created");
      form.resetFields();
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create loan");
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={showDrawer}>
        New Non-Client Loan
      </Button>
      <Drawer
        title="New Non-Client Loan"
        width={1000}
        onClose={onClose}
        open={open}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="externalName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input placeholder="e.g. Ama Mensah" />
          </Form.Item>

          <Form.Item
            name="externalPhone"
            label="Phone Number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="e.g. 0241234567" />
          </Form.Item>

          <Form.Item
            name="externalGhanaCard"
            label="Ghana Card Number"
            rules={[
              { required: true, message: "Please enter Ghana card number" },
            ]}
          >
            <Input placeholder="e.g. GHA-XXXXXXXXX-X" />
          </Form.Item>

          <Form.Item
            name="loanAmount"
            label="Loan Amount"
            rules={[{ required: true, message: "Please enter loan amount" }]}
          >
            <Input type="number" placeholder="e.g. 5000" />
          </Form.Item>

          <Form.Item
            name="loanRate"
            label="Interest Rate (%)"
            rules={[{ required: true, message: "Please enter loan rate" }]}
          >
            <Input type="number" placeholder="e.g. 10" />
          </Form.Item>

          <Form.Item
            name="overdueRate"
            label="Overdue Daily Rate (%)"
            rules={[{ required: true, message: "Please enter overdue rate" }]}
          >
            <Input type="number" placeholder="e.g. 5" />
          </Form.Item>

          <Form.Item
            name="quater"
            label="Quarter"
            rules={[{ required: true, message: "Please select a quarter" }]}
          >
            <Select
              options={["Q1", "Q2", "Q3", "Q4"].map((q) => ({
                value: q,
                label: q,
              }))}
              placeholder="Select a quarter"
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[
              { required: true, message: "Please select start date" },
              {
                validator: (_, value) => {
                  const end = form.getFieldValue("dueDate");
                  if (!value || !end) return Promise.resolve();
                  try {
                    if (end.isAfter(value)) return Promise.resolve();
                    return Promise.reject(
                      new Error("Start date must be before due date")
                    );
                  } catch {
                    return Promise.resolve();
                  }
                },
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[
              { required: true, message: "Please select due date" },
              {
                validator: (_, value) => {
                  const start = form.getFieldValue("startDate");
                  if (!value || !start) return Promise.resolve();
                  try {
                    if (value.isAfter(start)) return Promise.resolve();
                    return Promise.reject(
                      new Error("Due date must be after start date")
                    );
                  } catch {
                    return Promise.resolve();
                  }
                },
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              placeholder="Select status"
            />
          </Form.Item>

          <Form.Item>
            <Button loading={isLoading} type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default NonClientLoanForm;
