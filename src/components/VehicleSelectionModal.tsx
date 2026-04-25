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

// Capability bar visualization - Industrial style
function CapabilityBar({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`h-2 w-4 rounded-sm transition-colors ${
            bar <= level ? 'bg-action-orange' : 'bg-stone-border'
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
        <Drawer.Overlay className="fixed inset-0 bg-deep-stone/40 backdrop-blur-sm z-[1100]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[1100] outline-none">
          <div className="bg-bone border-t border-stone-border max-h-[90vh] overflow-hidden">
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 rounded-sm bg-stone-medium" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto max-h-[calc(90vh-60px)]">
              {/* Header */}
              <div className="text-center mb-8">
                <Drawer.Title className="font-mono text-xs font-bold uppercase tracking-wider text-muted-stone mb-2">
                  02 / Garage
                </Drawer.Title>
                <h2 className="text-2xl font-bold text-deep-stone tracking-tight">
                  Select Your Rig
                </h2>
                <Drawer.Description className="mt-2 text-sm text-charcoal">
                  Match trail recommendations to your vehicle capability
                </Drawer.Description>
              </div>

              {/* Vehicle Cards Grid — single col on mobile, 2 col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {VEHICLE_CATEGORIES.map((category, index) => {
                  const isSelected = currentCategory?.id === category.id;

                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleSelect(category)}
                      className={`relative flex items-center gap-4 p-4 sm:flex-col sm:items-start sm:p-5 rounded-sm border text-left transition-all duration-150 min-h-[72px] ${
                        isSelected
                          ? 'bg-white border-action-orange shadow-[3px_3px_0_0_var(--color-action-orange)]'
                          : 'bg-white border-stone-border shadow-[2px_2px_0_0_var(--color-stone-border)] hover:shadow-[3px_3px_0_0_var(--color-stone-border)] hover:-translate-x-px hover:-translate-y-px'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-sm bg-action-orange flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </motion.div>
                      )}

                      {/* Icon */}
                      <div
                        className={`w-12 h-12 flex-shrink-0 rounded-sm flex items-center justify-center sm:mb-4 transition-colors ${
                          isSelected
                            ? 'bg-action-orange/10 text-action-orange'
                            : 'bg-stone-light text-muted-stone'
                        }`}
                      >
                        <VehicleIcon icon={category.icon} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-bold text-base mb-1 transition-colors ${
                            isSelected ? 'text-action-orange' : 'text-deep-stone'
                          }`}
                        >
                          {category.name}
                        </h3>
                        <p className="font-mono text-xs text-muted-stone leading-relaxed mb-2 sm:mb-3 uppercase tracking-wide">
                          {category.description}
                        </p>

                        {/* Capability Bar */}
                        <CapabilityBar level={category.capabilityLevel} />
                      </div>
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
                className="w-full py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-stone hover:text-deep-stone transition-colors border border-transparent hover:border-stone-border hover:bg-white rounded-sm"
              >
                Skip — browse without personalization
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
