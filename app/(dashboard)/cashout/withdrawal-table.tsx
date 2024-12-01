"use client";
import { toTwoDecimalPlaces } from "@/lib/helper";
import {
  useGetWithdrawalsQuery,
  useUpdateWithdrawalMutation,
} from "@/services/withdrawals";
import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useState } from "react";
import { toast } from "react-toastify";

interface RecordType {
  key: number;
  id: string;
  amount: number;
  date: string;
  status: string;
  userName: string;
}

const WithdrawalTable = ({ onEdit }: any) => {
  const { data: withdrawals, isFetching } = useGetWithdrawalsQuery(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [updatePayment, { isLoading }] = useUpdateWithdrawalMutation();

  const showEditDrawer = (payment: any) => {
    console.log(payment);
    setIsEditMode(true);
    setEditRentalId(payment._id);

    form.setFieldsValue({
      amount: toTwoDecimalPlaces(payment.amount),

      approvedDate: moment(payment.approvedDate),
      status: payment.status,
    });

    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
    form.resetFields();
    setEditRentalId(null);
    setIsEditMode(false);
  };
  const handleFormSubmit = async (values: any) => {
    try {
      console.log(values);

      await updatePayment({
        id: editRentalId,
        data: values,
      }).unwrap();
      toast.success("Withdrawal updated successfully");
      form.resetFields();
      setIsDrawerVisible(false);
    } catch (error: any) {
      console.error("Error updated withdrawal entry:", error);
      toast.error(error?.data?.message || "An error occurred");
    }
  };
  const getStatusTag = (status: string) => {
    switch (status) {
      case "Pending":
        return <Tag color="orange">Pending</Tag>;
      case "Approved":
        return <Tag color="green">Approved</Tag>;
      case "Cancelled":
        return <Tag color="red">Cancelled</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnsType<RecordType> = [
    {
      title: "Customer",
      dataIndex: "user",
      key: "user",
      render: (values) => values.name,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Request Date",
      dataIndex: "requestedDate",
      key: "requestedDate",
      render: (value: number) => moment(value).format("YYYY-MM-DD"),
    },
    {
      title: "Approval Date",
      dataIndex: "approvedDate",
      key: "approvedDate",
      render: (value: number) => moment(value).format("YYYY-MM-DD"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined onClick={() => showEditDrawer(record)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        loading={isFetching}
        columns={columns}
        dataSource={withdrawals?.data?.data}
        rowKey="id"
      />
      <Drawer
        title="Edit Payment"
        placement="right"
        width={400}
        onClose={handleCloseDrawer}
        open={isDrawerVisible}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          hideRequiredMark
        >
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
            label="Approval Date"
            name="approvedDate"
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
              <Select.Option value="Processing">Processing</Select.Option>
              <Select.Option value="Cancelled">Cancelled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button loading={isLoading} type="primary" htmlType="submit" block>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default WithdrawalTable;
