'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Users, Mountain } from 'lucide-react';

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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-20">
        {/* Background image */}
        <Image
          src="/hero-bg.JPG"
          alt=""
          fill
          className="object-cover"
          style={{ zIndex: -2 }}
          priority
        />
        {/* Gradient scrim - stronger at bottom for text */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"
          style={{ zIndex: -1 }}
        />

        {/* Hero content - direct placement, no card */}
        <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl text-white drop-shadow-sm">
            Know before you go
          </h1>

          <p className="mt-3 text-base text-white/85 max-w-sm leading-normal">
            Real-time trail conditions from the off-road community.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full mt-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search trails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-[15px] rounded-md shadow-sm"
              />
            </div>
          </form>

          <Link
            href="/trails"
            className="mt-4 text-sm text-white/70 hover:text-white hover:underline underline-offset-2 transition-colors"
          >
            Browse all trails
          </Link>
        </div>
      </section>

      {/* Features Section - compact utility style */}
      <section className="bg-card border-t border-border px-4 py-8">
        <div className="container mx-auto max-w-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Find trails</p>
                <p className="text-sm text-secondary-foreground">
                  Browse by region or search by name.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Community reports</p>
                <p className="text-sm text-secondary-foreground">
                  Real conditions from recent visitors.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mountain className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Share updates</p>
                <p className="text-sm text-secondary-foreground">
                  Submit reports to help others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
