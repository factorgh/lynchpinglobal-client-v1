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
import { useGetUserLoanQuery } from "@/services/loan";
import { EyeOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import LoanDrawer from "../../rentals/_components/loan-drawer";

interface DataType {
  _id?: string;
  key?: string;
  loanAmount: number;
  amountDue: number;
  overdueFee: number;
  overdueDays: number;
}

const CustomerLoan: React.FC = () => {
  const { data: userLoans, isFetching } = useGetUserLoanQuery(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loanDrawerVisible, setLoanDrawerVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const rawData: DataType[] = useMemo(
    () => userLoans?.data?.data || [],
    [userLoans]
  );

  const filteredData = useMemo(() => {
    return rawData.filter((item: DataType) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      const loanStr = String(item.loanAmount || "");
      const dueStr = String(item.amountDue || "");
      return loanStr.includes(q) || dueStr.includes(q);
    });
  }, [rawData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const closeLoansDetailsDrawer = () => {
    setSelectedLoan(null);
    setLoanDrawerVisible(false);
  };

  const showLoanDetailsDrawer = (asset: any) => {
    setSelectedLoan(asset);
    setLoanDrawerVisible(true);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search loans by amount..."
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
            {filteredData.length} Loans
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
              No Loans Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm
                ? "No loans match your search."
                : "You do not have any active loans registered."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Loan Amount
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Amount Due
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Overdue Fee
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Days Overdue
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: any) => {
                  const isOverdue = (item.overdueDays || 0) > 0;
                  return (
                    <TableRow
                      key={item._id}
                      className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                    >
                      {/* Loan Amount */}
                      <TableCell className="py-3.5 px-4 font-semibold text-slate-900 text-xs">
                        {formatPriceGHS(item.loanAmount || 0)}
                      </TableCell>

                      {/* Amount Due */}
                      <TableCell className="py-3.5 px-4 text-xs font-bold text-slate-900 text-right">
                        {formatPriceGHS(item.amountDue || 0)}
                      </TableCell>

                      {/* Overdue Fee */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-600 text-right">
                        {formatPriceGHS(item.overdueFee || 0)}
                      </TableCell>

                      {/* Days Overdue */}
                      <TableCell className="py-3.5 px-4 text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {item.overdueDays === 0 || !item.overdueDays
                            ? "0 days"
                            : `${item.overdueDays} days`}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => showLoanDetailsDrawer(item)}
                          title="View Loan Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <EyeOutlined className="text-sm" />
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

      <LoanDrawer
        loan={selectedLoan}
        visible={loanDrawerVisible}
        onClose={closeLoansDetailsDrawer}
      />
    </div>
  );
};

export default CustomerLoan;
