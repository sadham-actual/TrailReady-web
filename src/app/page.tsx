'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Users, Mountain, Compass, TreePine, Sun, CloudSun } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/trails?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/trails');
    }
  }

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

        {/* Dark gradient scrim - strong enough to guarantee text contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"
          style={{ zIndex: -2 }}
        />

        {/* Hero content - contained in frosted surface for guaranteed readability */}
        <div className="relative w-full max-w-xl mx-auto">
          {/* Frosted glass card surface */}
          <div className="absolute -inset-6 md:-inset-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10" />

          {/* Content container */}
          <div className="relative flex flex-col items-center text-center px-2">
            {/* Badge */}
            <div className="animate-fade-up opacity-0 mb-5">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Compass className="h-4 w-4" />
                Community-powered trail reports
              </span>
            </div>

            {/* Main headline - full white for maximum contrast */}
            <h1
              className="animate-fade-up opacity-0 delay-100 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
              style={{
                fontFamily: 'var(--font-display)',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Know before
              <span className="block text-[#E8D5B5]">you go</span>
            </h1>

            {/* Subheadline - full white, not reduced opacity */}
            <p
              className="animate-fade-up opacity-0 delay-200 mt-5 text-base md:text-lg text-white max-w-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Real-time trail conditions from the off-road community. Plan smarter, explore further.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="animate-fade-up opacity-0 delay-300 w-full mt-6 max-w-md">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-[#5C4B3A]" />
                <Input
                  type="text"
                  placeholder="Search trails by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-28 h-12 bg-white border-0 text-[#2C2418] placeholder:text-[#7A6E5D] text-base rounded-lg shadow-lg focus-visible:ring-2 focus-visible:ring-white/50"
                  style={{ fontFamily: 'var(--font-display)' }}
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 h-9 px-4 bg-[#2D5A3D] hover:bg-[#3D6B4D] text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Quick links - solid white text */}
            <div className="animate-fade-up opacity-0 delay-400 flex flex-wrap items-center justify-center gap-2 mt-5">
              <Link
                href="/trails"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white font-medium hover:bg-white/15 rounded-full transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <TreePine className="h-4 w-4" />
                Browse all trails
              </Link>
              <span className="text-white/50">•</span>
              <Link
                href="/trails?difficulty=easy"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white font-medium hover:bg-white/15 rounded-full transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Sun className="h-4 w-4" />
                Easy trails
              </Link>
            </div>
          </div>
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
              Trail conditions at your fingertips
            </h2>
            <p
              className="text-[#B8D4C0] text-lg max-w-2xl mx-auto"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Join thousands of outdoor enthusiasts sharing real-time updates from the trail
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#D4B896] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-[#3D2E24]" />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Find Your Trail
              </h3>
              <p
                className="text-[#B8D4C0] leading-relaxed"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Browse by region, difficulty, or search by name. Discover your next adventure with detailed trail information.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#C67B4E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Community Reports
              </h3>
              <p
                className="text-[#B8D4C0] leading-relaxed"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Get real conditions from recent visitors. See what's passable, what needs caution, and what to avoid.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#5FA777] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mountain className="h-6 w-6 text-white" />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Share Updates
              </h3>
              <p
                className="text-[#B8D4C0] leading-relaxed"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Submit your own trail reports to help fellow adventurers. Every update makes the community stronger.
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
    </div>
  );
}
