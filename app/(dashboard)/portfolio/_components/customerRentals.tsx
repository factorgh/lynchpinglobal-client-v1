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
import { useGetUserRentalsQuery } from "@/services/rental";
import { EyeOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import RentalDrawer from "../../rentals/_components/rental-drawer";

interface DataType {
  _id?: string;
  key?: string;
  assetClass: string;
  amountDue: number;
  assetDesignation: number;
  returnDate: number;
  dueDate?: number;
  overdueRate: number;
}

const CustomerRentalsOnly: React.FC = () => {
  const { data: rentals, isFetching } = useGetUserRentalsQuery(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rentalDrawerVisible, setRentalDrawerVisible] = useState(false);
  const [selectedRental, setSelectedRental] = useState<any>(null);

  const rawData: DataType[] = useMemo(
    () => rentals?.data?.data || [],
    [rentals]
  );

  const filteredData = useMemo(() => {
    return rawData.filter((item: DataType) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      const cls = (item.assetClass || "").toLowerCase();
      const des = String(item.assetDesignation || "").toLowerCase();
      return cls.includes(q) || des.includes(q);
    });
  }, [rawData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const closeRentalsDetailsDrawer = () => {
    setSelectedRental(null);
    setRentalDrawerVisible(false);
  };

  const showRentalDetailsDrawer = (asset: any) => {
    setSelectedRental(asset);
    setRentalDrawerVisible(true);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rentals by asset class or designation..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            {filteredData.length} Rentals
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
              No Rentals Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm
                ? "No rentals match your search criteria."
                : "You do not have any active rental agreements registered."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Asset Class
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Designation
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Amount Due
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Overdue Fee
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Return Date
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: any) => (
                  <TableRow
                    key={item._id}
                    className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                  >
                    {/* Asset Class */}
                    <TableCell className="py-3.5 px-4 font-medium text-slate-900 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.assetClass || "—"}
                      </span>
                    </TableCell>

                    {/* Designation */}
                    <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                      {item.assetDesignation != null
                        ? toTwoDecimalPlaces(item.assetDesignation)
                        : "—"}
                    </TableCell>

                    {/* Amount Due */}
                    <TableCell className="py-3.5 px-4 text-xs font-bold text-slate-900 text-right">
                      {formatPriceGHS(item.amountDue || 0)}
                    </TableCell>

                    {/* Overdue Fee */}
                    <TableCell className="py-3.5 px-4 text-xs text-slate-600 text-right">
                      {formatPriceGHS(item.overdueRate || 0)}
                    </TableCell>

                    {/* Return Date */}
                    <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                      {item.returnDate
                        ? moment(item.returnDate).format("MMM DD, YYYY")
                        : "—"}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showRentalDetailsDrawer(item)}
                        title="View Rental Details"
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

      <RentalDrawer
        rental={selectedRental}
        visible={rentalDrawerVisible}
        onClose={closeRentalsDetailsDrawer}
      />
    </div>
  );
};

export default CustomerRentalsOnly;
