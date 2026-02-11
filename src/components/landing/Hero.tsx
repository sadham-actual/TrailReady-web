'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Crosshair, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Topographic pattern SVG component with earth-tone strokes
function TopoPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.18]"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="topo-pattern"
          x="0"
          y="0"
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          {/* Earth/Dust tone stroke color */}
          <g fill="none" stroke="#B8B4A8" strokeWidth="0.8">
            {/* Contour lines */}
            <path d="M0 100 Q50 60 100 100 T200 100" />
            <path d="M0 60 Q50 20 100 60 T200 60" />
            <path d="M0 140 Q50 100 100 140 T200 140" />
            <path d="M0 180 Q50 140 100 180 T200 180" />
            <path d="M0 20 Q50 -20 100 20 T200 20" />
            {/* Elevation markers */}
            <circle cx="150" cy="50" r="16" />
            <circle cx="150" cy="50" r="24" />
            <circle cx="150" cy="50" r="32" />
            <circle cx="50" cy="150" r="12" />
            <circle cx="50" cy="150" r="20" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topo-pattern)" />
    </svg>
  );
}

// Radial vignette mask - fades topo at edges, keeps center clean
function VignetteMask() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(
          ellipse 70% 60% at 50% 40%,
          transparent 0%,
          transparent 40%,
          rgba(249, 248, 246, 0.6) 70%,
          rgba(249, 248, 246, 1) 100%
        )`,
      }}
    />
  );
}

export function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/map?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLocateMe = () => {
    router.push('/map?locate=true');
  };

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      {/* Topographic Pattern Background - Layered for depth */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Base topo pattern */}
        <TopoPattern />
        {/* Radial vignette - fades edges, keeps center clean */}
        <VignetteMask />
        {/* Top/bottom gradient fade for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-bone/80 via-transparent to-bone/80" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12 px-4">
        {/* Industrial Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1.5 bg-white border border-stone-border rounded-sm shadow-[2px_2px_0_0_var(--color-stone-border)] font-mono text-xs font-medium uppercase tracking-wider text-muted-stone">
            Trail Intelligence Platform
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
            <span className="text-deep-stone">
              Know before
            </span>
            <br />
            <span className="text-action-orange">
              you go.
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block px-5 py-2.5 rounded-sm bg-stone-light/60 backdrop-blur-sm text-lg sm:text-xl font-medium text-deep-stone max-w-xl mx-auto leading-relaxed drop-shadow-sm"
          >
            Real-time trail conditions matched to your vehicle capability.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <a
              href="/waitlist"
              className="inline-flex items-center justify-center rounded-none bg-orange-500 px-8 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-stone-100 transition-colors hover:bg-orange-600"
            >
              Join the Expedition
            </a>
          </motion.div>
        </motion.div>

        {/* Command Center - The Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div
              className={`relative flex items-center bg-white border rounded-sm transition-all duration-200 ${
                isFocused
                  ? 'border-action-orange shadow-[4px_4px_0_0_var(--color-action-orange)]'
                  : 'border-stone-border shadow-[3px_3px_0_0_var(--color-stone-border)]'
              }`}
            >
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-stone" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Search 2,400+ trails..."
                  className="w-full h-14 md:h-16 pl-13 pr-4 bg-transparent text-deep-stone placeholder:text-muted-stone text-base md:text-lg focus:outline-none font-medium"
                  style={{ paddingLeft: '3.25rem' }}
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="h-10 md:h-12 px-5 md:px-7 mr-2 rounded-sm bg-action-orange text-white font-mono text-xs md:text-sm font-bold uppercase tracking-wider border border-action-orange-dark shadow-[2px_2px_0_0_var(--color-action-orange-dark)] hover:bg-action-orange-light active:shadow-[1px_1px_0_0_var(--color-action-orange-dark)] active:translate-x-px active:translate-y-px transition-all flex items-center gap-2"
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </form>

          {/* Locate Me Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button
              onClick={handleLocateMe}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs font-medium uppercase tracking-wider text-muted-stone border border-transparent hover:text-deep-stone hover:border-stone-border hover:bg-white hover:shadow-[2px_2px_0_0_var(--color-stone-border)] transition-all"
            >
              <Crosshair className="h-4 w-4" />
              <span>Use my location</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-8 pt-8"
        >
          {[
            { value: '2,400+', label: 'Trails' },
            { value: '12K+', label: 'Reports' },
            { value: '98%', label: 'Accuracy' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-deep-stone tracking-tight">
                {stat.value}
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-stone mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
