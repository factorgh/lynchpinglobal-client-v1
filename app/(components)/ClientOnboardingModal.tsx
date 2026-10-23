"use client";

import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Checkbox } from "antd";
import { ShieldCheck, User, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { LockOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

export default function ClientOnboardingModal() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"terms" | "password">("terms");

  // Step 1: Terms states
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);
  const [isSubmittingTerms, setIsSubmittingTerms] = useState(false);

  // Step 2: Credentials & Profile states
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const refreshUser = () => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setUsername(parsed.name || "");
        setDisplayName(parsed.displayName || parsed.name || "");

        // Only clients (role === 'user') need forced onboarding & password change
        if (parsed.role === "user") {
          const needsTerms = !parsed.agreedToTerms;
          const needsPassword = parsed.mustChangePassword === true;

          if (needsTerms) {
            setCurrentStep("terms");
            setIsOpen(true);
          } else if (needsPassword) {
            setCurrentStep("password");
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        } else {
          setIsOpen(false);
        }
      }
    } catch (e) {
      console.error("[ClientOnboardingModal] Error loading user:", e);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const getAuthToken = () => {
    try {
      const token = localStorage.getItem("token");
      return token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "";
    } catch {
      return "";
    }
  };

  // Handle Step 1 Submission: Accept Terms
  const handleAcceptTerms = async () => {
    if (!agreedTerms || !completedOnboarding) {
      toast.error("Please acknowledge both checkboxes to complete onboarding");
      return;
    }

    try {
      setIsSubmittingTerms(true);
      const res = await fetch("/api/v1/users/updateMe", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthToken(),
        },
        body: JSON.stringify({
          agreedToTerms: true,
          agreedToTermsAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to record terms agreement");
      }

      const updatedUser = {
        ...user,
        agreedToTerms: true,
        agreedToTermsAt: new Date().toISOString(),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Terms & Conditions accepted successfully");

      // Advance to Step 2 if temporary password still needs changing
      if (updatedUser.mustChangePassword) {
        setCurrentStep("password");
      } else {
        setIsOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to accept terms");
    } finally {
      setIsSubmittingTerms(false);
    }
  };

  // Handle Step 2 Submission: Change Temporary Password & Profile Details
  const handleUpdatePasswordAndProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!username.trim()) {
      setPasswordError("Username is required");
      return;
    }
    if (!displayName.trim()) {
      setPasswordError("Display Name is required");
      return;
    }
    if (!currentPassword) {
      setPasswordError("Please enter your current temporary password");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password cannot be the same as temporary password");
      return;
    }

    try {
      setIsSubmittingPassword(true);

      // 1. Update password
      const pwdRes = await fetch("/api/v1/auth/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthToken(),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm: confirmPassword,
        }),
      });

      const pwdData = await pwdRes.json();
      if (!pwdRes.ok) {
        throw new Error(pwdData.message || "Failed to update temporary password");
      }

      // 2. Update profile (name, displayName, mustChangePassword = false)
      const profRes = await fetch("/api/v1/users/updateMe", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthToken(),
        },
        body: JSON.stringify({
          name: username.trim(),
          displayName: displayName.trim(),
          mustChangePassword: false,
        }),
      });

      const profData = await profRes.json();
      if (!profRes.ok) {
        throw new Error(profData.message || "Failed to update profile details");
      }

      const finalizedUser = {
        ...user,
        name: username.trim(),
        displayName: displayName.trim(),
        mustChangePassword: false,
      };

      localStorage.setItem("user", JSON.stringify(finalizedUser));
      setUser(finalizedUser);
      setIsOpen(false);
      toast.success("Account successfully activated! Welcome to your Portfolio.");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update credentials");
      toast.error(err.message || "Failed to update credentials");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      closable={false}
      maskClosable={false}
      footer={null}
      width={540}
      centered
      className="backdrop-blur-xs"
    >
      <div className="py-2 select-none">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              {currentStep === "terms" ? (
                <FileText className="w-5 h-5 text-emerald-200" />
              ) : (
                <LockOutlined className="text-lg text-emerald-200" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {currentStep === "terms"
                  ? "Client Onboarding & Mandate Governance"
                  : "Account & Profile Preferences"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Step {currentStep === "terms" ? "1 of 2" : "2 of 2"}:{" "}
                {currentStep === "terms"
                  ? "Accept Terms & Conditions"
                  : "Replace Temporary Password"}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            Mandatory
          </span>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: TERMS & CONDITIONS */}
        {/* ======================================================== */}
        {currentStep === "terms" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-h-56 overflow-y-auto space-y-3 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Lynchpin Global Mandate & Fiduciary Agreement
              </h4>
              <p>
                As a registered client with active or prospective capital mandates, your portfolio is governed under Lynchpin Global institutional asset management standards.
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-700 font-medium">
                <li>
                  <strong>Capital Protection:</strong> All principal mandates are deployed in asset-backed energy, commodity, and high-yield infrastructure positions.
                </li>
                <li>
                  <strong>Quarterly Compounding:</strong> Contractual returns accrue daily and disburse according to designated quarterly mandate schedules (Q1, Q2, Q3, Q4).
                </li>
                <li>
                  <strong>Disbursements:</strong> Principal adjustments and profit liquidations are processed upon formal request subject to contractual notice.
                </li>
                <li>
                  <strong>Account & Access:</strong> Clients must maintain confidentiality of their access credentials and comply with KYC/AML protocols.
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <Checkbox
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="text-xs font-semibold text-slate-800"
              >
                I have read, understood, and accept the Lynchpin Global Mandate Terms & Conditions.
              </Checkbox>

              <Checkbox
                checked={completedOnboarding}
                onChange={(e) => setCompletedOnboarding(e.target.checked)}
                className="text-xs font-semibold text-slate-800"
              >
                I confirm the completion of my initial onboarding verification process.
              </Checkbox>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="primary"
                onClick={handleAcceptTerms}
                loading={isSubmittingTerms}
                disabled={!agreedTerms || !completedOnboarding}
                className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-5 py-2 font-bold text-xs shadow-sm disabled:opacity-50"
              >
                Accept & Proceed to Password Setup
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: PASSWORD CHANGE & PROFILE PREFERENCES */}
        {/* ======================================================== */}
        {currentStep === "password" && (
          <form onSubmit={handleUpdatePasswordAndProfile} className="space-y-4">
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                You are currently logged in using a <strong>temporary password</strong>. For account protection, you must establish a permanent password and verify your username and display name.
              </span>
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                {passwordError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john_mensah"
                  className="rounded-lg py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Mensah"
                  className="rounded-lg py-2 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Temporary Password
              </label>
              <Input.Password
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="rounded-lg py-2 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Permanent Password
                </label>
                <Input.Password
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="rounded-lg py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Permanent Password
                </label>
                <Input.Password
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="rounded-lg py-2 text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Lynchpin Global Protection Standard
              </span>

              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmittingPassword}
                className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-5 py-2 font-bold text-xs shadow-sm"
              >
                Save Preferences & Enter Portal
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
