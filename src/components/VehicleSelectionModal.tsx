'use client';

import { motion } from 'framer-motion';
import { Drawer } from 'vaul';
import { VehicleType, VEHICLE_CATEGORIES, VehicleCategoryInfo } from '@/types';
import { Check, Car, Truck, Cog, Mountain } from 'lucide-react';

interface VehicleSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVehicle?: VehicleType | null;
  onSelectVehicle: (vehicle: VehicleType | null) => void;
}

// Custom vehicle icons matching the category aesthetic
function VehicleIcon({ icon, className }: { icon: VehicleCategoryInfo['icon']; className?: string }) {
  const iconClass = className || 'h-8 w-8';

  switch (icon) {
    case 'crossover':
      return <Car className={iconClass} />;
    case 'truck':
      return <Truck className={iconClass} />;
    case 'lifted':
      return <Cog className={iconClass} />;
    case 'crawler':
      return <Mountain className={iconClass} />;
  }
}

// Capability bar visualization
function CapabilityBar({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`h-1.5 w-4 rounded-full transition-colors ${
            bar <= level ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export function VehicleSelectionModal({
  open,
  onOpenChange,
  currentVehicle,
  onSelectVehicle,
}: VehicleSelectionModalProps) {
  // Find which category the current vehicle belongs to
  const currentCategory = VEHICLE_CATEGORIES.find(
    (cat) => cat.mappedType === currentVehicle
  );

  const handleSelect = (category: VehicleCategoryInfo) => {
    onSelectVehicle(category.mappedType);
    // Small delay to show selection animation before closing
    setTimeout(() => onOpenChange(false), 150);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-hidden">
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto max-h-[calc(90vh-60px)]">
              {/* Header */}
              <div className="text-center mb-8">
                <Drawer.Title className="text-2xl font-bold text-slate-50 tracking-tight">
                  The Garage
                </Drawer.Title>
                <Drawer.Description className="mt-2 text-sm text-slate-400">
                  Select your rig for personalized trail matching
                </Drawer.Description>
              </div>

              {/* Vehicle Cards Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {VEHICLE_CATEGORIES.map((category, index) => {
                  const isSelected = currentCategory?.id === category.id;

                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleSelect(category)}
                      className={`relative p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-slate-950" strokeWidth={3} />
                        </motion.div>
                      )}

                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        <VehicleIcon icon={category.icon} />
                      </div>

                      {/* Text */}
                      <h3
                        className={`font-semibold text-base mb-1 transition-colors ${
                          isSelected ? 'text-emerald-400' : 'text-slate-50'
                        }`}
                      >
                        {category.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        {category.description}
                      </p>

                      {/* Capability Bar */}
                      <CapabilityBar level={category.capabilityLevel} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Skip Option */}
              <button
                onClick={() => {
                  onSelectVehicle(null);
                  onOpenChange(false);
                }}
                className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip for now — browse without personalization
              </button>
            </div>

            {/* Safe area spacing for mobile */}
            <div className="safe-bottom" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
