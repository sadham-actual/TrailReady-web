'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VehicleType } from '@/types';

/**
 * Vehicle selection context for managing user's vehicle preference
 * Persists to localStorage for convenience (no auth required)
 */
interface VehicleContextType {
  selectedVehicle: VehicleType | null;
  setSelectedVehicle: (vehicle: VehicleType | null) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const STORAGE_KEY = 'trailready_selected_vehicle';

/**
 * Provider for vehicle selection state
 * Manages vehicle selection and localStorage persistence
 */
export function VehicleProvider({ children }: { children: ReactNode }) {
  const [selectedVehicle, setSelectedVehicleState] = useState<VehicleType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedVehicleState(stored as VehicleType);
      }
    } catch (error) {
      console.error('Failed to load vehicle selection from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist to localStorage when selection changes
  const setSelectedVehicle = (vehicle: VehicleType | null) => {
    setSelectedVehicleState(vehicle);

    try {
      if (vehicle) {
        localStorage.setItem(STORAGE_KEY, vehicle);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save vehicle selection to localStorage:', error);
    }
  };

  // Don't render children until we've loaded from localStorage
  // This prevents hydration mismatch and flash of wrong state
  if (!isInitialized) {
    return null;
  }

  return (
    <VehicleContext.Provider value={{ selectedVehicle, setSelectedVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

/**
 * Hook to access vehicle selection context
 * @throws Error if used outside VehicleProvider
 */
export function useVehicle() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}
