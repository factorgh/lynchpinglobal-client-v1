"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useUpdateUserMutation,
} from "@/services/users";
import { useGetAllInvestmentsQuery } from "@/services/investment";
import { formatPriceGHS } from "@/lib/helper";
import {
  Search,
  Plus,
  Users,
  Wallet,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  FolderArchive,
} from "lucide-react";
import {
  MailOutlined as Mail,
  PhoneOutlined as Phone,
  CopyOutlined as Copy,
  CheckOutlined as Check,
  EyeOutlined as Eye,
  EditOutlined as Edit2,
  DeleteOutlined as Trash2,
  ExportOutlined as ExternalLink,
  UserOutlined,
  LockOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Drawer, Form, Input, Button, Skeleton, Tag, Tooltip } from "antd";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import moment from "moment";
import Link from "next/link";
import Wrapper from "../wealth/_components/wapper";
import ProfileImageUpload from "@/app/(components)/ProfileUpload/ProfileImageUpload";

export default function ClientsPage() {
  const { data: usersData, isFetching: isUsersLoading, refetch: refetchUsers } = useGetAllUsersQuery(null);
  const { data: investmentsData, isFetching: isInvestmentsLoading } = useGetAllInvestmentsQuery(null);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "prospect">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawers state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientUploadedFiles, setClientUploadedFiles] = useState<any[]>([]);
  const [isClientFilesLoading, setIsClientFilesLoading] = useState(false);

  useEffect(() => {
    if (selectedClient?._id) {
      setIsClientFilesLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      fetch(`/api/v1/uploads/db?category=client-documents&user=${selectedClient._id}`, {
        headers: token
          ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` }
          : undefined,
      })
        .then((res) => (res.ok ? res.json() : { files: [] }))
        .then((data) => setClientUploadedFiles(data.files || []))
        .catch(() => setClientUploadedFiles([]))
        .finally(() => setIsClientFilesLoading(false));
    } else {
      setClientUploadedFiles([]);
    }
  }, [selectedClient]);

  // Profile picture states
  const [createPhoto, setCreatePhoto] = useState<string | null>(null);
  const [editPhoto, setEditPhoto] = useState<string | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Helper to identify administrative / staff users
  const isUserAdmin = (user: any) => {
    const role = (user?.role || "").toLowerCase();
    const designation = (user?.designation || "").toLowerCase();
    return (
      role === "admin" ||
      role === "superadmin" ||
      designation === "admin" ||
      designation === "administrator" ||
      designation === "staff"
    );
  };

  // Extract clients (strictly non-admin client accounts)
  const rawClients: any[] = useMemo(() => {
    const all = usersData?.allUsers || [];
    return all.filter((u: any) => !isUserAdmin(u));
  }, [usersData]);

  // Extract investments grouped by user
  const clientInvestmentsMap = useMemo(() => {
    const map = new Map<string, { count: number; totalPrincipal: number; investments: any[] }>();
    const invList = investmentsData?.data || [];

    invList.forEach((inv: any) => {
      // Find userId
      const uId = String(
        inv.userId?._id ||
        inv.userId ||
        inv.owners?.[0]?.user?._id ||
        inv.owners?.[0]?.user ||
        ""
      );

      if (uId) {
        const current = map.get(uId) || { count: 0, totalPrincipal: 0, investments: [] };
        current.count += 1;
        current.totalPrincipal += inv.principal || 0;
        current.investments.push(inv);
        map.set(uId, current);
      }
    });

    return map;
  }, [investmentsData]);

  // Enriched client list with investment stats
  const enrichedClients = useMemo(() => {
    return rawClients.map((client: any) => {
      const invStats = clientInvestmentsMap.get(String(client._id)) || {
        count: 0,
        totalPrincipal: 0,
        investments: [],
      };
      return {
        ...client,
        mandateCount: invStats.count,
        totalPrincipal: invStats.totalPrincipal,
        investments: invStats.investments,
        hasMandates: invStats.count > 0,
      };
    });
  }, [rawClients, clientInvestmentsMap]);

  // Overall Metrics
  const metrics = useMemo(() => {
    const totalClients = enrichedClients.length;
    const activeInvestors = enrichedClients.filter((c) => c.hasMandates).length;
    const totalAUM = enrichedClients.reduce((sum, c) => sum + c.totalPrincipal, 0);
    const thirtyDaysAgo = moment().subtract(30, "days");
    const recentSignups = enrichedClients.filter((c) =>
      c.createdAt ? moment(c.createdAt).isAfter(thirtyDaysAgo) : false
    ).length;

    return { totalClients, activeInvestors, totalAUM, recentSignups };
  }, [enrichedClients]);

  // Filter & Sort
  const filteredClients = useMemo(() => {
    let result = enrichedClients.filter((client) => {
      const q = searchTerm.toLowerCase().trim();
      const name = (client.name || "").toLowerCase();
      const displayName = (client.displayName || "").toLowerCase();
      const email = (client.email || "").toLowerCase();
      const license = (client.license || "").toLowerCase();
      const phone = (client.phone || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        displayName.includes(q) ||
        email.includes(q) ||
        license.includes(q) ||
        phone.includes(q);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? client.hasMandates
          : !client.hasMandates;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      // default newest
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [enrichedClients, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Drawer
  const handleOpenEdit = (client: any) => {
    setSelectedClient(client);
    setEditPhoto(client.photo || null);
    editForm.setFieldsValue({
      name: client.name,
      displayName: client.displayName || client.name,
      email: client.email,
      phone: client.phone,
      license: client.license,
    });
    setIsEditDrawerOpen(true);
  };

  // Open Details Drawer
  const handleOpenDetails = (client: any) => {
    setSelectedClient(client);
    setIsDetailsDrawerOpen(true);
  };

  // Handle Create Client
  const handleCreateSubmit = async (values: any) => {
    try {
      await createUser({
        name: values.name?.trim(),
        displayName: values.displayName?.trim() || values.name?.trim(),
        email: values.email?.trim()?.toLowerCase(),
        phone: values.phone?.trim() || undefined,
        license: values.license?.trim() || undefined,
        photo: createPhoto || undefined,
        password: values.password,
        passwordConfirm: values.passwordConfirm || values.password,
        role: "user",
      }).unwrap();

      toast.success("Client added successfully");
      setIsAddDrawerOpen(false);
      createForm.resetFields();
      setCreatePhoto(null);
      if (refetchUsers) refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to create client");
    }
  };

  // Handle Edit Client
  const handleEditSubmit = async (values: any) => {
    if (!selectedClient?._id) return;
    try {
      // Username and Email are access credentials changeable by client only
      await updateUser({
        id: selectedClient._id,
        data: {
          displayName: values.displayName?.trim() || selectedClient.displayName || selectedClient.name,
          phone: values.phone?.trim() || undefined,
          license: values.license?.trim() || undefined,
          photo: editPhoto || "",
        },
      }).unwrap();

      toast.success("Client updated successfully");
      setIsEditDrawerOpen(false);
      editForm.resetFields();
      setEditPhoto(null);
      if (refetchUsers) refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to update client");
    }
  };

  // Handle Delete Client
  const handleDeleteClient = async (client: any) => {
    const clientName = client.displayName || client.name || "this client";
    try {
      const result = await Swal.fire({
        title: "Delete Client?",
        text: `Are you sure you want to delete ${clientName}? This action will be logged in the audit trail.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e11d48",
        confirmButtonText: "Yes, delete client",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await deleteUser(client._id).unwrap();
        toast.success("Client deleted successfully");
        if (refetchUsers) refetchUsers();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to delete client");
    }
  };

  return (
    <Wrapper>
      <div className="py-5 select-none">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                Clients Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/30">
                {enrichedClients.length} registered
              </span>
            </div>
            <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
              Monitor client profiles, capital mandates, contact details, and account standing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/vault"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold rounded-xl shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              <FolderArchive className="w-4 h-4" />
              <span>Client Documents</span>
            </Link>
            <button
              onClick={() => setIsAddDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Client</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Clients */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Clients
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.totalClients}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Registered platform users
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Active Mandate Partners */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Mandate Partners
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
                {metrics.activeInvestors}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hold 1 or more mandates
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Deployed Capital */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Deployed Capital (Total)
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 truncate">
                {formatPriceGHS(metrics.totalAUM)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cumulative mandate principal
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: New Signups */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                New (Last 30 Days)
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                +{metrics.recentSignups}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Recently joined
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Main Card with Filter Bar & Table */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-slate-800">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client name, email, phone, or CL-code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Filter Tabs & Sorter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({enrichedClients.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("active");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mandate Partners ({metrics.activeInvestors})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("prospect");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "prospect"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Prospects ({enrichedClients.length - metrics.activeInvestors})
                </button>
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white/90">
            {isUsersLoading ? (
              <div className="p-8">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No clients match your filter
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Try adjusting your search query or filter settings, or add a new client to get started.
                </p>
                <button
                  onClick={() => setIsAddDrawerOpen(true)}
                  className="mt-4 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Add Client
                </button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-700 pl-4 py-3">
                      Client Profile
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                      Client Code
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                      Contact Details
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                      Portfolio Status
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                      Date Registered
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right pr-4 py-3">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client: any, idx: number) => {
                    const displayName = client.displayName || client.name || "Client";
                    const initial = displayName.trim().charAt(0).toUpperCase() || "C";
                    const clientCode =
                      client.license && client.license.startsWith("CL-")
                        ? client.license
                        : client.license
                        ? `CL-${client.license}`
                        : `CL-${String(client._id).substring(0, 7).toUpperCase()}`;

                    return (
                      <TableRow
                        key={client._id || idx}
                        className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0"
                      >
                        {/* Profile Info */}
                        <TableCell className="pl-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs overflow-hidden">
                              {client.photo ? (
                                <img
                                  src={client.photo}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initial
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate leading-tight">
                                {displayName}
                              </p>
                              {client.name && client.name !== client.displayName && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  User: {client.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Client Code */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-mono">
                              {clientCode}
                            </span>
                            <Tooltip title="Copy Code">
                              <button
                                type="button"
                                onClick={() => handleCopy(clientCode, client._id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {copiedId === client._id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                        </TableCell>

                        {/* Contact details */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]" title={client.email}>
                                {client.email}
                              </span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Portfolio Status */}
                        <TableCell className="py-3.5">
                          {client.hasMandates ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {formatPriceGHS(client.totalPrincipal)}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200">
                                {client.mandateCount} Active Mandate{client.mandateCount > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                              No active mandates
                            </span>
                          )}
                        </TableCell>

                        {/* Date Registered */}
                        <TableCell className="py-3.5">
                          <div className="text-xs text-slate-600">
                            <p className="font-medium">
                              {client.createdAt ? moment(client.createdAt).format("MMM D, YYYY") : "N/A"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {client.createdAt ? moment(client.createdAt).fromNow() : ""}
                            </p>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip title="View Client Dossier">
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(client)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Edit Client">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(client)}
                                className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Delete Client">
                              <button
                                type="button"
                                onClick={() => handleDeleteClient(client)}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {filteredClients.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-2 text-xs text-slate-600">
              <span className="font-medium">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredClients.length)} of {filteredClients.length} clients
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-3 py-1 font-bold bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD CLIENT DRAWER */}
      {/* ======================================================== */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80 shadow-2xs shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">Add New Client</h3>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                Register profile, upload R2 photo, and assign portal access
              </p>
            </div>
          </div>
        }
        open={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          className="space-y-4"
        >
          {/* Profile Picture Upload to Cloudflare R2 */}
          <ProfileImageUpload
            value={createPhoto}
            onChange={setCreatePhoto}
            label="Client Profile Picture"
            initialsFallback="CL"
          />

          {/* Section: Client Identity */}
          <div className="pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Client Identity
            </h4>

            <div className="space-y-3">
              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Full Name</span>}
                name="name"
                rules={[{ required: true, message: "Please provide the client name" }]}
                className="mb-3"
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400 text-xs mr-1" />}
                  placeholder="e.g. John Mensah"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Display / Corporate Name</span>}
                name="displayName"
                className="mb-3"
              >
                <Input
                  prefix={<IdcardOutlined className="text-slate-400 text-xs mr-1" />}
                  placeholder="e.g. Mensah Capital (Optional)"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>
            </div>
          </div>

          {/* Section: Contact & Identification */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Contact & Identification
            </h4>

            <div className="space-y-3">
              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Email Address</span>}
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
                className="mb-3"
              >
                <Input
                  prefix={<Mail className="text-slate-400 text-xs mr-1" />}
                  placeholder="john@example.com"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Phone Number</span>}
                name="phone"
                className="mb-3"
              >
                <Input
                  prefix={<Phone className="text-slate-400 text-xs mr-1" />}
                  placeholder="+233 24 000 0000"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Client License Code</span>}
                name="license"
                tooltip="Optional: If left blank, the system automatically assigns the next sequential code."
                className="mb-3"
              >
                <Input
                  prefix={
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 mr-1">
                      CL
                    </span>
                  }
                  placeholder="e.g. CL-2026001 (Auto-generated if blank)"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>
            </div>
          </div>

          {/* Section: Security & Credentials */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Portal Access & Credentials
              </h4>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 font-medium">
                First-login reset enforced
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 mb-3 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
              <SafetyCertificateOutlined className="text-emerald-600 text-xs mt-0.5 shrink-0" />
              <span>
                The client will log in using this temporary password and will be prompted to accept T&Cs and choose their permanent credentials.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Temporary Password</span>}
                name="password"
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 8, message: "At least 8 characters" },
                ]}
                className="mb-0"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 text-xs mr-1" />}
                  placeholder="••••••••"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Confirm Password</span>}
                name="passwordConfirm"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match!"));
                    },
                  }),
                ]}
                className="mb-0"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 text-xs mr-1" />}
                  placeholder="••••••••"
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              onClick={() => setIsAddDrawerOpen(false)}
              className="rounded-xl text-xs font-semibold px-4 py-2 h-auto"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-5 py-2 h-auto shadow-sm"
            >
              Register Client
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* ======================================================== */}
      {/* EDIT CLIENT DRAWER */}
      {/* ======================================================== */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100/80 shadow-2xs shrink-0">
              <Edit2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">Edit Client Profile</h3>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                Update account details and Cloudflare R2 profile photo
              </p>
            </div>
          </div>
        }
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="space-y-4"
        >
          {/* Profile Picture Upload to Cloudflare R2 */}
          <ProfileImageUpload
            value={editPhoto}
            onChange={setEditPhoto}
            label="Client Profile Picture"
            initialsFallback={selectedClient?.displayName || selectedClient?.name || "CL"}
          />

          <div className="pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Client Details
            </h4>

            <div className="space-y-3">
              <Form.Item
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs text-slate-700">Username</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-amber-200/80">
                      <LockOutlined className="text-[10px]" /> Locked (Client managed)
                    </span>
                  </div>
                }
                name="name"
                className="mb-3"
                tooltip="Usernames are unique account handles set by the client and cannot be edited by administrators."
              >
                <Input
                  disabled
                  prefix={<span className="text-slate-400 font-mono text-xs mr-1">@</span>}
                  className="rounded-xl py-2 text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Display Name</span>}
                name="displayName"
                className="mb-3"
              >
                <Input
                  prefix={<IdcardOutlined className="text-slate-400 text-xs mr-1" />}
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>

              <Form.Item
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs text-slate-700">Email Address (Login)</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/80 flex items-center gap-1">
                      <LockOutlined className="text-[10px]" /> Changeable by client only
                    </span>
                  </div>
                }
                name="email"
                className="mb-3"
                tooltip="Login access credentials (email, username, password) are strictly managed by the account holder."
              >
                <Input
                  disabled
                  prefix={<Mail className="text-slate-400 text-xs mr-1" />}
                  className="rounded-xl py-2 text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Phone Number</span>}
                name="phone"
                className="mb-3"
              >
                <Input
                  prefix={<Phone className="text-slate-400 text-xs mr-1" />}
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-semibold text-xs text-slate-700">Client License Code</span>}
                name="license"
                className="mb-3"
              >
                <Input
                  prefix={
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80 mr-1">
                      CL
                    </span>
                  }
                  className="rounded-xl py-2 text-xs"
                />
              </Form.Item>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              onClick={() => setIsEditDrawerOpen(false)}
              className="rounded-xl text-xs font-semibold px-4 py-2 h-auto"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdating}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold px-5 py-2 h-auto shadow-sm"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* ======================================================== */}
      {/* CLIENT DOSSIER / DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800 text-base">Client Dossier</span>
          </div>
        }
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        width={560}
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Header Profile Badge */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                {selectedClient.photo ? (
                  <img
                    src={selectedClient.photo}
                    alt={selectedClient.displayName || selectedClient.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (selectedClient.displayName || selectedClient.name || "C")
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {selectedClient.displayName || selectedClient.name}
                  </h3>
                  <Tag color="success" className="font-bold">
                    Client
                  </Tag>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-mono text-xs font-bold">
                    {selectedClient.license || "CL-PENDING"}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    Registered {moment(selectedClient.createdAt).format("MMM YYYY")}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Contact Information
              </h4>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedClient.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedClient.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account ID</span>
                <span className="font-mono text-xs text-slate-600">{selectedClient._id}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-800 capitalize">{selectedClient.role}</span>
              </div>
            </div>

            {/* Portfolio Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client Mandates ({selectedClient.mandateCount || 0})
                </h4>
                <Link
                  href="/wealth"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Go to Mandates</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {selectedClient.investments && selectedClient.investments.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800">Total Portfolio Value</p>
                      <h4 className="text-lg font-extrabold text-emerald-900">
                        {formatPriceGHS(selectedClient.totalPrincipal || 0)}
                      </h4>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-white rounded-lg text-emerald-800 border border-emerald-200">
                      {selectedClient.mandateCount} Active
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {selectedClient.investments.map((inv: any, i: number) => (
                      <div key={inv._id || i} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">
                            {formatPriceGHS(inv.principal || 0)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Quarter: {inv.quarter || "N/A"} • ID: {String(inv._id).substring(0, 8)}...
                          </p>
                        </div>
                        <Tag color={inv.archived ? "default" : "green"}>
                          {inv.archived ? "Archived" : "Active"}
                        </Tag>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  This client currently has no recorded capital mandates.
                </div>
              )}
            </div>

            {/* Client Uploaded Documents Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Documents Uploaded by Client ({clientUploadedFiles.length})
                </h4>
                <span className="text-[11px] text-slate-400">Vault Submissions</span>
              </div>

              {isClientFilesLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading files...</div>
              ) : clientUploadedFiles.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {clientUploadedFiles.map((file: any, i: number) => (
                    <div
                      key={file.public_id || i}
                      className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 truncate">{file.filename || file.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            {file.docType || "Document"}
                          </span>
                        </div>
                        {file.note && <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">“{file.note}”</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {moment(file.created_at).format("MMM D, YYYY")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">
                  No documents uploaded by this client yet.
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button onClick={() => setIsDetailsDrawerOpen(false)} className="rounded-lg text-xs font-semibold">
                Close Dossier
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setIsDetailsDrawerOpen(false);
                  handleOpenEdit(selectedClient);
                }}
                className="bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </Wrapper>
  );
}
