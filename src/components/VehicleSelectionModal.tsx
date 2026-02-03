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
      <DialogContent className="sm:max-w-xl bg-[#FAF6F1] border-[#DDD6CA] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl md:text-3xl text-[#2D5A3D] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="p-2 bg-[#2D5A3D] rounded-xl">
              <Car className="h-6 w-6 text-white" />
            </div>
            Select Your Vehicle
          </DialogTitle>
          <DialogDescription className="pt-3 text-base text-[#5C4B3A]" style={{ fontFamily: 'var(--font-body)' }}>
            Get personalized trail risk assessments based on your setup. You can change this anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Why this matters */}
        <div className="bg-gradient-to-br from-[#E8F5EC] to-[#D4E8DC] rounded-xl p-5 mb-2 border border-[#5FA777]/20">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-[#5FA777] rounded-lg mt-0.5">
              <Info className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              <strong className="text-[#2D5A3D] font-semibold block mb-1.5">Why select your vehicle?</strong>
              <p className="text-[#3D5A45] leading-relaxed">
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
                    ? 'border-[#5FA777] bg-gradient-to-br from-[#5FA777]/10 to-[#5FA777]/5 shadow-md'
                    : 'border-[#DDD6CA] hover:border-[#5FA777]/50 hover:bg-white/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-bold text-base transition-colors ${
                        isSelected ? 'text-[#2D5A3D]' : 'text-[#3D2E24] group-hover:text-[#2D5A3D]'
                      }`} style={{ fontFamily: 'var(--font-display)' }}>
                        {vehicle.label}
                      </div>
                    </div>
                    <div className="text-sm text-[#5C4B3A]/80" style={{ fontFamily: 'var(--font-body)' }}>
                      {vehicle.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 p-1 bg-[#5FA777] rounded-full animate-in zoom-in-50 duration-200">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip/Clear option */}
        <div className="border-t border-[#DDD6CA] pt-4 mt-2">
          <button
            onClick={() => {
              onSelectVehicle(null);
              onOpenChange(false);
            }}
            className="w-full text-center px-4 py-3 text-sm text-[#7A6E5D] hover:text-[#3D2E24] hover:bg-[#EDE6DC] rounded-lg transition-all font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Skip for now - Browse without personalization
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
