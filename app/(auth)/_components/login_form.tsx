"use client";

import DotLoader from "@/app/(components)/dot-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useLoginMutation } from "@/services/auth";

// Call base url

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // To show error messages
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  // Basic email regex for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isPasswordValid = (pwd: string) => pwd.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    try {
      const { token, user } = await login({ identifier, password }).unwrap();
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(user.role));

      if (user.role === "admin" || user.role === "superadmin") {
        router.replace("/dashboard");
      } else if (user.role === "user") {
        router.replace("/landing");
      }
    } catch (err: any) {
      setError("Invalid email/username or password.");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: "url(/p4.jpeg)", // Set your image path here
      }}
    >
      {/* Optional: Overlay to make form more visible on top of the background */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 w-full max-w-md bg-gray-50 shadow-lg rounded-lg p-8">
        <img src="/logo.png" alt="Logo" className="w-40 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Login to Lynchpin Global
        </h2>
        {error && (
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700"
            >
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none bg-white"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-sm text-blue-600 hover:underline"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 text-white font-medium rounded-lg shadow-md transition-colors ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
            }`}
          >
            {isLoading ? <DotLoader /> : "Login"}
          </button>
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-500 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-500 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
