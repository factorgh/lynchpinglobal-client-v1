interface ClientRowProps {
  client: {
    name?: string;
    email?: string;
    status?: string;
    loanAmount?: number;
    license?: string;
    _id?: string;
  };
  index?: number;
}

export const ClientRow = ({ client, index = 0 }: ClientRowProps) => {
  const displayName = client?.name || "Client";
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";
  
  // Format code e.g. CL-2024015
  const clientCode =
    client?.license && client.license.startsWith("CL-")
      ? client.license
      : client?.license
      ? `CL-${client.license}`
      : `CL-202401${index + 5}`;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all duration-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#1e7e48] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
          {initial}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-xs tracking-tight leading-tight">
            {displayName}
          </h4>
          <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
            {client?.email || "No email"}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#eaf4eb] text-[#1e7e48] border border-[#d2edd6]">
          {clientCode}
        </span>
      </div>
    </div>
  );
};

