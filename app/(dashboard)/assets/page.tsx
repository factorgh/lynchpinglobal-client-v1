import Wrapper from "../wealth/_components/wapper";
import AssetForm from "./_components/asset-form";
import AssetTable from "./_components/asset-table";

const Assets = () => {
  return (
    <Wrapper>
      <div className="py-5 select-none">
        {/* Page Header aligned with global design */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          data-tour="asset-header"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Asset Management
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
              Manage client asset classes, purchases, and portfolio valuations
            </p>
          </div>
          <div data-tour="asset-form" className="self-start sm:self-auto">
            <AssetForm />
          </div>
        </div>

        {/* Asset Table Card */}
        <div
          className="bg-white/85 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          data-tour="asset-table"
        >
          <AssetTable />
        </div>
      </div>
    </Wrapper>
  );
};

export default Assets;
