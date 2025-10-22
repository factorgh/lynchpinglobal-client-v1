"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming this is your custom Tab component
import Wrapper from "../wealth/_components/wapper";
import LoanForm from "./_components/loan-form";
import LoanTable from "./_components/Loan-table";
import RentalForm from "./_components/rental-form";
import RentalTable from "./_components/rental-table";

const Rentals = () => {
  return (
    <Wrapper>
      <div className="mt-7 text-white">
        <h1 className="text-2xl font-bold mb-4 text-white">Loans & Rentals</h1>

        {/* Custom Tabs using your UI library */}
        <Tabs defaultValue="loan">
          {/* Tab List */}
          <TabsList className="mb-6">
            <TabsTrigger value="loan">Loan Management</TabsTrigger>
            <TabsTrigger value="rentals">Asset Rentals</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="loan">
            <div className="p-5 bg-gray-50 rounded-lg shadow-md mb-5">
              <div className="flex justify-between items-center border-b-2 pb-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  Loan Management
                </h1>
                <LoanForm />
              </div>
              <p className="text-gray-600 text-sm mb-5">
                Latest asset transactions
              </p>
              <div>
                <LoanTable />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rentals">
            <div className="p-5 bg-gray-50 rounded-lg shadow-md mb-5">
              <div className="flex justify-between items-center border-b-2 pb-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  Rentals Management
                </h1>
                <RentalForm />
              </div>
              <p className="text-gray-600 text-sm mb-5">
                Latest rental transactions
              </p>
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
