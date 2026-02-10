"use client";

import React, { useState } from "react";
import { useForgotPasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();

      setIsSubmitted(true);
      toast.success("Password reset link sent! Please check your email.");
    } catch (err: any) {
      console.error("Forgot password error:", err);

      // Handle different error scenarios
      let errorMessage = "Failed to send reset link";

      if (err && "data" in err) {
        errorMessage = (err as any).data?.message || errorMessage;
      } else if (err && "error" in err) {
        errorMessage = (err as any).error?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      if (
        errorMessage.includes("not found") ||
        errorMessage.includes("no user")
      ) {
        toast.error("No account found with this email address.");
      } else if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("too many")
      ) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Show success state after submission
  if (isSubmitted) {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
        style={{
          backgroundImage: "url(/p4.jpeg)",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        <div className="relative z-10 w-full max-w-md space-y-5 bg-gray-50 p-8 rounded-lg shadow-lg">
          <img src="/logo.png" alt="Logo" className="w-32 mx-auto mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a42 42 0 01.478.578c.428.428.66.578.828.428.428 0 1.352-.428 1.78-.428.428-.428.66-.578-.828-.428L3 8z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a42 42 0 01.478.578c.428.428.66.578.828.428.428 0 1.352-.428 1.78-.428.428-.428.66-.578-.828-.428L3 8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to your email address.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">What's next?</h3>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Look for an email from "Finance Platform"</li>
                <li>Click the reset link in the email</li>
                <li>Create a new password</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition-colors"
              >
                Try Again
              </button>
              <div className="flex items-center justify-between text-sm">
                <Link href="/login" className="text-blue-500 hover:underline">
                  ← Back to Login
                </Link>
                <Link
                  href="/register"
                  className="text-blue-500 hover:underline"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <img src="/logo.png" alt="Logo" className="w-32 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Forgot Password?
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Enter your email address"
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
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        {/* Links */}
        <div className="flex items-center justify-between text-sm">
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
