"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import {
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useUpdateUserMutation,
} from "@/services/users";
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Skeleton } from "antd";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Wrapper from "../wealth/_components/wapper";
import ProfileImageUpload from "@/app/(components)/ProfileUpload/ProfileImageUpload";

const Users = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const { data: dataSource, isFetching } = useGetAllUsersQuery(null);
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(
    typeof window !== "undefined" ? localStorage.getItem("user") || "{}" : "{}"
  );

  const [searchTerm, setSearchTerm] = useState("");
  // roleFilter can be: 'admins' (default - User Mgt focuses on system staff) | 'clients' | 'all'
  const [roleFilter, setRoleFilter] = useState<"admins" | "clients" | "all">("admins");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form] = Form.useForm();

  const allUsers: any[] = useMemo(
    () => dataSource?.allUsers || [],
    [dataSource]
  );

  const isUserAdmin = (user: any) => {
    const role = (user?.role || "").toLowerCase();
    return role === "admin" || role === "superadmin";
  };

  const clientUsers = useMemo(() => {
    return allUsers.filter((u: any) => !isUserAdmin(u));
  }, [allUsers]);

  const adminUsers = useMemo(() => {
    return allUsers.filter((u: any) => isUserAdmin(u));
  }, [allUsers]);

  const matchesSearch = (user: any, q: string) => {
    if (!q) return true;
    const name = (user?.name || "").toLowerCase();
    const displayName = (user?.displayName || "").toLowerCase();
    const email = (user?.email || "").toLowerCase();
    const license = (user?.license || "").toLowerCase();
    const role = (user?.role || "").toLowerCase();
    const designation = (user?.designation || "").toLowerCase();

    return (
      name.includes(q) ||
      displayName.includes(q) ||
      email.includes(q) ||
      license.includes(q) ||
      role.includes(q) ||
      designation.includes(q)
    );
  };

  const filteredAdmins = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return adminUsers.filter((u: any) => matchesSearch(u, q));
  }, [adminUsers, searchTerm]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return clientUsers.filter((u: any) => matchesSearch(u, q));
  }, [clientUsers, searchTerm]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === "admins") return filteredAdmins;
    if (roleFilter === "clients") return filteredClients;
    return [...filteredAdmins, ...filteredClients];
  }, [roleFilter, filteredAdmins, filteredClients]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserPhoto(user.photo || null);
    form.setFieldsValue(user);
    setDrawerVisible(true);
  };

  const handleDeleteUser = async (id: any, name?: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete user ${name || ""}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await deleteUser(id).unwrap();
        if (loggedInUser._id) {
          const targetU = allUsers.find((u: any) => u._id === id);
          const uName = targetU?.displayName || targetU?.name || name || "User";
          await createActivity({
            activity: "User Account Deleted",
            description: `User account "${uName}" (@${targetU?.name || 'user'}, ${targetU?.license || id}) with role "${targetU?.role || 'user'}" was deleted`,
            user: loggedInUser._id,
            targetUser: id,
            targetName: uName,
            targetLicense: targetU?.license,
            targetAccount: `@${targetU?.name || 'user'}`,
            entityType: "User",
            entityId: String(id),
          }).unwrap();
        }
        toast.success("User deleted successfully");
      }
    } catch (error: any) {
      toast.error("Failed to delete user: " + error?.message);
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedUser) {
        // Access credentials (username, email, password) are strictly changeable by client only
        const {
          name: _ignoredUsername,
          username: _ignoredUname,
          email: _ignoredEmail,
          password: _ignoredPassword,
          passwordConfirm: _ignoredConfirm,
          ...safeValues
        } = values;

        await updateUser({
          id: selectedUser._id,
          data: {
            ...safeValues,
            photo: userPhoto || "",
          },
        }).unwrap();

        if (loggedInUser._id) {
          const uName = selectedUser.displayName || selectedUser.name;
          await createActivity({
            activity: "User Profile Updated",
            description: `User "${uName}" (@${selectedUser.name}, ${selectedUser.license || selectedUser._id}) profile was updated (Role: ${values.role || selectedUser.role})`,
            user: loggedInUser._id,
            targetUser: selectedUser._id,
            targetName: uName,
            targetLicense: selectedUser.license,
            targetAccount: `@${selectedUser.name}`,
            entityType: "User",
            entityId: String(selectedUser._id),
          }).unwrap();
        }
        toast.success("User updated successfully");
      }
      setSelectedUser(null);
      setUserPhoto(null);
      setDrawerVisible(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Failed to update user");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderUserTable = (usersList: any[], emptyTitle: string) => {
    if (usersList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
            <FolderOpenOutlined className="text-xl text-slate-400" />
          </div>
          <h4 className="text-xs font-semibold text-slate-800">{emptyTitle}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {searchTerm ? "No users match your search query." : "No accounts in this category."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
              <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                Full Name
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                Username (Login ID)
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                Email Address
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                License Code
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                System Role
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user: any) => {
              const role = (user.role || "user").toLowerCase();
              const isSuper = role === "superadmin";
              const isAdmin = role === "admin";
              const isClientRole = !isAdmin && !isSuper;

              return (
                <TableRow
                  key={user._id}
                  className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                >
                  {/* Full Name & Avatar */}
                  <TableCell className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 overflow-hidden border ${
                          isAdmin || isSuper
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt={user.displayName || user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user.displayName || user.name)
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block leading-tight">
                          {user.displayName || user.name || "Unnamed User"}
                        </span>
                        {user.designation && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {user.designation}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Username (Login ID) */}
                  <TableCell className="py-3 px-4 text-xs font-mono">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      @{user.name || "username"}
                    </span>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="py-3 px-4 text-xs text-slate-700 font-mono">
                    {user.email || "—"}
                  </TableCell>

                  {/* License */}
                  <TableCell className="py-3 px-4 text-xs">
                    {user.license ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {user.license}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>

                  {/* Role Badge */}
                  <TableCell className="py-3 px-4 text-xs">
                    {isSuper ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        <ShieldAlert className="w-3 h-3 text-purple-600" />
                        Super Admin
                      </span>
                    ) : isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Client
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditUser(user)}
                        title="Edit User Profile"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <EditOutlined className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.displayName || user.name)}
                        title="Delete User"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
    );
  };

  return (
    <Wrapper>
      {/* Page Header */}
      <div className="mt-7 text-white mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          User & Role Management
        </h1>
        <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
          Manage system administrators, staff members, and client user accounts with segregated roles
        </p>
      </div>

      {/* Notice: Clear separation between User Management & Client Management */}
      <div className="mb-6 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-purple-200/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              User Management focuses on System Administrators & Staff
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Investor and client profiles are managed separately in the dedicated <span className="font-semibold text-emerald-700">Client Management</span> section.
            </p>
          </div>
        </div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <span>Go to Client Management</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Role Breakdown Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Administrators & Staff (Primary focus for User Mgt) */}
        <div
          onClick={() => {
            setRoleFilter("admins");
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl p-4 border transition-all shadow-sm ${
            roleFilter === "admins"
              ? "bg-white/95 border-purple-600 shadow-md ring-2 ring-purple-500/20"
              : "bg-white/85 hover:bg-white/95 border-white/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                  Admins & Staff
                </p>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">
                  Internal
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-purple-800 mt-1">
                {adminUsers.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                System administrators & internal staff
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Clients & Investors */}
        <div
          onClick={() => {
            setRoleFilter("clients");
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl p-4 border transition-all shadow-sm ${
            roleFilter === "clients"
              ? "bg-white/95 border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white/85 hover:bg-white/95 border-white/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Client Accounts
                </p>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                  Portal
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
                {clientUsers.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                External clients & mandate holders
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Total Accounts */}
        <div
          onClick={() => {
            setRoleFilter("all");
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl p-4 border transition-all shadow-sm ${
            roleFilter === "all"
              ? "bg-white/95 border-slate-500 shadow-md ring-2 ring-slate-500/20"
              : "bg-white/85 hover:bg-white/95 border-white/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                All Registered Users
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {allUsers.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total system & client accounts
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
              <UsersIcon className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8 space-y-5">
        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
            <button
              onClick={() => {
                setRoleFilter("admins");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "admins"
                  ? "bg-white text-purple-900 shadow-sm ring-1 ring-purple-500/20"
                  : "text-slate-600 hover:text-purple-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Admins & Staff</span>
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full">
                {adminUsers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setRoleFilter("clients");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "clients"
                  ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-500/20"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clients</span>
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                {clientUsers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setRoleFilter("all");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>All Users</span>
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded-full">
                {allUsers.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, @username, email, or license..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Content Section */}
        {isFetching ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : roleFilter === "all" && !searchTerm ? (
          /* DISTINCT GROUPED VIEW: System Admins & Staff on top, Clients below */
          <div className="space-y-6">
            {/* Group 1: Administrators & Staff */}
            <div className="rounded-xl border border-purple-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                      Administrators & System Staff
                    </h3>
                    <p className="text-[11px] text-purple-800/80">
                      Users with administrative privileges and system control
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-100/90 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {filteredAdmins.length} Administrators
                </span>
              </div>
              {renderUserTable(filteredAdmins, "No administrators found")}
            </div>

            {/* Group 2: Clients & Investors */}
            <div className="rounded-xl border border-emerald-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Clients & Mandate Holders
                    </h3>
                    <p className="text-[11px] text-emerald-800/80">
                      External user accounts accessing the client portal
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {filteredClients.length} Clients
                </span>
              </div>
              {renderUserTable(filteredClients, "No clients found")}
            </div>
          </div>
        ) : (
          /* Filtered / Paginated View */
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {renderUserTable(
              paginatedUsers,
              roleFilter === "admins"
                ? "No administrators match your search."
                : roleFilter === "clients"
                ? "No clients match your search."
                : "No users found."
            )}

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
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
                      {Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(currentPage * pageSize, filteredUsers.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900">
                      {filteredUsers.length}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit User Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <UserOutlined className="text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                {selectedUser ? "Edit User Profile" : "User Profile"}
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                {selectedUser ? `ID: ${selectedUser.license || selectedUser._id}` : ""}
              </p>
            </div>
          </div>
        }
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
              onClick={() => form.submit()}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <div className="mb-4">
            <ProfileImageUpload
              value={userPhoto}
              onChange={setUserPhoto}
              label="User Profile Picture"
              initialsFallback={selectedUser?.displayName || selectedUser?.name || "US"}
            />
          </div>

          {/* Username - STRICTLY LOCKED & READ-ONLY */}
          <Form.Item
            name="name"
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-slate-700">Username (Login ID)</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/80 flex items-center gap-1">
                  <LockOutlined className="text-[10px]" /> Changeable by client only
                </span>
              </div>
            }
            tooltip="Usernames are immutable account handles set during account onboarding and cannot be modified from the admin side."
          >
            <Input
              disabled
              prefix={<span className="text-slate-400 font-mono text-xs mr-1">@</span>}
              className="rounded-xl py-2 text-xs bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
            />
          </Form.Item>

          <Form.Item
            name="displayName"
            label={<span className="font-semibold text-xs text-slate-700">Display / Full Name</span>}
          >
            <Input placeholder="e.g. John Mensah" className="rounded-xl py-2 text-xs" />
          </Form.Item>

          {/* Email - STRICTLY LOCKED & READ-ONLY */}
          <Form.Item
            name="email"
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-slate-700">Email Address (Login)</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/80 flex items-center gap-1">
                  <LockOutlined className="text-[10px]" /> Changeable by client only
                </span>
              </div>
            }
            tooltip="Login credentials (email, username, password) are strictly changeable by the account holder only."
          >
            <Input
              disabled
              placeholder="e.g. john@example.com"
              className="rounded-xl py-2 text-xs bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span className="font-semibold text-xs text-slate-700">System Role</span>}
          >
            <Select
              className="rounded-xl"
              options={[
                { value: "admin", label: "Administrator (Staff)" },
                { value: "superadmin", label: "Super Administrator" },
                { value: "user", label: "Client (Portal Access)" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="designation"
            label={<span className="font-semibold text-xs text-slate-700">Designation</span>}
            tooltip="Simplified to Administrator or Client"
          >
            <Select
              allowClear
              placeholder="Select designation"
              options={[
                { value: "Admin", label: "Administrator" },
                { value: "Client", label: "Client" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </Wrapper>
  );
};

export default Users;
