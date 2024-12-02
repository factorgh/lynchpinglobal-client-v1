import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ClientRowProps {
  client: {
    name: string;
    email: string;
    status: string;
    loanAmount: number;
  };
}

export const ClientRow = ({ client }: ClientRowProps) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border mb-2">
    <div className="flex items-center space-x-4">
      <Avatar>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
          {client.name.charAt(0)}
        </div>
      </Avatar>
      <div>
        <h3 className="font-medium">{client.name}</h3>
        <p className="text-sm text-muted-foreground">{client.email}</p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <Badge variant={client.status === "Active" ? "secondary" : "destructive"}>
        {client.status}
      </Badge>
      <div className="text-right">
        <p className="font-semibold">GH{client.loanAmount.toLocaleString()}</p>
      </div>
    </div>
  </div>
);
