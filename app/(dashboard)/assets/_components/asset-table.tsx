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
  useDeleteAssetsMutation,
  useGetAllAssetssQuery,
  useUpdateAssetsMutation,
} from "@/services/assets";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
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
import AssetsDrawer from "./assets-drawer";

const AssetTransactionTable: React.FC = () => {
  const { data: assetsData, isFetching: investmentLoading } =
    useGetAllAssetssQuery<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [assetsDetailsDrawerVisible, setAssetDetailsDrawerVisible] =
    useState(false);

  const [form] = Form.useForm();
  const [createActivity] = useCreateActivityLogMutation();
  const [updateAssets] = useUpdateAssetsMutation();
  const [deleteAsset] = useDeleteAssetsMutation();

  const loggedInUser = useMemo(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const rawList: any[] = useMemo(() => {
    return assetsData?.data?.data || assetsData?.data || [];
  }, [assetsData]);

  // Filtered and paginated data
  const filteredData = useMemo(() => {
    return rawList.filter((item: any) => {
      const customerName = (
        item.user?.displayName ||
        item.user?.name ||
        item.user?.email ||
        ""
      ).toLowerCase();
      const assetClass = (item.assetClass || "").toLowerCase();
      const designation = (item.assetDesignation || "").toLowerCase();
      const quarter = (item.quater || item.quarter || "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        customerName.includes(search) ||
        assetClass.includes(search) ||
        designation.includes(search) ||
        quarter.includes(search);

      const matchesQuarter =
        quarterFilter === "all" ||
        (item.quater || item.quarter || "").toUpperCase() ===
          quarterFilter.toUpperCase();

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "joint" && Boolean(item.isJoint)) ||
        (typeFilter === "single" && !item.isJoint);

      return matchesSearch && matchesQuarter && matchesType;
    });
  }, [rawList, searchTerm, quarterFilter, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Drawer handlers
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
      accruedInterest: investment.accruedInterest,
      maturityDate: investment.maturityDate ? moment(investment.maturityDate) : null,
      managementFee: investment.managementFee,
      timeCourse: investment.timeCourse,
      quater: investment.quater || investment.quarter,
      deduction: investment.deduction,
    });

    setIsDrawerVisible(true);
  };

  const showAssetsDetailsDrawer = (asset: any) => {
    setSelectedAsset(asset);
    setAssetDetailsDrawerVisible(true);
  };

  const closeAssetsDetailsDrawer = () => {
    setSelectedAsset(null);
    setAssetDetailsDrawerVisible(false);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        managementFee: toTwoDecimalPlaces(values.managementFee),
        assetDesignation: toTwoDecimalPlaces(values.assetDesignation),
        accruedInterest: toTwoDecimalPlaces(values.accruedInterest),
        maturityDate: values.maturityDate?.toISOString(),
        timeCourse: values.timeCourse,
        quater: values.quater,
      };

      if (isEditMode) {
        await updateAssets({
          id: editRentalId,
          data: formattedValues,
        }).unwrap();
        toast.success("Asset transaction updated successfully");
        if (loggedInUser._id) {
          await createActivity({
            activity: "Asset Transaction Updated",
            description: "An asset transaction entry was updated successfully",
            user: loggedInUser._id,
          }).unwrap();
        }
      }

      setIsDrawerVisible(false);
      form.resetFields();
    } catch (error: any) {
      toast.error("Failed to update asset: " + (error?.data?.message || error?.message || "Unknown error"));
    }
  };

  const handleDelete = async (id: any) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this asset transaction entry?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await deleteAsset(id).unwrap();
        if (loggedInUser._id) {
          await createActivity({
            activity: "Asset Transaction Deleted",
            description: "An asset transaction entry was deleted successfully",
            user: loggedInUser._id,
          }).unwrap();
        }
        toast.success("Entry deleted successfully");
      }
    } catch (error: any) {
      toast.error("Failed to delete entry: " + error?.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quarter Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FilterOutlined className="text-slate-400 text-xs" />
            <select
              value={quarterFilter}
              onChange={(e) => {
                setQuarterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Quarters</option>
              <option value="Q1">Quarter 1 (Q1)</option>
              <option value="Q2">Quarter 2 (Q2)</option>
              <option value="Q3">Quarter 3 (Q3)</option>
              <option value="Q4">Quarter 4 (Q4)</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="single">Single Owner</option>
            <option value="joint">Joint Ownership</option>
          </select>

          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            {filteredData.length} Total
          </span>
        </div>
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
                  Type
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Owners
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Asset Class
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Designation
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Accrued Disbursements
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Service Fee
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-center">
                  Quarter
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Maturity Date
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
                    record.user?.displayName ||
                    record.user?.name ||
                    record.user?.email ||
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
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
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

                      {/* Type */}
                      <TableCell className="py-3.5">
                        {record.isJoint ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Joint
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Single
                          </span>
                        )}
                      </TableCell>

                      {/* Owners */}
                      <TableCell className="py-3.5">
                        {Array.isArray(record.owners) && record.owners.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {record.owners.map((o: any, oIdx: number) => (
                              <span
                                key={oIdx}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100"
                              >
                                {o?.user?.displayName ||
                                  o?.user?.name ||
                                  o?.user?.email ||
                                  `Owner ${oIdx + 1}`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
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

                      {/* Accrued Disbursements */}
                      <TableCell className="py-3.5 text-right font-bold text-emerald-700 text-xs">
                        +{formatPriceGHS(record.accruedInterest || 0)}
                      </TableCell>

                      {/* Service Fee */}
                      <TableCell className="py-3.5 text-right font-medium text-slate-700 text-xs">
                        {formatPriceGHS(record.managementFee || 0)}
                      </TableCell>

                      {/* Quarter */}
                      <TableCell className="py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {record.quater || record.quarter || "Q4"}
                        </span>
                      </TableCell>

                      {/* Maturity Date */}
                      <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                        {record.maturityDate
                          ? moment(record.maturityDate).format("YYYY-MM-DD")
                          : "—"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="View Asset Details"
                            onClick={() => showAssetsDetailsDrawer(record)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <EyeOutlined className="text-sm" />
                          </button>
                          <button
                            title="Edit Asset"
                            onClick={() => showEditDrawer(record)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <EditOutlined className="text-sm" />
                          </button>
                          <button
                            title="Delete Asset"
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
                    colSpan={10}
                    className="py-14 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                        <FolderOpenOutlined className="text-2xl text-slate-400" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        No Asset Transactions Found
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs">
                        There are no asset transactions registered matching your current filters.
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
        title="Edit Asset Transaction"
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
                <Input placeholder="Enter Asset Class" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assetDesignation"
                label="Asset Designation"
                rules={[
                  { required: true, message: "Please enter asset designation" },
                ]}
              >
                <Input placeholder="Enter Asset Designation" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="accruedInterest"
                label="Accrued Disbursements"
                rules={[
                  {
                    required: true,
                    message: "Please enter accrued disbursements",
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Accrued Disbursements"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maturityDate"
                label="Maturity Date"
                rules={[
                  { required: true, message: "Please select maturity date" },
                ]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="managementFee"
                label="Service Fee"
                rules={[{ required: true, message: "Please enter service fee" }]}
              >
                <InputNumber className="w-full" placeholder="Service Fee" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeCourse"
                label="Time Course"
                rules={[{ required: true, message: "Please enter time course" }]}
              >
                <Input placeholder="e.g. 1 Year" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quater"
                label="Quarter"
                rules={[{ required: true, message: "Please select quarter" }]}
              >
                <Select placeholder="Select Quarter">
                  <Select.Option value="Q1">Q1</Select.Option>
                  <Select.Option value="Q2">Q2</Select.Option>
                  <Select.Option value="Q3">Q3</Select.Option>
                  <Select.Option value="Q4">Q4</Select.Option>
                </Select>
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

      {/* Asset Details Drawer */}
      <AssetsDrawer
        asset={selectedAsset}
        visible={assetsDetailsDrawerVisible}
        onClose={closeAssetsDetailsDrawer}
      />
    </div>
  );
};

export default AssetTransactionTable;
