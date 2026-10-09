"use client";

import React, { useMemo, useState } from "react";
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
import {
  useDeleteRentalMutation,
  useGetRentalsQuery,
  useUpdateRentalMutation,
} from "@/services/rental";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
} from "antd";
import moment from "moment";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import RentalDrawer from "./rental-drawer";

const RentalTable: React.FC = () => {
  const { data: investmentData, isFetching: investmentLoading } =
    useGetRentalsQuery<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rentalDrawerVisible, setRentalDrawerVisible] = useState(false);

  const [form] = Form.useForm();
  const [createActivity] = useCreateActivityLogMutation();
  const [updateRental] = useUpdateRentalMutation();
  const [deleteRental] = useDeleteRentalMutation();

  const loggedInUser = useMemo(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const rawList: any[] = useMemo(() => {
    return investmentData?.data?.data || investmentData?.data || [];
  }, [investmentData]);

  const filteredData = useMemo(() => {
    return rawList.filter((item: any) => {
      const customerName = (item.user?.name || item.user?.displayName || "").toLowerCase();
      const assetClass = (item.assetClass || "").toLowerCase();
      const designation = (item.assetDesignation || "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      return (
        !search ||
        customerName.includes(search) ||
        assetClass.includes(search) ||
        designation.includes(search)
      );
    });
  }, [rawList, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
    form.resetFields();
    setEditRentalId(null);
    setIsEditMode(false);
  };

  const showEditDrawer = (investment: any) => {
    if (!investment) return;
    setIsEditMode(true);
    setEditRentalId(investment._id);

    form.setFieldsValue({
      assetClass: investment.assetClass,
      assetDesignation: investment.assetDesignation,
      overdueRate: toTwoDecimalPlaces(investment.overdueFee),
      returnDate: investment.returnDate ? moment(investment.returnDate) : null,
      overdueDate: investment.overdueDate ? moment(investment.overdueDate) : null,
      quater: investment.quater,
      amountDue: toTwoDecimalPlaces(investment.amountDue),
      status: investment.status,
    });

    setIsDrawerVisible(true);
  };

  const showRentalDetailsDrawer = (asset: any) => {
    setSelectedRental(asset);
    setRentalDrawerVisible(true);
  };

  const closeRentalsDetailsDrawer = () => {
    setSelectedRental(null);
    setRentalDrawerVisible(false);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        managementFee: toTwoDecimalPlaces(values.managementFee),
        performanceYield: toTwoDecimalPlaces(values.performanceYield),
        principal: toTwoDecimalPlaces(values.principal),
      };

      if (isEditMode) {
        await updateRental({
          id: editRentalId,
          data: formattedValues,
        }).unwrap();
        if (loggedInUser._id) {
          await createActivity({
            activity: "Rental Updated",
            description: "A rental entry was updated successfully",
            user: loggedInUser._id,
          }).unwrap();
        }
        toast.success("Asset Rental updated successfully");
      }

      setIsDrawerVisible(false);
      form.resetFields();
    } catch (error: any) {
      toast.error("Failed to save rental: " + (error?.data?.message || error?.message || "Unknown error"));
    }
  };

  const handleDelete = async (id: any) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this rental entry?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await deleteRental(id).unwrap();
        if (loggedInUser._id) {
          await createActivity({
            activity: "Rental Deleted",
            description: "A rental entry was deleted successfully",
            user: loggedInUser._id,
          }).unwrap();
        }
        toast.success("Rental deleted successfully");
      }
    } catch (error: any) {
      toast.error("Failed to delete rental: " + error?.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, asset class, designation..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md self-start sm:self-auto">
          {filteredData.length} Total Rentals
        </span>
      </div>

      {/* Main Table Container using shadcn Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {investmentLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton active paragraph={{ rows: 7 }} />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Customer
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Asset Class
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Asset Designation
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Amount Due
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Due Date
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record: any, idx: number) => {
                  const customerName =
                    record.user?.name ||
                    record.user?.displayName ||
                    "Unknown Customer";
                  const customerInitial = customerName.charAt(0).toUpperCase();

                  return (
                    <TableRow
                      key={record._id || idx}
                      className="hover:bg-slate-50/60 transition-colors border-b border-slate-100"
                    >
                      {/* Customer */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {customerInitial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs leading-none">
                              {customerName}
                            </p>
                            {record.user?.email && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {record.user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Asset Class */}
                      <TableCell className="py-3.5">
                        <span className="font-medium text-slate-800 text-xs">
                          {record.assetClass || "—"}
                        </span>
                      </TableCell>

                      {/* Asset Designation */}
                      <TableCell className="py-3.5">
                        <span className="text-slate-600 text-xs font-mono">
                          {record.assetDesignation || "—"}
                        </span>
                      </TableCell>

                      {/* Amount Due */}
                      <TableCell className="py-3.5 text-right font-bold text-slate-900 text-xs">
                        {formatPriceGHS(record.amountDue || 0)}
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                        {record.dueDate
                          ? moment(record.dueDate).format("YYYY-MM-DD")
                          : "—"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="View Rental Details"
                            onClick={() => showRentalDetailsDrawer(record)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <EyeOutlined className="text-sm" />
                          </button>
                          <button
                            title="Edit Rental"
                            onClick={() => showEditDrawer(record)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <EditOutlined className="text-sm" />
                          </button>
                          <button
                            title="Delete Rental"
                            onClick={() => handleDelete(record._id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <DeleteOutlined className="text-sm" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-14 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                        <FolderOpenOutlined className="text-2xl text-slate-400" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        No Rental Transactions Found
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs">
                        There are no rental transactions registered yet.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Drawer */}
      <Drawer
        title="Edit Rental Details"
        placement="right"
        width="50%"
        onClose={handleCloseDrawer}
        open={isDrawerVisible}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          hideRequiredMark
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assetClass"
                label="Asset Class"
                rules={[{ required: true, message: "Please enter asset class" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assetDesignation"
                label="Asset Designation"
                rules={[{ required: true, message: "Please enter asset designation" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amountDue"
                label="Amount Due"
                rules={[{ required: true, message: "Please enter amount due" }]}
              >
                <InputNumber className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: "Please select due date" }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Rental Details Drawer */}
      <RentalDrawer
        rental={selectedRental}
        visible={rentalDrawerVisible}
        onClose={closeRentalsDetailsDrawer}
      />
    </div>
  );
};

export default RentalTable;
