'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Users, Mountain, Compass, CloudSun, Map, Settings2, Info, Car, ArrowRight } from 'lucide-react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { VEHICLE_TYPE_LABELS } from '@/types';

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-28 overflow-hidden">
        {/* Background image */}
        <Image
          src="/hero-bg.JPG"
          alt=""
          fill
          className="object-cover"
          style={{ zIndex: -3 }}
          priority
        />

        {/* Dark gradient scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"
          style={{ zIndex: -2 }}
        />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto text-center">
          {/* App branding */}
          <div className="mb-12 animate-fade-up opacity-0">
            <h1
              className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                textShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
                letterSpacing: '-0.03em'
              }}
            >
              TrailReady
            </h1>
            <p
              className="text-2xl md:text-3xl text-white font-medium max-w-3xl mx-auto leading-tight"
              style={{
                fontFamily: 'var(--font-body)',
                textShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}
            >
              Know before you go. Check trail risk in 30 seconds.
            </p>
          </div>

          {/* 3 Primary Actions */}
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto mb-12 animate-fade-up opacity-0 delay-100">
            {/* Browse Trails - Map View */}
            <Link
              href="/trails/browse"
              className="flex-1 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5FA777] via-[#4A8A5F] to-[#3D7350] p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.97] border-2 border-white/20"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10">
                <div className="p-4 bg-white/20 rounded-2xl inline-block mb-5 group-hover:bg-white/30 transition-colors duration-300 backdrop-blur-sm">
                  <Map className="h-14 w-14 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Browse Trails
                </h3>
                <p className="text-white text-base mb-5 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                  Explore trails visually by region on an interactive map
                </p>
                <div className="flex items-center text-white/90 text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  <MapPin className="h-5 w-5 mr-2" />
                  Interactive Map View
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            {/* Search Trails - List View */}
            <Link
              href="/trails/search"
              className="flex-1 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C67B4E] via-[#A8653F] to-[#8B5430] p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.97] border-2 border-white/20"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10">
                <div className="p-4 bg-white/20 rounded-2xl inline-block mb-5 group-hover:bg-white/30 transition-colors duration-300 backdrop-blur-sm">
                  <Search className="h-14 w-14 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Search Trails
                </h3>
                <p className="text-white text-base mb-5 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                  Find trails by name or region with powerful search
                </p>
                <div className="flex items-center text-white/90 text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  List View with Filters
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            {/* Select Vehicle */}
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex-1 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D4B896] via-[#C0A684] to-[#A8926E] p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.97] border-2 border-[#8B7E6A]/30"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(61,46,36,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3D2E24]/10 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10">
                <div className="p-4 bg-[#3D2E24]/15 rounded-2xl inline-block mb-5 group-hover:bg-[#3D2E24]/25 transition-colors duration-300 backdrop-blur-sm">
                  <Settings2 className="h-14 w-14 text-[#3D2E24] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-3xl font-black text-[#3D2E24] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Select Vehicle
                </h3>
                <p className="text-[#3D2E24] text-base mb-5 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                  Get personalized risk assessments for your vehicle
                </p>
                <div className="flex items-center text-[#3D2E24]/90 text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  <Info className="h-5 w-5 mr-2" />
                  Optional Personalization
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          {/* Optional: Current vehicle display if selected */}
          {selectedVehicle && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fade-up opacity-0 delay-200">
              <Car className="h-4 w-4 text-white" />
              <span className="text-white text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                Showing conditions for: {VEHICLE_TYPE_LABELS[selectedVehicle]}
              </span>
              <button
                onClick={() => setVehicleModalOpen(true)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float-slow">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Mountain divider */}
      <div className="h-16 -mt-16 relative z-10 mountain-divider" />

      {/* Features Section */}
      <section className="bg-[#2D5A3D] px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Make better trail decisions
            </h2>
            <p
              className="text-[#B8D4C0] text-lg max-w-2xl mx-auto"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Real-time community reports, vehicle-specific risk assessments, and quick go/no-go decisions
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#C67B4E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Real-Time Reports
              </h3>
              <p
                className="text-[#B8D4C0] leading-relaxed"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Get current conditions from recent visitors. Community-powered updates keep you informed.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#5FA777] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Vehicle-Specific Risk
              </h3>
              <p
                className="text-[#B8D4C0] leading-relaxed"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                See trail conditions tailored to your vehicle setup. What's clear for one may be impassable for another.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#D4B896] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass className="h-6 w-6 text-[#3D2E24]" />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Quick Decisions
              </h3>
              <p
                className="text-[#B8D4C0] leading-relaxed"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Check trail risk in 30 seconds. Clear go/no-go guidance so you can plan with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="bg-[#FAF6F1] px-4 py-16 md:py-20 topo-pattern">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="animate-scale-in opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div
                className="text-5xl md:text-6xl font-bold text-[#2D5A3D] mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                500+
              </div>
              <p
                className="text-[#5C4B3A] font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Trails Mapped
              </p>
            </div>
            <div className="animate-scale-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div
                className="text-5xl md:text-6xl font-bold text-[#C67B4E] mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                2.5k
              </div>
              <p
                className="text-[#5C4B3A] font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Trail Reports
              </p>
            </div>
            <div className="animate-scale-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <div
                className="text-5xl md:text-6xl font-bold text-[#4A7C59] mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                10k+
              </div>
              <p
                className="text-[#5C4B3A] font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Happy Explorers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#3D2E24] to-[#2C2418] px-4 py-16 md:py-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C67B4E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4A7C59]/10 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <CloudSun className="h-12 w-12 text-[#D4B896] mx-auto mb-6" />
          <h2
            className="text-3xl md:text-4xl font-semibold text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to hit the trail?
          </h2>
          <p
            className="text-[#B8AFA2] text-lg mb-8 max-w-xl mx-auto"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Start exploring trails in your area and join our community of outdoor enthusiasts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="h-12 px-8 bg-[#C67B4E] hover:bg-[#D4956A] text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-base"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link href="/trails">
                <Compass className="h-5 w-5 mr-2" />
                Explore Trails
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 px-8 bg-transparent border-2 border-[#D4B896]/40 text-[#D4B896] hover:bg-[#D4B896]/10 hover:border-[#D4B896]/60 rounded-xl transition-all text-base"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link href="/trails">
                <MapPin className="h-5 w-5 mr-2" />
                View Map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1F1C] px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#5FA777]">
              <Mountain className="h-5 w-5" />
              <span
                className="font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                TrailReady
              </span>
            </div>
            <p
              className="text-[#7A8278] text-sm"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              © 2025 TrailReady. Built for the trail community.
            </p>
          </div>
        </div>
      </footer>

      {/* Vehicle selection modal */}
      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        currentVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />
    </div>
  );
}
