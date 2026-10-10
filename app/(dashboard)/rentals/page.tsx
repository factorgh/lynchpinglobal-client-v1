"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming this is your custom Tab component
import Wrapper from "../wealth/_components/wapper";
import LoanForm from "./_components/loan-form";
import LoanTable from "./_components/Loan-table";
import NonClientLoanForm from "./_components/non-client-loan-form";
import NonClientLoanTable from "./_components/non-client-loan-table";
import RentalForm from "./_components/rental-form";
import RentalTable from "./_components/rental-table";

const Rentals = () => {
  return (
    <Wrapper>
      <div className="py-5 select-none text-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            Loans & Rentals
          </h1>
          <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
            Manage credit facilities, client lending, and equipment rental agreements
          </p>
        </div>

        {/* Custom Tabs using your UI library */}
        <Tabs defaultValue="loan" data-tour="rentals-tabs">
          {/* Tab List */}
          <TabsList className="mb-6" data-tour="rentals-tab-list">
            <TabsTrigger value="loan">Loan Management</TabsTrigger>
            <TabsTrigger value="rentals">Asset Rentals</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="loan">
            <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Loan Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage loan facilities for registered clients and external borrowers
                  </p>
                </div>
              </div>
              <Tabs defaultValue="existing" className="mt-2">
                <TabsList className="mb-4">
                  <TabsTrigger value="existing">Existing Clients</TabsTrigger>
                  <TabsTrigger value="external">Non Clients</TabsTrigger>
                </TabsList>

                <TabsContent value="existing">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3" data-tour="loan-header">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">
                        Existing Clients
                      </h2>
                      <p className="text-slate-500 text-xs">
                        Loans for registered clients
                      </p>
                    </div>
                    <span data-tour="loan-form" className="self-start sm:self-auto">
                      <LoanForm />
                    </span>
                  </div>
                  <div data-tour="loan-list">
                    <LoanTable external={false} />
                  </div>
                </TabsContent>

                <TabsContent value="external">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">
                        Non Clients
                      </h2>
                      <p className="text-slate-500 text-xs">
                        Quick capture for non-registered clients
                      </p>
                    </div>
                    <div className="self-start sm:self-auto">
                      <NonClientLoanForm />
                    </div>
                  </div>
                  <NonClientLoanTable />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="rentals">
            <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4" data-tour="rental-header">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Rentals Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Latest rental transactions and agreements
                  </p>
                </div>
                <span data-tour="rental-form" className="self-start sm:self-auto">
                  <RentalForm />
                </span>
              </div>
              <div data-tour="rental-list">
                <RentalTable />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Wrapper>
  );
};

export default Rentals;
