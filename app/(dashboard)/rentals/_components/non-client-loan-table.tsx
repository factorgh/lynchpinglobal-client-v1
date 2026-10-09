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
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useDeleteLoanMutation, useGetLoansQuery } from "@/services/loan";
import {
  DeleteOutlined,
  EyeOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { Skeleton } from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import NonClientLoanDrawer from "./non-client-loan-drawer";

const NonClientLoanTable: React.FC = () => {
  const { data, isFetching } = useGetLoansQuery(null);
  const [deleteLoan] = useDeleteLoanMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(
    typeof window !== "undefined" ? localStorage.getItem("user") || "{}" : "{}"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () => data?.data?.data?.filter((l: any) => Boolean(l?.isExternal)) || [],
    [data]
  );

  const filteredData = useMemo(() => {
    return rows.filter((item: any) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item?.externalName && item.externalName.toLowerCase().includes(q)) ||
        (item?.externalPhone && item.externalPhone.toLowerCase().includes(q)) ||
        (item?.externalGhanaCard &&
          item.externalGhanaCard.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "all" ||
        (item?.status && item.status.toLowerCase() === statusFilter.toLowerCase());

      return matchSearch && matchStatus;
    });
  }, [rows, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const showDrawer = (loan: any) => {
    setSelected(loan);
    setOpen(true);
  };
  const onClose = () => setOpen(false);

  const handleDelete = async (id: string, name?: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete the external loan for ${name || "this client"}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await deleteLoan(id).unwrap();
        if (loggedInUser._id) {
          await createActivity({
            activity: "External Loan Deleted",
            description: `A non-client loan with id ${id} was deleted`,
            user: loggedInUser._id,
          }).unwrap();
        }
        toast.success("External loan deleted successfully");
      }
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to delete");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "NL";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search external borrowers by name, phone, card..."
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
            <option value="active">Active</option>
            <option value="settled">Settled</option>
            <option value="defaulted">Defaulted</option>
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
              No External Loans Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm || statusFilter !== "all"
                ? "No loans match your search criteria. Try clearing the filter."
                : "There are currently no external non-client loans registered."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Borrower
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Phone
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Ghana Card
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                    Loan Amount
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                    Due Date
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
                  const isActive =
                    (item?.status || "").toLowerCase() === "active";
                  return (
                    <TableRow
                      key={item._id}
                      className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                    >
                      {/* Borrower */}
                      <TableCell className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center shrink-0">
                            {getInitials(item.externalName)}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">
                              {item.externalName || "Unnamed External"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              External Borrower
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700 font-mono">
                        {item.externalPhone || "—"}
                      </TableCell>

                      {/* Ghana Card */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700 font-mono">
                        {item.externalGhanaCard || "—"}
                      </TableCell>

                      {/* Loan Amount */}
                      <TableCell className="py-3.5 px-4 text-xs font-bold text-slate-900 text-right">
                        {formatPriceGHS(item.loanAmount || 0)}
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                        {item.dueDate
                          ? moment(item.dueDate).format("MMM DD, YYYY")
                          : "—"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 px-4 text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {item.status || "Active"}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => showDrawer(item)}
                            title="View Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <EyeOutlined className="text-sm" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(item._id, item.externalName)
                            }
                            title="Delete Loan"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <DeleteOutlined className="text-sm" />
                          </button>
                        </div>
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

      <NonClientLoanDrawer loan={selected} visible={open} onClose={onClose} />
    </div>
  );
};

export default NonClientLoanTable;
