"use client";

import React, { useState } from "react";
import { useChangePasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!identifier.trim()) {
      toast.error("Please enter your email or username");
      return;
    }

    if (!currentPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      const result = await changePassword({
        identifier,
        currentPassword,
        newPassword,
        newPasswordConfirm,
      }).unwrap();

      // Store token and user data if returned
      if (result.token) {
        localStorage.setItem("token", result.token);
      }
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("roles", JSON.stringify(result.user.role));
      }

      toast.success("Password changed successfully!");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/p4.jpeg)",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md space-y-5 bg-gray-50 p-8 rounded-lg shadow-lg"
      >
        <img src="/logo.png" alt="Logo" className="w-32 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Change Password
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Enter your credentials and set a new password
        </p>

        {/* Identifier (Email or Username) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email or Username
          </label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Enter your email or username"
            disabled={isLoading}
          />
        </div>

        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Enter your current password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-sm text-blue-600 hover:underline"
            >
              {showCurrentPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Enter new password (min. 8 characters)"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-sm text-blue-600 hover:underline"
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters long
          </p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Confirm your new password"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2.5 px-4 text-white font-medium rounded-lg shadow-md transition-colors ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
          }`}
        >
          {isLoading ? "Changing Password..." : "Change Password"}
        </button>

        {/* Links */}
        <div className="flex items-center justify-between text-sm mt-4">
          <Link href="/login" className="text-blue-500 hover:underline">
            ← Back to Login
          </Link>
          <Link href="/register" className="text-blue-500 hover:underline">
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}
