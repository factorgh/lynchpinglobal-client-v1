"use client";

import React, { useState } from "react";
import { useUpdatePasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await updatePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      }).unwrap();
      toast.success("Password updated. Please login again.");
      // Optional: clear token and redirect to login
      try {
        localStorage.removeItem("token");
      } catch {}
      router.push("/");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 bg-white p-6 rounded-md shadow"
      >
        <h1 className="text-xl font-semibold">Change Password</h1>
        <div>
          <label className="block text-sm font-medium mb-1">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none"
            placeholder="********"
            data-tour="old-password"
          />
        </div>
        <div data-tour="strength-meter">
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none"
            placeholder="********"
            data-tour="new-password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm new password</label>
          <input
            type="password"
            required
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none"
            placeholder="********"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
