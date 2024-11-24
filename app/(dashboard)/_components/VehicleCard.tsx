import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarFront, FileText } from "lucide-react";

interface VehicleCardProps {
  vehicle: {
    make: string;
    model: string;
    year: number;
    vin: string;
    mileage: number;
    status: string;
  };
}

export const VehicleCard = ({ vehicle }: VehicleCardProps) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <Badge
          variant={vehicle.status === "Active" ? "secondary" : "destructive"}
        >
          {vehicle.status}
        </Badge>
        <Button variant="ghost" size="icon">
          <FileText className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <CarFront className="h-5 w-5 text-blue-500" />
          <span className="font-medium">
            {vehicle.make} {vehicle.model}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
        <div className="flex justify-between text-sm">
          <span>Year: {vehicle.year}</span>
          <span>Mileage: {vehicle.mileage.toLocaleString()}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);
