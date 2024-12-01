"use client";
import { EditOutlined } from "@ant-design/icons";
import { Space, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";

interface RecordType {
  key: number;
  id: string;
  amount: number;
  date: string;
  status: string;
  userName: string;
}

const PaymentTable = ({ dataSource, onEdit }: any) => {
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
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Request Date",
      dataIndex: "requestDate",
      key: "requestDate",
    },
    {
      title: "Approval Date",
      dataIndex: "approvalDate",
      key: "approvalDate",
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
          <EditOutlined onClick={() => onEdit(record)} />
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={dataSource} rowKey="id" />;
};

export default PaymentTable;
