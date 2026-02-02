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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-24 md:py-32 lg:py-40 min-h-[70vh]">
        {/* Background image */}
        <Image
          src="/hero-bg.JPG"
          alt=""
          fill
          className="object-cover -z-20"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 -z-10" />

        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-10 md:px-12 md:py-12 space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-white">
              Know before you go
            </h1>

            <p className="text-lg text-white/90 max-w-[500px] leading-relaxed">
              Real-time trail conditions from the off-road community. Check current status before you head out.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-md mx-auto mt-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by trail name or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-card/95 backdrop-blur border-border text-base rounded-lg shadow-lg"
                />
              </div>
            </form>

            <Link
              href="/trails"
              className="inline-block text-white/80 hover:text-white text-[15px] font-medium transition-colors"
            >
              Explore all trails →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="rounded-full bg-primary/10 p-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-[16px]">Find Trails</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Browse trails by region and search for your favorite off-road destinations.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-[16px]">Community Reports</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Get real conditions from fellow off-roaders who recently drove the trail.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Mountain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-[16px]">Share Your Experience</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Help the community by submitting your own trail condition reports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
