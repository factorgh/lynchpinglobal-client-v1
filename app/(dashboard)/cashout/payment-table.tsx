"use client";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useCreateNotificationMutation } from "@/services/notifications";
import {
  useGetPaymentsQuery,
  useUpdatePaymentMutation,
} from "@/services/payments";
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

const PaymentTable = ({ onEdit }: any) => {
  const { data: payments, isFetching } = useGetPaymentsQuery(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [updatePayment, { isLoading }] = useUpdatePaymentMutation();
  const [createNotification] = useCreateNotificationMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [selectedUser, setSelectedUser] = useState<any[]>([]);

  const showEditDrawer = (payment: any) => {
    console.log(payment);
    setIsEditMode(true);
    setEditRentalId(payment._id);
    setSelectedUser(payment.user);

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
      await createActivity({
        activity: " Payment Updated",
        description: "A payment update was made successfully",
        user: loggedInUser._id,
      }).unwrap();
      // Send notifications
      await createNotification({
        title: "Payment Information",
        message: "Payment has been updated successfully",
        users: [selectedUser],
      });
      toast.success("Payment updated successfully");
      form.resetFields();
      setIsDrawerVisible(false);
    } catch (error: any) {
      console.error("Error updated payment entry:", error);
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
      render: (amount: number) => formatPriceGHS(amount),
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
        dataSource={payments?.data?.data}
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
              <Select.Option value="Rejected">Rejected</Select.Option>
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

export default PaymentTable;
