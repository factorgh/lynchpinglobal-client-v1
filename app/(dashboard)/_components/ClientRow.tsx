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
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 px-2 sm:px-3 rounded-xl transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
          {initial}
        </div>
        <div className="min-w-0">
          <h4
            className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate leading-tight"
            title={displayName}
          >
            {displayName}
          </h4>
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shadow-2xs">
          {clientCode}
        </span>
      </div>
    </div>
  );
};


