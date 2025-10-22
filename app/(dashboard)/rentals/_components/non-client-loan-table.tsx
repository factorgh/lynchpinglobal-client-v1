"use client";

import { formatPriceGHS } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useDeleteLoanMutation, useGetLoansQuery } from "@/services/loan";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Drawer, Space, Table, Tag } from "antd";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import NonClientLoanDrawer from "./non-client-loan-drawer";

const NonClientLoanTable: React.FC = () => {
  const { data, isFetching } = useGetLoansQuery(null);
  const [deleteLoan] = useDeleteLoanMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const rows = useMemo(() => data?.data?.data?.filter((l: any) => Boolean(l?.isExternal)) || [], [data]);

  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const showDrawer = (loan: any) => {
    setSelected(loan);
    setOpen(true);
  };
  const onClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteLoan(id).unwrap();
      await createActivity({
        activity: "External Loan Deleted",
        description: `A non-client loan with id ${id} was deleted`,
        user: loggedInUser._id,
      }).unwrap();
      toast.success("Deleted successfully");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to delete");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "externalName", key: "externalName" },
    { title: "Phone", dataIndex: "externalPhone", key: "externalPhone" },
    { title: "Ghana Card", dataIndex: "externalGhanaCard", key: "externalGhanaCard" },
    {
      title: "Loan Amount",
      dataIndex: "loanAmount",
      key: "loanAmount",
      render: (v: number) => formatPriceGHS(v),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (v: number) => moment(v).format("YYYY-MM-DD"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={s === "Active" ? "green" : "default"}>{s}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <EyeOutlined className="text-emerald-500" onClick={() => showDrawer(record)} />
          <DeleteOutlined className="text-red-500" onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        loading={isFetching}
        columns={columns as any}
        dataSource={rows}
        className="border border-slate-200 rounded-md"
        rowKey="_id"
      />
      <NonClientLoanDrawer loan={selected} visible={open} onClose={onClose} />
    </>
  );
};

export default NonClientLoanTable;
