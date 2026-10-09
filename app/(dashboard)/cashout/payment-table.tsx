"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useCreateNotificationMutation } from "@/services/notifications";
import {
  useGetPaymentsQuery,
  useUpdatePaymentMutation,
} from "@/services/payments";
import {
  EditOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Skeleton,
} from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

const PaymentTable: React.FC<any> = () => {
  const { data: payments, isFetching } = useGetPaymentsQuery(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [updatePayment, { isLoading }] = useUpdatePaymentMutation();
  const [createNotification] = useCreateNotificationMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(
    typeof window !== "undefined" ? localStorage.getItem("user") || "{}" : "{}"
  );
  const [selectedUser, setSelectedUser] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rawData: any[] = useMemo(
    () => payments?.data?.data || [],
    [payments]
  );

  const filteredData = useMemo(() => {
    return rawData.filter((item: any) => {
      const q = searchTerm.toLowerCase().trim();
      const userName =
        typeof item.user === "object" && item.user
          ? (item.user.name || item.user.displayName || "").toLowerCase()
          : (item.user || "").toLowerCase();
      const id = (item._id || "").toLowerCase();

      const matchSearch = !q || userName.includes(q) || id.includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (item?.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [rawData, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const showEditDrawer = (payment: any) => {
    setEditRentalId(payment._id);
    setSelectedUser(payment.user);

    form.setFieldsValue({
      amount: toTwoDecimalPlaces(payment.amount),
      approvedDate: payment.approvedDate ? moment(payment.approvedDate) : undefined,
      status: payment.status,
    });

    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
    form.resetFields();
    setEditRentalId(null);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      await updatePayment({
        id: editRentalId,
        data: values,
      }).unwrap();

      if (loggedInUser._id) {
        await createActivity({
          activity: "Payment Updated",
          description: "A payment update was made successfully",
          user: loggedInUser._id,
        }).unwrap();
      }

      await createNotification({
        title: "Payment Information",
        message: "Payment has been updated successfully",
        users: [selectedUser],
      });

      toast.success("Payment updated successfully");
      form.resetFields();
      setIsDrawerVisible(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "An error occurred");
    }
  };

  const getUserName = (user: any) => {
    if (typeof user === "object" && user) {
      return user.name || user.displayName || "N/A";
    }
    return user || "N/A";
  };

  const getInitials = (name: string) => {
    if (!name || name === "N/A") return "PM";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
    if (s === "approved") {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (s === "pending") {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (s === "cancelled" || s === "rejected") {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}
      >
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search payments by customer or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            {filteredData.length} Total
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {isFetching ? (
          <div className="p-8">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <FolderOpenOutlined className="text-2xl text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              No Payments Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm || statusFilter !== "all"
                ? "No payment records match your search criteria."
                : "There are currently no payment transactions registered."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Customer
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Payment ID
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Amount (GHS)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Request Date
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Approval Date
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: any) => {
                  const customerName = getUserName(item.user);
                  return (
                    <TableRow
                      key={item._id || item.id}
                      className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                    >
                      {/* Customer */}
                      <TableCell className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center shrink-0">
                            {getInitials(customerName)}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">
                              {customerName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Payment Recipient
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* ID */}
                      <TableCell className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {item._id ? `${item._id.slice(0, 8)}...` : "—"}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3.5 px-4 text-xs font-bold text-slate-900 text-right">
                        {formatPriceGHS(item.amount || 0)}
                      </TableCell>

                      {/* Request Date */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                        {item.requestedDate
                          ? moment(item.requestedDate).format("MMM DD, YYYY")
                          : "—"}
                      </TableCell>

                      {/* Approval Date */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                        {item.approvedDate
                          ? moment(item.approvedDate).format("MMM DD, YYYY")
                          : "—"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 px-4 text-xs">
                        {renderStatusBadge(item.status)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => showEditDrawer(item)}
                          title="Edit Payment"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <EditOutlined className="text-sm" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer / Pagination */}
        {!isFetching && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(
                    (currentPage - 1) * pageSize + 1,
                    filteredData.length
                  )}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(currentPage * pageSize, filteredData.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {filteredData.length}
                </span>{" "}
                records
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 text-xs font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
            label="Amount (GHS)"
            name="amount"
            rules={[
              {
                required: true,
                message: "Please input the payment amount!",
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
                message: "Please select the payment approval date!",
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
                message: "Please select the payment status!",
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
            <Button
              loading={isLoading}
              type="primary"
              htmlType="submit"
              block
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default PaymentTable;
