"use client";

import React, { useState } from "react";
import { useForgotPasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("If the email exists, a reset link has been sent.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send reset email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 bg-white p-6 rounded-md shadow"
      >
        <h1 className="text-xl font-semibold">Forgot Password</h1>
        <p className="text-sm text-gray-600">
          Enter your account email. We will send you a password reset link.
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
