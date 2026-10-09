"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Compass,
  ArrowLeftRight,
  Banknote,
  ArrowUpRight,
  Users,
  Activity,
  FileUp,
  Handshake,
  Wallet,
  X,
  ChevronRight,
} from "lucide-react";
import { useGetAllInvestmentsQuery, useGetUserInvestmentsQuery } from "@/services/investment";
import { useGetAllAssetssQuery, useGetUserAssetsQuery } from "@/services/assets";
import { useGetLoansQuery } from "@/services/loan";
import { useGetAllUsersQuery } from "@/services/users";
import { useGetWithdrawalsQuery } from "@/services/withdrawals";
import { formatPriceGHS } from "@/lib/helper";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Page" | "Mandate" | "Asset" | "Loan" | "Disbursement" | "User";
  href: string;
  icon: any;
  color?: string;
}

export const GlobalSearch: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Get user role from localStorage
  const [userRole, setUserRole] = useState<string>("user");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u?.role || "user");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isAdmin = userRole === "admin" || userRole === "superadmin";

  // Data queries
  const { data: adminInvestments } = useGetAllInvestmentsQuery(null, { skip: !isAdmin });
  const { data: clientInvestments } = useGetUserInvestmentsQuery(null, { skip: isAdmin });
  const { data: adminAssets } = useGetAllAssetssQuery(null, { skip: !isAdmin });
  const { data: clientAssets } = useGetUserAssetsQuery(null, { skip: isAdmin });
  const { data: loansData } = useGetLoansQuery(null, { skip: !isAdmin });
  const { data: usersData } = useGetAllUsersQuery(null, { skip: !isAdmin });
  const { data: withdrawalsData } = useGetWithdrawalsQuery(null, { skip: !isAdmin });

  // 1. Navigation Pages
  const navigationPages: SearchResultItem[] = useMemo(() => {
    if (isAdmin) {
      return [
        {
          id: "page-dashboard",
          title: "Dashboard Overview",
          subtitle: "Admin executive portfolio statistics & summaries",
          category: "Page",
          href: "/dashboard",
          icon: LayoutDashboard,
          color: "text-blue-600 bg-blue-50",
        },
        {
          id: "page-mandates",
          title: "Mandate Management",
          subtitle: "View and manage all active client mandates & contributions",
          category: "Page",
          href: "/wealth",
          icon: Compass,
          color: "text-purple-600 bg-purple-50",
        },
        {
          id: "page-assets",
          title: "Asset Transactions",
          subtitle: "Track registered asset transactions, classes, and quarters",
          category: "Page",
          href: "/assets",
          icon: ArrowLeftRight,
          color: "text-emerald-600 bg-emerald-50",
        },
        {
          id: "page-rentals",
          title: "Loans & Rentals",
          subtitle: "Manage client loan facilities and asset rental agreements",
          category: "Page",
          href: "/rentals",
          icon: Banknote,
          color: "text-amber-600 bg-amber-50",
        },
        {
          id: "page-cashout",
          title: "Disbursements & Withdrawals",
          subtitle: "Review outgoing payments and client disbursement requests",
          category: "Page",
          href: "/cashout",
          icon: ArrowUpRight,
          color: "text-rose-600 bg-rose-50",
        },
        {
          id: "page-users",
          title: "User Management",
          subtitle: "Client accounts, system administrators, and staff licenses",
          category: "Page",
          href: "/users",
          icon: Users,
          color: "text-indigo-600 bg-indigo-50",
        },
        {
          id: "page-activity",
          title: "Activity Log",
          subtitle: "System audit trails, operations, and transaction logs",
          category: "Page",
          href: "/activity",
          icon: Activity,
          color: "text-slate-600 bg-slate-100",
        },
        {
          id: "page-conditions",
          title: "Terms & Conditions Uploader",
          subtitle: "Upload and publish agreements, terms, and conditions",
          category: "Page",
          href: "/conditions",
          icon: FileUp,
          color: "text-cyan-600 bg-cyan-50",
        },
      ];
    } else {
      return [
        {
          id: "page-landing",
          title: "Client Dashboard",
          subtitle: "Portfolio summary, End-Of-Quarter Reports, and countdowns",
          category: "Page",
          href: "/landing",
          icon: LayoutDashboard,
          color: "text-blue-600 bg-blue-50",
        },
        {
          id: "page-portfolio",
          title: "My Mandates & Portfolio",
          subtitle: "Participations, loans, asset transactions, and rentals",
          category: "Page",
          href: "/portfolio",
          icon: Compass,
          color: "text-purple-600 bg-purple-50",
        },
        {
          id: "page-withdrawal",
          title: "Disbursements & Requests",
          subtitle: "Request mandate disbursements and check payment history",
          category: "Page",
          href: "/withdrawal",
          icon: Wallet,
          color: "text-emerald-600 bg-emerald-50",
        },
        {
          id: "page-terms",
          title: "Terms & Conditions",
          subtitle: "Review legal terms, guidelines, and partner agreements",
          category: "Page",
          href: "/terms",
          icon: Handshake,
          color: "text-slate-600 bg-slate-100",
        },
      ];
    }
  }, [isAdmin]);

  // 2. Mandates / Investments
  const mandateResults: SearchResultItem[] = useMemo(() => {
    const rawList = isAdmin
      ? adminInvestments?.data || []
      : clientInvestments?.data || [];
    return rawList.map((m: any) => ({
      id: `mandate-${m._id || m.id || m.key}`,
      title: m.name || "Client Mandate",
      subtitle: `Mandate • ${formatPriceGHS(m.principal || 0)}${m.quarter ? ` • ${m.quarter}` : ""}`,
      category: "Mandate" as const,
      href: isAdmin ? "/wealth" : "/portfolio",
      icon: Compass,
      color: "text-purple-600 bg-purple-50",
    }));
  }, [isAdmin, adminInvestments, clientInvestments]);

  // 3. Asset Transactions
  const assetResults: SearchResultItem[] = useMemo(() => {
    const rawList = isAdmin
      ? adminAssets?.data?.data || []
      : clientAssets?.data?.data || [];
    return rawList.map((a: any) => ({
      id: `asset-${a._id || a.key}`,
      title: a.assetName || "Asset Transaction",
      subtitle: `Asset • ${a.assetClass || "General"}${a.quater ? ` • ${a.quater}` : ""}`,
      category: "Asset" as const,
      href: isAdmin ? "/assets" : "/portfolio",
      icon: ArrowLeftRight,
      color: "text-emerald-600 bg-emerald-50",
    }));
  }, [isAdmin, adminAssets, clientAssets]);

  // 4. Loans & Rentals (Admin only)
  const loanResults: SearchResultItem[] = useMemo(() => {
    if (!isAdmin) return [];
    const rawList = loansData?.data?.data || [];
    return rawList.map((l: any) => ({
      id: `loan-${l._id || l.key}`,
      title: l.externalName || (l.user ? (typeof l.user === "object" ? l.user.name : l.user) : "Loan Facility"),
      subtitle: `Loan Facility • ${formatPriceGHS(l.loanAmount || 0)}${l.isExternal ? " • Non-Client" : ""}`,
      category: "Loan" as const,
      href: "/rentals",
      icon: Banknote,
      color: "text-amber-600 bg-amber-50",
    }));
  }, [isAdmin, loansData]);

  // 5. Users (Admin only)
  const userResults: SearchResultItem[] = useMemo(() => {
    if (!isAdmin) return [];
    const rawList = usersData?.allUsers || [];
    return rawList.map((u: any) => ({
      id: `user-${u._id}`,
      title: u.name || "Unnamed User",
      subtitle: `${u.email || "No email"}${u.role ? ` • ${u.role}` : ""}${u.license ? ` • ${u.license}` : ""}`,
      category: "User" as const,
      href: "/users",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50",
    }));
  }, [isAdmin, usersData]);

  // 6. Disbursements (Admin only)
  const disbursementResults: SearchResultItem[] = useMemo(() => {
    if (!isAdmin) return [];
    const rawList = withdrawalsData?.data?.data || [];
    return rawList.map((w: any) => {
      const uName = typeof w.user === "object" && w.user ? (w.user.name || w.user.displayName) : (w.user || "Client");
      return {
        id: `disbursement-${w._id || w.id}`,
        title: `Disbursement: ${uName}`,
        subtitle: `${formatPriceGHS(w.amount || 0)} • Status: ${w.status || "Pending"}`,
        category: "Disbursement" as const,
        href: "/cashout",
        icon: ArrowUpRight,
        color: "text-rose-600 bg-rose-50",
      };
    });
  }, [isAdmin, withdrawalsData]);

  // Aggregate and filter results based on query & category
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    const allItems: SearchResultItem[] = [
      ...navigationPages,
      ...mandateResults,
      ...assetResults,
      ...loanResults,
      ...userResults,
      ...disbursementResults,
    ];

    return allItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return item.category === "Page"; // If no query, show pages as suggestions

      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || "").toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);

      return matchTitle || matchSubtitle || matchCategory;
    });
  }, [
    query,
    selectedCategory,
    navigationPages,
    mandateResults,
    assetResults,
    loanResults,
    userResults,
    disbursementResults,
  ]);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to open, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Reset active index when query or category changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, selectedCategory]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedCategory("All");
    }
  }, [isOpen]);

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[activeIndex]) {
        handleSelect(filteredResults[activeIndex]);
      }
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    router.push(item.href);
  };

  const categories = isAdmin
    ? ["All", "Page", "Mandate", "Asset", "Loan", "User", "Disbursement"]
    : ["All", "Page", "Mandate", "Asset"];

  return (
    <>
      {/* Search Input Trigger in Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full max-w-[190px] sm:max-w-[240px] md:max-w-[300px] px-3.5 py-2 bg-white/95 hover:bg-white text-xs text-slate-500 rounded-xl border border-slate-200/90 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs group cursor-pointer"
        title="Search anything (⌘K)"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          <span className="truncate text-slate-400 group-hover:text-slate-600">
            Search anything...
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Global Search Dialog Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 md:pt-20 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Top Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mandates, assets, loans, users, or pages..."
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-medium px-2 py-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Filter Category Chips */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 overflow-x-auto no-scrollbar bg-white">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat === "All" ? "All Results" : `${cat}s`}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50 space-y-0.5"
            >
              {filteredResults.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    No results found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn't find any items matching &ldquo;{query}&rdquo;.
                    Try searching by mandate name, borrower, asset, or page name.
                  </p>
                </div>
              ) : (
                <>
                  {!query && (
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Navigation
                    </div>
                  )}
                  {filteredResults.map((item, index) => {
                    const isSelected = index === activeIndex;
                    const Icon = item.icon || Compass;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-950"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              item.color || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {item.title}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  item.category === "Page"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.category === "Mandate"
                                    ? "bg-purple-100 text-purple-800"
                                    : item.category === "Asset"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.category === "Loan"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.category === "User"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {item.category}
                              </span>
                            </div>
                            {item.subtitle && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pl-3 shrink-0">
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-emerald-700 hidden sm:inline">
                              Press ↵
                            </span>
                          )}
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected
                                ? "text-emerald-700 translate-x-0.5"
                                : "text-slate-300"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Bottom Keyboard Shortcuts Helper */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">
                    ↓
                  </kbd>{" "}
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">
                    ↵
                  </kbd>{" "}
                  to select
                </span>
              </div>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">
                  esc
                </kbd>{" "}
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
