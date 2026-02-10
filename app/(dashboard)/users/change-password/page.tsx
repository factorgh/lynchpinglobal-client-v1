"use client";

import React, { useState, useEffect } from "react";
import { useUpdatePasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [updatePassword, { isLoading, error }] = useUpdatePasswordMutation();

  // Get user info for password validation
  useEffect(() => {
    // Get user info from localStorage or context
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to get user info:", error);
    }
  }, []);

  // Enhanced password validation
  const validatePassword = (
    password: string,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push("Password must be at least 12 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Check for common passwords
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "letmein",
      "password123",
    ];
    if (
      commonPasswords.some((common) => password.toLowerCase().includes(common))
    ) {
      errors.push("Password is too common and easily guessable");
    }

    // Check for user info
    if (userInfo) {
      const lowerPassword = password.toLowerCase();
      if (
        userInfo.name &&
        lowerPassword.includes(userInfo.name.toLowerCase())
      ) {
        errors.push("Password cannot contain your name");
      }
      if (userInfo.email) {
        const emailParts = userInfo.email.split("@")[0].toLowerCase();
        if (lowerPassword.includes(emailParts)) {
          errors.push("Password cannot contain your email username");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors.join(", "));
      setShowPasswordRequirements(true);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      const result = await updatePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      }).unwrap();

      toast.success(
        result?.message || "Password updated successfully. Please login again.",
      );

      // Clear all authentication data
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();
      } catch (error) {
        console.error("Failed to clear storage:", error);
      }

      // Redirect to login with a message
      setTimeout(() => {
        router.push("/?message=password_changed");
      }, 2000);
    } catch (err: any) {
      console.error("Password update error:", err);

      // Handle specific error messages from RTK Query
      let errorMessage = "Failed to update password";

      if (err && "data" in err) {
        errorMessage = (err as any).data?.message || errorMessage;
      } else if (err && "error" in err) {
        errorMessage = (err as any).error?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      if (errorMessage.includes("history") || errorMessage.includes("reuse")) {
        toast.error(
          "You cannot reuse a previous password. Please choose a different one.",
        );
      } else if (errorMessage.includes("validation")) {
        toast.error("Password does not meet security requirements.");
        setShowPasswordRequirements(true);
      } else if (errorMessage.includes("current password")) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const passwordValidation = validatePassword(newPassword);
    return (
      currentPassword.length > 0 &&
      newPassword.length > 0 &&
      newPasswordConfirm.length > 0 &&
      newPassword === newPasswordConfirm &&
      currentPassword !== newPassword &&
      passwordValidation.isValid
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Change Password
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Please enter your current password and choose a new secure
              password
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter current password"
                data-tour="old-password"
              />
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (e.target.value.length > 0) {
                    setShowPasswordRequirements(true);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
                data-tour="new-password"
              />
            </div>

            {/* Password Strength Meter */}
            {showPasswordRequirements && (
              <div className="mt-2">
                <PasswordStrengthMeter
                  password={newPassword}
                  userInfo={userInfo}
                  showDetails={true}
                />
              </div>
            )}

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="newPasswordConfirm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="newPasswordConfirm"
                type="password"
                required
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                <p className="text-red-500 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Security Notice
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Password must be at least 12 characters long</li>
                      <li>
                        Include uppercase, lowercase, numbers, and special
                        characters
                      </li>
                      <li>You cannot reuse previous passwords</li>
                      <li>
                        All sessions will be logged out after password change
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error && "data" in error
                      ? (error as any).data?.message
                      : error && "error" in error
                        ? (error as any).error?.message
                        : "An error occurred while updating your password."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
