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
import {
  useGetUserInvestmentsQuery,
  useUpdateInvestmentMutation,
} from "@/services/investment";
import {
  EyeOutlined,
  FolderOpenOutlined,
  UploadOutlined,
  DeleteOutlined,
  ExportOutlined,
  LoadingOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Descriptions,
  Drawer,
  Row,
  Skeleton,
  Table as AntdTable,
  Tag,
  Button,
} from "antd";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  ShieldCheck,
} from "lucide-react";
import moment from "moment";
import React, { useMemo, useState, useRef } from "react";
import { AiOutlineFilePdf } from "react-icons/ai";
import { toast } from "react-toastify";

interface AddOn {
  id: string;
  name: string;
  value: number;
}

interface DataType {
  key?: string;
  _id?: string;
  name: string;
  principal: number;
  guaranteedRate: number;
  addOns: AddOn[];
  oneOffs: any[];
  principalAccruedReturn: number;
  addOnAccruedReturn: number;
  oneOffAccruedReturn: number;
  totalAccruedReturn: number;
  quarterEndDate: string;
  quarter: string;
  archived: boolean;
  active: boolean;
  managementFee: number;
  performanceYield: number;
  certificate: string[];
  checklist: string[];
  mandate: string[];
  partnerForm: string[];
  others: string[];
  lastModified: string;
  isJoint?: boolean;
  owners?: {
    user?: {
      _id: string;
      name?: string;
      displayName?: string;
      email?: string;
    };
  }[];
}

const CustomerInvestment: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<DataType | null>(
    null
  );

  const { data: investments, isFetching } = useGetUserInvestmentsQuery(null);

  const rawData: DataType[] = useMemo(
    () => investments?.data || [],
    [investments]
  );

  const filteredData = useMemo(() => {
    return rawData.filter((item: DataType) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.owners &&
          item.owners.some((o) => {
            const uName = o.user?.displayName || o.user?.name || o.user?.email || "";
            return uName.toLowerCase().includes(q);
          }));

      const matchQuarter =
        quarterFilter === "all" ||
        (item.quarter && item.quarter.toLowerCase() === quarterFilter.toLowerCase());

      return matchSearch && matchQuarter;
    });
  }, [rawData, searchTerm, quarterFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const [updateInvestment, { isLoading: isUpdatingInvestment }] =
    useUpdateInvestmentMutation();
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClientFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedInvestment?._id) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size cannot exceed 15MB");
      return;
    }

    try {
      setIsUploadingDoc(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const formData = new FormData();
      formData.append("files", file);
      formData.append("category", "mandates/client-docs");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed");
      }

      const data = await res.json();
      const uploadedUrl =
        data?.uploads?.[0]?.url ||
        data?.urls?.[0]?.secure_url ||
        data?.urls?.[0]?.url;

      if (!uploadedUrl) {
        throw new Error("No URL returned from storage service");
      }

      const updatedOthers = [
        ...(selectedInvestment.others || []),
        uploadedUrl,
      ];

      await updateInvestment({
        id: selectedInvestment._id,
        data: { others: updatedOthers },
      }).unwrap();

      setSelectedInvestment((prev) =>
        prev ? { ...prev, others: updatedOthers } : null
      );
      toast.success("Document attached to mandate successfully");
    } catch (err: any) {
      console.error("[ClientDocUpload] Error:", err);
      toast.error(
        err?.data?.message || err?.message || "Failed to upload document"
      );
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteClientDoc = async (urlToDelete: string) => {
    if (!selectedInvestment?._id) return;
    try {
      const updatedOthers = (selectedInvestment.others || []).filter(
        (u) => u !== urlToDelete
      );
      await updateInvestment({
        id: selectedInvestment._id,
        data: { others: updatedOthers },
      }).unwrap();

      setSelectedInvestment((prev) =>
        prev ? { ...prev, others: updatedOthers } : null
      );
      toast.success("Document removed successfully");
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to remove document"
      );
    }
  };

  const showViewDrawer = (investment: DataType) => {
    setSelectedInvestment(investment);
    setDrawerVisible(true);
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedInvestment(null);
  };

  const handlePreviewOut = (previewFile: string, index?: number) => {
    window.open(previewFile, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search mandates by name or owner..."
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

          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            {filteredData.length} Total
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        data-tour="positions-table"
        className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
      >
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
              No Mandates Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm || quarterFilter !== "all"
                ? "No mandate records match your search criteria."
                : "You do not have any mandates registered yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Mandate Name
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Type
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Contribution (GHS)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Terms (%)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Yield (GHS)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Quarter
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Total Return (GHS)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: DataType) => (
                  <TableRow
                    key={item._id || item.key}
                    className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                  >
                    {/* Mandate Name */}
                    <TableCell className="py-3.5 px-4 font-medium text-slate-900 text-xs">
                      <span className="font-semibold text-slate-900 block">
                        {item.name || "Unnamed Mandate"}
                      </span>
                      {item.quarterEndDate && (
                        <span className="text-[11px] text-slate-400">
                          Ends: {moment(item.quarterEndDate).format("DD MMM YYYY")}
                        </span>
                      )}
                    </TableCell>

                    {/* Type / Ownership */}
                    <TableCell className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          item.isJoint
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {item.isJoint ? "Joint" : "Single"}
                      </span>
                    </TableCell>

                    {/* Contribution */}
                    <TableCell className="py-3.5 px-4 text-xs font-semibold text-slate-900 text-right">
                      {formatPriceGHS(item.principal || 0)}
                    </TableCell>

                    {/* Terms */}
                    <TableCell className="py-3.5 px-4 text-xs text-slate-700 text-right font-mono">
                      {toTwoDecimalPlaces(item.guaranteedRate || 0)}%
                    </TableCell>

                    {/* Yield */}
                    <TableCell className="py-3.5 px-4 text-xs text-slate-700 text-right">
                      {formatPriceGHS(item.performanceYield || 0)}
                    </TableCell>

                    {/* Quarter */}
                    <TableCell className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.quarter || "—"}
                      </span>
                    </TableCell>

                    {/* Total Accrued Return */}
                    <TableCell className="py-3.5 px-4 text-xs font-bold text-emerald-700 text-right">
                      {formatPriceGHS(item.totalAccruedReturn || 0)}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showViewDrawer(item)}
                        title="View Mandate Details"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <EyeOutlined className="text-sm" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Drawer for displaying detailed information */}
      <Drawer
        title="Mandate Details"
        open={drawerVisible}
        onClose={onCloseDrawer}
        width={600}
      >
        {selectedInvestment && (
          <div className="space-y-4">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Admin">
                {selectedInvestment.name}
              </Descriptions.Item>
              <Descriptions.Item label="Ownership">
                {selectedInvestment.isJoint ? (
                  <Tag color="purple">Joint</Tag>
                ) : (
                  <Tag>Single</Tag>
                )}
              </Descriptions.Item>
              {selectedInvestment?.owners &&
                selectedInvestment.owners.length > 0 && (
                  <Descriptions.Item label="Co-Owners">
                    <div className="space-y-1">
                      {selectedInvestment.owners.map((o, idx) => (
                        <div key={idx} className="text-sm">
                          {o?.user?.displayName ||
                            o?.user?.name ||
                            o?.user?.email ||
                            o?.user?._id}
                        </div>
                      ))}
                    </div>
                  </Descriptions.Item>
                )}
              <Descriptions.Item label="Mandate Contribution (GHS)">
                {formatPriceGHS(selectedInvestment.principal)}
              </Descriptions.Item>
              <Descriptions.Item label="Contractual Terms (%)">
                {toTwoDecimalPlaces(selectedInvestment.guaranteedRate)}%
              </Descriptions.Item>
              <Descriptions.Item label="Performance-Linked Disbursement (GHS)">
                {formatPriceGHS(selectedInvestment.performanceYield)}
              </Descriptions.Item>
              <Descriptions.Item label="Service Fee (GHS)">
                {formatPriceGHS(selectedInvestment.managementFee)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Disbursements (GHS)">
                {formatPriceGHS(selectedInvestment.totalAccruedReturn)}
              </Descriptions.Item>
            </Descriptions>

            {/* Add-ons */}
            <Card title="Additional Contributions" bordered={false}>
              {selectedInvestment?.addOns && selectedInvestment.addOns.length > 0 ? (
                <AntdTable
                  rowKey="id"
                  columns={[{ title: "Name", dataIndex: "name", key: "name" }]}
                  dataSource={selectedInvestment.addOns}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Tag color="orange">No additional contributions added</Tag>
              )}
            </Card>

            <Card title="One-Off Disbursements" bordered={false}>
              {selectedInvestment?.oneOffs && selectedInvestment.oneOffs.length > 0 ? (
                <AntdTable
                  rowKey="id"
                  columns={[
                    { title: "One-Off", dataIndex: "name", key: "name" },
                  ]}
                  dataSource={selectedInvestment.oneOffs}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Tag color="orange">No One-Off Disbursements added</Tag>
              )}
            </Card>

            {/* Mandate Documentation Section: Client-Facing Only */}
            <Card
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PaperClipOutlined className="text-base text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800">
                      Mandate Documents & Client Uploads
                    </span>
                  </div>
                  <Tag color="emerald" className="text-[11px] font-semibold">
                    Verified Client Vault
                  </Tag>
                </div>
              }
              bordered={false}
              className="shadow-xs rounded-xl"
            >
              {/* Client Upload Widget */}
              <div className="mb-5 p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <UploadOutlined className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 leading-tight">
                      Upload Supporting Document
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload signed agreements, payment receipts, or KYC verification files (PDF, PNG, JPG, up to 15MB)
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleClientFileUpload}
                    className="hidden"
                    id="client-doc-upload-input"
                  />
                  <Button
                    type="primary"
                    onClick={() => fileInputRef.current?.click()}
                    loading={isUploadingDoc}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isUploadingDoc ? (
                      <>
                        <LoadingOutlined className="text-xs" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadOutlined className="w-3.5 h-3.5" />
                        <span>Attach Document</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 1. Mandate Contract (Client-Facing) */}
              {selectedInvestment?.mandate &&
                selectedInvestment.mandate.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Mandate Agreements ({selectedInvestment.mandate.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedInvestment.mandate.map((fileUrl, index) => {
                        const fileName =
                          fileUrl.split("/").pop()?.split("?")[0] ||
                          `Mandate-Agreement-${index + 1}.pdf`;
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AiOutlineFilePdf className="text-2xl text-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Official Mandate Contract
                                </span>
                              </div>
                            </div>
                            <Button
                              size="small"
                              type="text"
                              onClick={() => handlePreviewOut(fileUrl)}
                              icon={<ExportOutlined className="text-xs text-blue-600" />}
                              className="shrink-0 hover:bg-blue-50"
                              title="View Document"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 2. Certificate & Ledger (Client-Facing) */}
              {selectedInvestment?.certificate &&
                selectedInvestment.certificate.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Ledger & Certificates ({selectedInvestment.certificate.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedInvestment.certificate.map((fileUrl, index) => {
                        const fileName =
                          fileUrl.split("/").pop()?.split("?")[0] ||
                          `Certificate-${index + 1}.pdf`;
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AiOutlineFilePdf className="text-2xl text-emerald-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Certificate of Allocation
                                </span>
                              </div>
                            </div>
                            <Button
                              size="small"
                              type="text"
                              onClick={() => handlePreviewOut(fileUrl)}
                              icon={<ExportOutlined className="text-xs text-emerald-600" />}
                              className="shrink-0 hover:bg-emerald-50"
                              title="View Document"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 3. Client & Supporting Documents (Client Uploads / Others) */}
              {selectedInvestment?.others &&
                selectedInvestment.others.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Client & Supporting Documents ({selectedInvestment.others.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedInvestment.others.map((fileUrl, index) => {
                        const fileName =
                          fileUrl.split("/").pop()?.split("?")[0] ||
                          `Document-${index + 1}`;
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Attached Supporting File
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="small"
                                type="text"
                                onClick={() => handlePreviewOut(fileUrl)}
                                icon={<ExportOutlined className="text-xs text-purple-600" />}
                                className="hover:bg-purple-50"
                                title="View Document"
                              />
                              <Button
                                size="small"
                                type="text"
                                danger
                                onClick={() => handleDeleteClientDoc(fileUrl)}
                                icon={<DeleteOutlined className="text-xs" />}
                                className="hover:bg-rose-50"
                                title="Remove File"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Empty State */}
              {!selectedInvestment?.certificate?.length &&
                !selectedInvestment?.mandate?.length &&
                !selectedInvestment?.others?.length && (
                  <div className="text-center py-6 border border-slate-100 rounded-xl bg-slate-50/50">
                    <PaperClipOutlined className="text-3xl text-slate-300 mx-auto mb-2 block" />
                    <p className="text-xs font-semibold text-slate-600">
                      No client documents attached yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Use the "Attach Document" button above to upload signed mandates or receipts
                    </p>
                  </div>
                )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerInvestment;
