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
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Skeleton } from "antd";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Wrapper from "../wealth/_components/wapper";

const Users = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { data: dataSource, isFetching } = useGetAllUsersQuery(null);
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(
    typeof window !== "undefined" ? localStorage.getItem("user") || "{}" : "{}"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form] = Form.useForm();

  const allUsers: any[] = useMemo(
    () => dataSource?.allUsers || [],
    [dataSource]
  );

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user: any) => {
      const q = searchTerm.toLowerCase().trim();
      const name = (user?.name || "").toLowerCase();
      const email = (user?.email || "").toLowerCase();
      const license = (user?.license || "").toLowerCase();
      const role = (user?.role || "").toLowerCase();

      const matchSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        license.includes(q) ||
        role.includes(q);

      const matchRole =
        roleFilter === "all" || role === roleFilter.toLowerCase();

      return matchSearch && matchRole;
    });
  }, [allUsers, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
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
          await createActivity({
            activity: "User Deleted",
            description: `A user with id ${id} was deleted`,
            user: loggedInUser._id,
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
        await updateUser({ id: selectedUser._id, data: values }).unwrap();
        if (loggedInUser._id) {
          await createActivity({
            activity: "User Updated",
            description: `A user with id ${selectedUser._id} was updated`,
            user: loggedInUser._id,
          }).unwrap();
        }
        toast.success("User updated successfully");
      }
      setSelectedUser(null);
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

  return (
    <Wrapper>
      <div className="mt-7 text-white mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          User Management
        </h1>
        <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
          Manage system administrators, staff members, and client user accounts
        </p>
      </div>

      <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8 space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, role, or license..."
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
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
              <option value="client">Client</option>
              <option value="user">User</option>
            </select>

            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
              {filteredUsers.length} Users
            </span>
          </div>
        </div>

        {/* Main shadcn Table */}
        <div
          data-tour="users-table"
          className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
        >
          {isFetching ? (
            <div className="p-8">
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FolderOpenOutlined className="text-2xl text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                No Users Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchTerm || roleFilter !== "all"
                  ? "No users match your search filter."
                  : "There are currently no users in the system."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                      User
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                      Email Address
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                      License
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs">
                      Role
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-slate-700 text-xs text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user: any) => {
                    const role = (user.role || "User").toLowerCase();
                    const isSuper = role.includes("super");
                    const isAdmin = role.includes("admin");

                    return (
                      <TableRow
                        key={user._id}
                        className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                      >
                        {/* User / Avatar */}
                        <TableCell className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-slate-900 block">
                                {user.name || "Unnamed User"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {user.designation || user.role || "Member"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="py-3.5 px-4 text-xs text-slate-700 font-mono">
                          {user.email || "—"}
                        </TableCell>

                        {/* License */}
                        <TableCell className="py-3.5 px-4 text-xs">
                          {user.license ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {user.license}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell className="py-3.5 px-4 text-xs">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              isSuper
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : isAdmin
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {user.role || "User"}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 px-4 text-right">
                          <div
                            data-tour="user-actions"
                            className="flex items-center justify-end gap-1.5"
                          >
                            <button
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <EditOutlined className="text-sm" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteUser(user._id, user.name)
                              }
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
          )}

          {/* Footer / Pagination */}
          {!isFetching && filteredUsers.length > 0 && (
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
                      filteredUsers.length
                    )}
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
      </div>

      <Drawer
        title={selectedUser ? "Edit User" : "Add User"}
        width={380}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => form.submit()}
            >
              Submit
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter the name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter the email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="designation" label="Designation">
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </Wrapper>
  );
};

export default Users;
