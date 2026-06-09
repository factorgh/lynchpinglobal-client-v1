import { Avatar } from "@/components/ui/avatar";

interface ClientRowProps {
  client: {
    name: string;
    email: string;
    status: string;
    loanAmount: number;
    license: string;
  };
}

const getGradientByName = (name: string) => {
  const cleanName = (name || "Client").trim();
  const charCode = cleanName.charCodeAt(0) || 0;
  const gradients = [
    "from-sky-400 to-blue-500",
    "from-purple-400 to-pink-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-500",
    "from-indigo-400 to-violet-500",
  ];
  return gradients[charCode % gradients.length];
};

export const ClientRow = ({ client }: ClientRowProps) => {
  const displayName = client.name || "Unknown";
  const initial = displayName.trim().charAt(0).toUpperCase();
  const gradientClass = getGradientByName(displayName);

  return (
    <div className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/70 border border-slate-100 rounded-xl transition-all duration-300 hover:shadow-sm">
      <div className="flex items-center space-x-3.5">
        <Avatar className="w-10 h-10 ring-2 ring-slate-100/50">
          <div className={`w-full h-full bg-gradient-to-tr ${gradientClass} flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
            {initial}
          </div>
        </Avatar>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight">{displayName}</h3>
          <p className="text-xs text-slate-400 font-medium">{client.email || "No email"}</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-50 text-slate-500 border border-slate-200/60 shadow-sm">
          {client.license || "Client"}
        </span>
      </div>
    </div>
  );
};
