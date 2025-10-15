"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useResetPasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token as string;

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await resetPassword({ token, data: { password, passwordConfirm } }).unwrap();
      toast.success("Password reset successful. Please log in.");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 bg-white p-6 rounded-md shadow"
      >
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none"
            placeholder="********"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none"
            placeholder="********"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset password"}
        </button>
        <div className="flex items-center justify-between text-sm text-blue-600 mt-2">
          <Link href="/" className="hover:underline">Back to login</Link>
          <Link href="/register" className="hover:underline">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
