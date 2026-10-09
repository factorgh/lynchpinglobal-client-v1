import Wrapper from "../wealth/_components/wapper";
import AssetForm from "./_components/asset-form";
import AssetTable from "./_components/asset-table";

const Assets = () => {
  return (
    <Wrapper>
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] my-6">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5"
          data-tour="asset-header"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Asset Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Latest asset transactions
            </p>
          </div>
          <span data-tour="asset-form">
            <AssetForm />
          </span>
        </div>
        <div data-tour="asset-table">
          <AssetTable />
        </div>
      </div>
    </Wrapper>
  );
};

export default Assets;
