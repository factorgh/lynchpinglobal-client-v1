import { AuthProvider } from "@/context/authContext";
import DashboardWrapper from "../(components)/dashboardWrapper";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardWrapper>
      {" "}
      <AuthProvider>{children}</AuthProvider>
    </DashboardWrapper>
  );
};

export default DashboardLayout;
