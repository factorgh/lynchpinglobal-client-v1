"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Modal } from "antd";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { useSignupMutation } from "@/services/auth";
import { useAuth } from "@/context/authContext";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    userName: "",
    displayName: "",
    terms: "",
  });

  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();
  const { setRoles, setUser, setToken } = useAuth();

  const validateEmail = (value: string) => {
    if (!value) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email format.";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    if (value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(value))
      return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(value))
      return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(value))
      return "Password must contain at least one number.";
    if (!/[@$!%*?&]/.test(value))
      return "Password must contain at least one special character.";
    return "";
  };

  const validatePasswordConfirm = (value: string) => {
    if (value !== password) return "Passwords do not match.";
    return "";
  };

  const validateUserName = (value: string) => {
    if (!value) return "Username is required.";
    return "";
  };

  const validateDisplayName = (value: string) => {
    if (!value) return "Display Name is required.";
    return "";
  };

  const validateTerms = (value: boolean) => {
    if (!value) {
      return "You must confirm that all submissions are accurate and agree to the Terms and Conditions.";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const passwordConfirmError = validatePasswordConfirm(passwordConfirm);
    const userNameError = validateUserName(userName);
    const displayNameError = validateDisplayName(displayName);
    const termsError = validateTerms(agreedToTerms);

    if (
      emailError ||
      passwordError ||
      passwordConfirmError ||
      userNameError ||
      displayNameError ||
      termsError
    ) {
      setErrors({
        email: emailError,
        password: passwordError,
        passwordConfirm: passwordConfirmError,
        userName: userNameError,
        displayName: displayNameError,
        terms: termsError,
      });
      return;
    }

    try {
      const response = await signup({
        email,
        password,
        name: userName,
        displayName,
        passwordConfirm,
        agreedToTerms: true,
      }).unwrap();

      const { token, data } = response;
      const user = data.user;

      setToken(token);
      setUser(user);
      setRoles(user.role);

      toast.success("Registration successful");
      router.replace(user.role === "admin" ? "/dashboard" : "/landing");
    } catch (err: any) {
      console.error("Registration failed:", err);
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center py-10 px-4"
      style={{ backgroundImage: "url(/p4.jpeg)" }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 w-full max-w-md bg-gray-50 shadow-lg rounded-lg p-8 my-auto">
        <img src="/lynch.png" alt="Logo" className="w-32 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6" data-tour="register-policy">
          Register to Lynchpin Global
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" data-tour="register-form">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  displayName: validateDisplayName(e.target.value),
                }));
              }}
              placeholder="Enter your display name"
              required
              className={`w-full px-4 py-2 border bg-white ${
                errors.displayName ? "border-red-500" : "border-gray-300"
              } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                errors.displayName
                  ? "focus:ring-red-500"
                  : "focus:ring-blue-500"
              }`}
              disabled={isLoading}
            />
            {errors.displayName && (
              <p className="text-red-500 text-sm">{errors.displayName}</p>
            )}
          </div>
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  userName: validateUserName(e.target.value),
                }));
              }}
              placeholder="Enter your username"
              required
              className={`w-full px-4 py-2 border bg-white ${
                errors.userName ? "border-red-500" : "border-gray-300"
              } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                errors.userName ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              disabled={isLoading}
            />
            {errors.userName && (
              <p className="text-red-500 text-sm">{errors.userName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  email: validateEmail(e.target.value),
                }));
              }}
              placeholder="Enter your email"
              required
              className={`w-full px-4 py-2 border bg-white ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                errors.email ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Password */}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: validatePassword(e.target.value),
                  }));
                }}
                placeholder="Enter your password"
                required
                className={`w-full px-4 py-2 pr-20 border bg-white ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
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
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    passwordConfirm: validatePasswordConfirm(e.target.value),
                  }));
                }}
                placeholder="Confirm your password"
                required
                className={`w-full px-4 py-2 pr-20 border bg-white ${
                  errors.passwordConfirm
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors.passwordConfirm
                    ? "focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-sm text-blue-600 hover:underline"
                aria-label={
                  showPasswordConfirm ? "Hide confirm password" : "Show confirm password"
                }
              >
                {showPasswordConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {errors.passwordConfirm && (
              <p className="text-red-500 text-sm">{errors.passwordConfirm}</p>
            )}
          </div>

          {/* Confirm Submissions & Terms and Conditions Checkbox */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              errors.terms
                ? "border-red-400 bg-red-50/70"
                : agreedToTerms
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-gray-200 bg-white/80"
            }`}
            data-tour="register-terms"
          >
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                id="agreedToTerms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAgreedToTerms(checked);
                  setErrors((prev) => ({
                    ...prev,
                    terms: validateTerms(checked),
                  }));
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                disabled={isLoading}
              />
              <span className="text-xs text-gray-700 leading-relaxed font-normal">
                I confirm that all submissions and details provided are accurate, and I agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsModalVisible(true);
                  }}
                  className="text-blue-600 font-semibold underline hover:text-blue-700 focus:outline-none"
                >
                  Terms and Conditions
                </button>{" "}
                of the company.
              </span>
            </label>
            {errors.terms && (
              <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                <span>•</span> {errors.terms}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 text-white font-medium rounded-lg shadow-md transition-colors ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
            }`}
            data-tour="register-submit"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/"
              className="text-blue-500 hover:underline font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Company Terms & Conditions
              </h3>
              <p className="text-xs text-gray-500 font-normal">
                Lynchpin Global Client Participation & Submission Agreement
              </p>
            </div>
          </div>
        }
        open={termsModalVisible}
        onCancel={() => setTermsModalVisible(false)}
        width={620}
        footer={
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Please review before completing registration.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTermsModalVisible(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setErrors((prev) => ({ ...prev, terms: "" }));
                  setTermsModalVisible(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                I Agree & Confirm
              </button>
            </div>
          </div>
        }
        className="rounded-2xl"
      >
        <div className="py-2 text-xs text-gray-600 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
            <p className="font-semibold text-blue-900 text-xs">
              Submission Authenticity & Accuracy Declaration
            </p>
            <p className="mt-1 text-blue-800 text-[11px] leading-relaxed">
              By submitting this registration and checking the confirmation box, you legally certify that all information, identification details, credentials, and representations provided are accurate, valid, and belong to you. Misrepresentation or false submissions may result in immediate suspension, invalidation of mandate facilities, and legal recourse.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-gray-800 text-xs mb-1">
                1. Acceptance of Terms & Company Policies
              </h4>
              <p className="leading-relaxed text-[11px]">
                Access to and use of Lynchpin Global’s portfolio management platform, client accounts, mandate services, and transactions is governed strictly by these Terms and Conditions. By creating an account, you agree to be bound by these provisions, applicable rate rules, and internal operational guidelines.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 text-xs mb-1">
                2. Mandate Operations & Financial Participations
              </h4>
              <p className="leading-relaxed text-[11px]">
                All client mandate contributions, allocations, quarterly rollovers, disbursements, and yields are subject to established portfolio agreements, management fees, operational cost deductions, and scheduled quarterly closures. Official ledger statements and certificates serve as the binding records for transactions.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 text-xs mb-1">
                3. Client Confidentiality & Data Security
              </h4>
              <p className="leading-relaxed text-[11px]">
                Lynchpin Global implements strict encryption, credential hashing, and security standards to protect your personal and financial information. We do not sell or disclose your records to unauthorized third parties, except as required by lawful authorities.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 text-xs mb-1">
                4. Compliance with Regulatory & Financial Standards
              </h4>
              <p className="leading-relaxed text-[11px]">
                Users agree to comply with Know Your Customer (KYC) requirements and certify that all funds, contributions, and transactions originate from lawful, verifiable sources in full compliance with domestic and international financial regulations.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterForm;
