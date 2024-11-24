import Wrapper from "./_components/wapper";
import WealthForm from "./_components/wealth-form";
import WealthTable from "./_components/wealth-table";

const Wealth = () => {
  return (
    <Wrapper>
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
            Wealth Management
          </h1>
          <WealthForm />
        </div>
        <p
          style={{
            fontSize: "16px",
            color: "#4b5563",
            marginTop: "10px",
            marginBottom: "20px",
          }}
        >
          Latest investment transactions
        </p>
        <div>
          <WealthTable />
        </div>
      </div>
    </Wrapper>
  );
};

export default Wealth;
