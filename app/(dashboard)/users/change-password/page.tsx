"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUpdatePasswordMutation } from "@/services/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Wrapper from "../../wealth/_components/wapper";
import ProfileImageUpload from "@/app/(components)/ProfileUpload/ProfileImageUpload";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import {
  LockOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile Form States
  const [profileName, setProfileName] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

  // Load user info from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserInfo(parsed);
        setProfileName(parsed.name || "");
        setProfileDisplayName(parsed.displayName || parsed.name || "");
        setProfilePhone(parsed.phone || "");
        setProfilePhoto(parsed.photo || null);
      }
    } catch (error) {
      console.error("Failed to load user info:", error);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!profileDisplayName.trim()) {
      toast.error("Display Name is required");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const authHeader = token
        ? token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`
        : "";

      const res = await fetch("/api/v1/users/updateMe", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          name: profileName.trim(),
          displayName: profileDisplayName.trim(),
          phone: profilePhone.trim() || undefined,
          photo: profilePhoto || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update profile");
      }

      const updated = {
        ...userInfo,
        name: profileName.trim(),
        displayName: profileDisplayName.trim(),
        phone: profilePhone.trim(),
        photo: profilePhoto,
      };

      localStorage.setItem("user", JSON.stringify(updated));
      setUserInfo(updated);
      window.dispatchEvent(new Event("user-profile-updated"));
      toast.success("Profile information and photo updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Validation checks
  const checks = useMemo(() => {
    const hasMinLength = newPassword.length >= 12;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    // Personal info checks
    let hasNoPersonalInfo = true;
    if (userInfo && newPassword) {
      const userEmail = (userInfo.email || "").toLowerCase();
      const userName = (userInfo.name || "").toLowerCase();
      const displayName = (userInfo.displayName || "").toLowerCase();
      const lower = newPassword.toLowerCase();

      if (userEmail && userEmail.includes("@")) {
        const prefix = userEmail.split("@")[0];
        if (prefix.length >= 3 && lower.includes(prefix)) {
          hasNoPersonalInfo = false;
        }
      }
      if (userName && userName.length >= 3 && lower.includes(userName)) {
        hasNoPersonalInfo = false;
      }
      if (displayName && displayName.length >= 3 && lower.includes(displayName)) {
        hasNoPersonalInfo = false;
      }
    }

    const isDifferentFromCurrent =
      !currentPassword || !newPassword || currentPassword !== newPassword;
    const passwordsMatch =
      newPassword.length > 0 &&
      newPasswordConfirm.length > 0 &&
      newPassword === newPasswordConfirm;

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      hasNoPersonalInfo,
      isDifferentFromCurrent,
      passwordsMatch,
    };
  }, [newPassword, newPasswordConfirm, currentPassword, userInfo]);

  // Strength score
  const strength = useMemo(() => {
    if (!newPassword) {
      return { score: 0, label: "Enter Password", color: "bg-slate-200", text: "text-slate-400" };
    }

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (checks.hasMinLength) score += 1;
    if (checks.hasUpper && checks.hasLower) score += 1;
    if (checks.hasNumber) score += 1;
    if (checks.hasSpecial) score += 1;
    if (newPassword.length >= 16) score += 1;

    if (score <= 2) {
      return { score: 25, label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
    } else if (score === 3 || score === 4) {
      return { score: 55, label: "Fair", color: "bg-amber-500", text: "text-amber-600" };
    } else if (score === 5) {
      return { score: 80, label: "Good", color: "bg-teal-500", text: "text-teal-600" };
    } else {
      return { score: 100, label: "Excellent", color: "bg-emerald-600", text: "text-emerald-700" };
    }
  }, [newPassword, checks]);

  const isFormValid =
    currentPassword.length > 0 &&
    checks.hasMinLength &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasNumber &&
    checks.hasSpecial &&
    checks.hasNoPersonalInfo &&
    checks.isDifferentFromCurrent &&
    checks.passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checks.hasMinLength) {
      toast.error("Password must be at least 12 characters long");
      return;
    }
    if (!checks.hasUpper || !checks.hasLower) {
      toast.error("Password must contain both uppercase and lowercase letters");
      return;
    }
    if (!checks.hasNumber) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (!checks.hasSpecial) {
      toast.error("Password must contain at least one special character");
      return;
    }
    if (!checks.hasNoPersonalInfo) {
      toast.error("Password cannot contain your personal name or email prefix");
      return;
    }
    if (!checks.isDifferentFromCurrent) {
      toast.error("New password must be different from your current password");
      return;
    }
    if (!checks.passwordsMatch) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await updatePassword({
        data: {
          currentPassword,
          newPassword,
          newPasswordConfirm,
        },
      }).unwrap();

      toast.success("Password updated successfully! Please log in again.");
      localStorage.clear();
      router.push("/");
    } catch (err: any) {
      let errorMessage = "Failed to update password";

      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      if (errorMessage.includes("history") || errorMessage.includes("reuse")) {
        toast.error("You cannot reuse a previous password. Please choose a different one.");
      } else if (errorMessage.includes("current password")) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const userInitials = (userInfo?.displayName || userInfo?.name || "LG")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "LG";

  return (
    <Wrapper>
      {/* Top Header & Breadcrumbs */}
      <div className="pt-4 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <Link
                href="/landing"
                className="hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-slate-400">Account</span>
              <span>/</span>
              <span className="text-emerald-700 font-bold">Security & Password</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
                <LockOutlined className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Security & Password Settings
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your master portal credentials and cryptographic account protection
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloudflare AES-256</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl">
        {/* Left: Primary Password Change Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            {/* Tab navigation: Profile vs Password */}
            <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <UserOutlined className="text-xs" />
                <span>Profile & Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "password"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LockOutlined className="text-xs" />
                <span>Password & Security</span>
              </button>
            </div>

            {/* TAB 1: PROFILE INFORMATION & PICTURE */}
            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Profile Picture / Avatar
                  </label>
                  <ProfileImageUpload
                    value={profilePhoto}
                    onChange={(url) => setProfilePhoto(url)}
                    initialsFallback={userInitials}
                    label="Click or Drag photo to update profile picture"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Uploaded photos are securely stored in Cloudflare R2 and synced across your portal session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserOutlined className="text-slate-400 text-sm" />
                      </div>
                      <input
                        type="text"
                        required
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Shown on your top navbar badge and greetings
                    </span>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <IdcardOutlined className="text-slate-400 text-sm" />
                      </div>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. jdoe"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Primary Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MailOutlined className="text-slate-400 text-sm" />
                      </div>
                      <input
                        type="email"
                        disabled
                        value={userInfo?.email || ""}
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Contact administrator to modify primary email
                    </span>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <PhoneOutlined className="text-slate-400 text-sm" />
                      </div>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="e.g. +233 24 000 0000"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <SaveOutlined className="text-xs" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PASSWORD & SECURITY */}
            {activeTab === "password" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Master Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockOutlined className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-12 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeInvisibleOutlined className="text-slate-400 text-sm" />
                    ) : (
                      <EyeOutlined className="text-slate-400 text-sm" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    New Master Password <span className="text-rose-500">*</span>
                  </label>
                  {newPassword && (
                    <span className={`text-[11px] font-bold ${strength.text}`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyOutlined className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter secure new password"
                    className="w-full pl-10 pr-12 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeInvisibleOutlined className="text-slate-400 text-sm" />
                    ) : (
                      <EyeOutlined className="text-slate-400 text-sm" />
                    )}
                  </button>
                </div>

                {/* Password Strength Meter Bar */}
                {newPassword && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockOutlined className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Re-enter new password to verify"
                    className={`w-full pl-10 pr-12 py-2.5 text-xs bg-slate-50/60 border rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none transition-all font-medium ${
                      newPasswordConfirm && !checks.passwordsMatch
                        ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                        : newPasswordConfirm && checks.passwordsMatch
                        ? "border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeInvisibleOutlined className="text-slate-400 text-sm" />
                    ) : (
                      <EyeOutlined className="text-slate-400 text-sm" />
                    )}
                  </button>
                </div>

                {/* Match indicator pill */}
                {newPasswordConfirm && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {checks.passwordsMatch ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Real-time Security Checklist */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password Requirements
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-2 ${
                      checks.hasMinLength ? "text-emerald-700 font-semibold" : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checks.hasMinLength ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>At least 12 characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 ${
                      checks.hasUpper && checks.hasLower
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checks.hasUpper && checks.hasLower ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Upper & lowercase letters</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 ${
                      checks.hasNumber ? "text-emerald-700 font-semibold" : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checks.hasNumber ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>At least one number (0-9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 ${
                      checks.hasSpecial ? "text-emerald-700 font-semibold" : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checks.hasSpecial ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>One special character (!@#$)</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 ${
                      checks.hasNoPersonalInfo ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checks.hasNoPersonalInfo ? "text-emerald-600" : "text-rose-500"
                      }`}
                    />
                    <span>No personal name or email prefix</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 ${
                      checks.isDifferentFromCurrent
                        ? "text-emerald-700 font-semibold"
                        : "text-rose-600 font-semibold"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checks.isDifferentFromCurrent ? "text-emerald-600" : "text-rose-500"
                      }`}
                    />
                    <span>Different from current password</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <Link
                  href="/landing"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                    isLoading || !isFormValid
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20 cursor-pointer"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>

        {/* Right: Security Advisory & Account Protection */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Session Revocation Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm">
                Session Revocation Notice
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Upon successful password update, all active browser sessions and API refresh tokens across all devices will be automatically revoked.
            </p>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2">
              <SafetyCertificateOutlined className="text-emerald-400 text-sm shrink-0 mt-0.5" />
              <span>
                You will be immediately redirected to the login portal to authenticate with your newly configured master credentials.
              </span>
            </div>
          </div>

          {/* Security Best Practices Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Security Mandates</span>
            </h4>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Anti-Reuse Policy:</strong> You cannot reuse your previous 3 passwords.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Complexity:</strong> Must contain uppercase, lowercase, numbers, and symbols.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Password Managers:</strong> We recommend 1Password, Bitwarden, or Apple Keychain.
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Support / Need Help Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">Need Security Assistance?</p>
              <p className="text-[11px] text-slate-500">Contact Lynchpin Global security team (info@lynchpinglobal.com)</p>
            </div>
            <a
              href="mailto:info@lynchpinglobal.com"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
            >
              Contact Support
            </a>
          </div>

        </div>
      </div>
    </Wrapper>
  );
}

