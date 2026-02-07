'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VehicleType, VEHICLE_TYPE_LABELS } from '@/types';
import { Car, Info, CheckCircle2 } from 'lucide-react';

interface VehicleSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVehicle?: VehicleType | null;
  onSelectVehicle: (vehicle: VehicleType | null) => void;
}

export function VehicleSelectionModal({
  open,
  onOpenChange,
  currentVehicle,
  onSelectVehicle
}: VehicleSelectionModalProps) {
  // Simplified vehicle list with better grouping
  const vehicles: Array<{ value: VehicleType; label: string; description: string }> = [
    {
      value: 'stockSUV_IFS',
      label: 'Stock SUV - IFS',
      description: 'Factory suspension, independent front'
    },
    {
      value: 'stockSUV_solidAxle',
      label: 'Stock SUV - Solid Axle',
      description: 'Factory solid axle front and rear'
    },
    {
      value: 'lifted4x4_IFS',
      label: 'Lifted 4x4 - IFS',
      description: 'Lifted with independent front suspension'
    },
    {
      value: 'lifted4x4_solidAxle',
      label: 'Lifted 4x4 - Solid Axle',
      description: 'Lifted with solid axle setup'
    },
    {
      value: 'sideBySide',
      label: 'Side-by-Side',
      description: 'UTV / ATV side-by-side vehicle'
    },
    {
      value: 'dirtBike',
      label: 'Dirt Bike',
      description: 'Motorcycle / dirt bike'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border shadow-large rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl md:text-3xl text-primary font-bold">
            <div className="p-2 bg-primary rounded-xl">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            Select Your Vehicle
          </DialogTitle>
          <DialogDescription className="pt-3 text-base text-muted-foreground">
            Get personalized trail risk assessments based on your setup. You can change this anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Why this matters */}
        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-5 mb-2 border border-success/20">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-success rounded-lg mt-0.5">
              <Info className="h-4 w-4 text-success-foreground" />
            </div>
            <div className="text-sm">
              <strong className="text-primary font-semibold block mb-1.5">Why select your vehicle?</strong>
              <p className="text-foreground/80 leading-relaxed">
                A trail that's "passable" for a lifted solid axle might be "impassable"
                for a stock IFS. Your selection helps us show the most relevant reports
                and give you accurate go/no-go decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle options */}
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {vehicles.map((vehicle) => {
            const isSelected = currentVehicle === vehicle.value;
            return (
              <button
                key={vehicle.value}
                onClick={() => {
                  onSelectVehicle(vehicle.value);
                  onOpenChange(false);
                }}
                className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected
                    ? 'border-success bg-gradient-to-br from-success/10 to-success/5 shadow-soft'
                    : 'border-border hover:border-success/50 hover:bg-accent/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-bold text-base transition-colors ${
                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}>
                        {vehicle.label}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 p-1 bg-success rounded-full animate-scale-in">
                      <CheckCircle2 className="h-5 w-5 text-success-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip/Clear option */}
        <div className="border-t pt-4 mt-2">
          <button
            onClick={() => {
              onSelectVehicle(null);
              onOpenChange(false);
            }}
            className="w-full text-center px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all font-medium"
          >
            Skip for now - Browse without personalization
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
