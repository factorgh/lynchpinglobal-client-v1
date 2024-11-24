import DashboardWrapper from "../(components)/dashboardWrapper";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <DashboardWrapper>{children}</DashboardWrapper>
    </div>
  );
};

export default DashboardLayout;
