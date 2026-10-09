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
import { useGetUserInvestmentsQuery } from "@/services/investment";
import {
  EyeOutlined,
  FolderOpenOutlined,
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
} from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { AiOutlineFilePdf } from "react-icons/ai";

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

  const showViewDrawer = (investment: DataType) => {
    setSelectedInvestment(investment);
    setDrawerVisible(true);
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedInvestment(null);
  };

  const handlePreviewOut = (previewFile: string, index: number) => {
    setDrawerVisible(false);
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

            {/* Documents Section */}
            <Card title="Mandate Documentation" bordered={false}>
              {selectedInvestment?.certificate &&
                selectedInvestment.certificate.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-xs text-slate-700 mb-1">
                      Ledger
                    </h4>
                    <Row gutter={16}>
                      {selectedInvestment.certificate.map((fileUrl, index) => (
                        <Col span={8} key={index}>
                          <AiOutlineFilePdf
                            size={36}
                            className="cursor-pointer text-red-500 hover:text-red-600 mt-2"
                            onClick={() => handlePreviewOut(fileUrl, index)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

              {selectedInvestment?.checklist &&
                selectedInvestment.checklist.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-xs text-slate-700 mb-1">
                      Checklists
                    </h4>
                    <Row gutter={16}>
                      {selectedInvestment.checklist.map((fileUrl, index) => (
                        <Col span={8} key={index}>
                          <AiOutlineFilePdf
                            size={36}
                            className="cursor-pointer text-red-500 hover:text-red-600 mt-2"
                            onClick={() => handlePreviewOut(fileUrl, index)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

              {selectedInvestment?.mandate &&
                selectedInvestment.mandate.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-xs text-slate-700 mb-1">
                      Mandates
                    </h4>
                    <Row gutter={16}>
                      {selectedInvestment.mandate.map((fileUrl, index) => (
                        <Col span={8} key={index}>
                          <AiOutlineFilePdf
                            size={36}
                            className="cursor-pointer text-red-500 hover:text-red-600 mt-2"
                            onClick={() => handlePreviewOut(fileUrl, index)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

              {selectedInvestment?.partnerForm &&
                selectedInvestment.partnerForm.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-xs text-slate-700 mb-1">
                      Partner Forms
                    </h4>
                    <Row gutter={16}>
                      {selectedInvestment.partnerForm.map((fileUrl, index) => (
                        <Col span={8} key={index}>
                          <AiOutlineFilePdf
                            size={36}
                            className="cursor-pointer text-red-500 hover:text-red-600 mt-2"
                            onClick={() => handlePreviewOut(fileUrl, index)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

              {selectedInvestment?.others &&
                selectedInvestment.others.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-xs text-slate-700 mb-1">
                      Others
                    </h4>
                    <Row gutter={16}>
                      {selectedInvestment.others.map((fileUrl, index) => (
                        <Col span={8} key={index}>
                          <AiOutlineFilePdf
                            size={36}
                            className="cursor-pointer text-red-500 hover:text-red-600 mt-2"
                            onClick={() => handlePreviewOut(fileUrl, index)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

              {!selectedInvestment?.certificate?.length &&
                !selectedInvestment?.checklist?.length &&
                !selectedInvestment?.mandate?.length &&
                !selectedInvestment?.partnerForm?.length &&
                !selectedInvestment?.others?.length && (
                  <Tag color="red">No Documents available</Tag>
                )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerInvestment;
