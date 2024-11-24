import { Tabs } from "antd"; // Import Ant Design Tabs
import Wrapper from "../wealth/_components/wapper";
import LoanForm from "./_components/loan-form";
import LoanTable from "./_components/Loan-table";
import RentalForm from "./_components/rental-form";
import RentalTable from "./_components/rental-table";

const Rentals = () => {
  return (
    <Wrapper>
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Loan Management",
            children: (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f9fafb", // Light background color
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "2px solid #e5e7eb", // Underline for separation
                    paddingBottom: "10px",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    Loan Management
                  </h1>
                  <LoanForm />
                </div>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#4b5563",
                    marginTop: "10px",
                    marginBottom: "20px",
                  }}
                >
                  Latest asset transactions
                </p>
                <div>
                  <LoanTable />
                </div>
              </div>
            ),
          },
          {
            key: "2",
            label: "Asset Rentals",
            children: (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f9fafb", // Light background color
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "2px solid #e5e7eb", // Underline for separation
                    paddingBottom: "10px",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    Rentals Management
                  </h1>
                  <RentalForm />
                </div>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#4b5563",
                    marginTop: "10px",
                    marginBottom: "20px",
                  }}
                >
                  Latest rental transactions
                </p>
                <div>
                  <RentalTable />
                </div>
              </div>
            ),
          },
        ]}
      />
    </Wrapper>
  );
};

export default Rentals;
