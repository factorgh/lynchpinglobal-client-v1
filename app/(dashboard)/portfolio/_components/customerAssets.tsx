"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceGHS } from "@/lib/helper";
import { useGetUserAssetsQuery } from "@/services/assets";
import { EyeOutlined, FolderOpenOutlined } from "@ant-design/icons";
import {
  Card,
  Col,
  Descriptions,
  Drawer,
  Image,
  Row,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import moment from "moment";
import React, { useMemo, useState } from "react";

const { Text, Title } = Typography;

interface DataType {
  key?: string;
  assetClass: string;
  assetDesignation: number;
  accruedInterest: number;
  assetImage: string | null;
  assetName: string;
  certificate: string[];
  checklist: any[];
  createdAt: string;
  managementFee: number;
  maturityDate: string;
  quater: string;
  timeCourse: string;
  mandate: string[];
  others: string[];
  partnerForm: string[];
  assetValue: number;
  active: boolean;
  updatedAt: string;
  user: string;
  __v: number;
  _id: string;
}

const CustomerAssets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);

  const { data: assets, isFetching } = useGetUserAssetsQuery(null);

  const rawData: DataType[] = useMemo(
    () => assets?.data?.data || [],
    [assets]
  );

  const filteredData = useMemo(() => {
    return rawData.filter((item: DataType) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.assetName && item.assetName.toLowerCase().includes(q)) ||
        (item.assetClass && item.assetClass.toLowerCase().includes(q)) ||
        String(item.assetDesignation || "").toLowerCase().includes(q);

      const matchQuarter =
        quarterFilter === "all" ||
        (item.quater && item.quater.toLowerCase() === quarterFilter.toLowerCase());

      return matchSearch && matchQuarter;
    });
  }, [rawData, searchTerm, quarterFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const showViewDrawer = (record: DataType) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset name, class, designation..."
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
              No Assets Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm || quarterFilter !== "all"
                ? "No assets match your search criteria."
                : "There are currently no assets registered in your portfolio."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Asset Name
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Class
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Designation
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Accrued Interest (GHS)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Service Fee (GHS)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Quarter
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Maturity Date
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: DataType) => (
                  <TableRow
                    key={item._id}
                    className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                  >
                    <TableCell className="py-3.5 px-4 font-medium text-slate-900 text-xs">
                      {item.assetName || "—"}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.assetClass || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                      {item.assetDesignation ?? "—"}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-xs font-semibold text-slate-900 text-right">
                      {formatPriceGHS(item.accruedInterest || 0)}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-xs text-slate-700 text-right">
                      {formatPriceGHS(item.managementFee || 0)}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.quater || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                      {item.maturityDate
                        ? moment(item.maturityDate).format("DD MMM YYYY")
                        : "—"}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showViewDrawer(item)}
                        title="View Asset Details"
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
                  {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}
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

      {/* Drawer Component */}
      <Drawer
        title="Asset Details"
        width={500}
        onClose={closeDrawer}
        open={drawerVisible}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={1} style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Asset Name">
                {selectedRecord.assetName}
              </Descriptions.Item>
              <Descriptions.Item label="Asset Class">
                {selectedRecord.assetClass}
              </Descriptions.Item>
              <Descriptions.Item label="Asset Designation">
                {selectedRecord.assetDesignation}
              </Descriptions.Item>
              <Descriptions.Item label="Accrued Interest (GHS)">
                {formatPriceGHS(selectedRecord.accruedInterest)}
              </Descriptions.Item>
              <Descriptions.Item label="Service Fee (GHS)">
                {formatPriceGHS(selectedRecord.managementFee)}
              </Descriptions.Item>
              <Descriptions.Item label="Quarter">
                {selectedRecord.quater}
              </Descriptions.Item>
              <Descriptions.Item label="Maturity Date">
                {moment(selectedRecord.maturityDate).format("DD MMM YYYY")}
              </Descriptions.Item>
            </Descriptions>

            {selectedRecord.assetImage && (
              <div className="mb-4">
                <strong>Asset Image:</strong>
                <Image
                  src={selectedRecord.assetImage}
                  alt="Asset Image"
                  width={200}
                />
              </div>
            )}

            <Card title="Assets Documents" bordered={false}>
              {selectedRecord.certificate?.length > 0 && (
                <div>
                  <Title level={4}>Ledger</Title>
                  <Row gutter={16}>
                    {selectedRecord.certificate.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Ledger ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {selectedRecord.checklist?.length > 0 && (
                <div>
                  <Title level={4}>Checklists</Title>
                  <Row gutter={16}>
                    {selectedRecord.checklist.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Checklist ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {selectedRecord.mandate?.length > 0 && (
                <div>
                  <Title level={4}>Mandates</Title>
                  <Row gutter={16}>
                    {selectedRecord.mandate.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Mandate ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {selectedRecord.partnerForm?.length > 0 && (
                <div>
                  <Title level={4}>Partner Forms</Title>
                  <Row gutter={16}>
                    {selectedRecord.partnerForm.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Partner Form ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {!selectedRecord.certificate?.length &&
                !selectedRecord.checklist?.length &&
                !selectedRecord.mandate?.length &&
                !selectedRecord.partnerForm?.length && (
                  <Tag color="red">No Documents available</Tag>
                )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerAssets;
