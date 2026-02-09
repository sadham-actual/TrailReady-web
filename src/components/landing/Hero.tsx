'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Crosshair, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/trails/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLocateMe = () => {
    router.push('/trails/browse?locate=true');
  };

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-6"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
            <span className="bg-gradient-to-b from-slate-50 to-slate-400 bg-clip-text text-transparent">
              Know before
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              you go.
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            Real-time trail conditions matched to your vehicle capability.
          </motion.p>
        </motion.div>

        {/* Command Center - The Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="space-y-4"
        >
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div
              className={`relative flex items-center rounded-2xl bg-slate-900/80 border transition-all duration-300 ${
                isFocused
                  ? 'border-emerald-500/40 shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)]'
                  : 'border-slate-800 shadow-2xl shadow-black/20'
              }`}
            >
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Search 2,400+ trails..."
                  className="w-full h-14 md:h-16 pl-13 pr-4 bg-transparent text-slate-50 placeholder:text-slate-500 text-base md:text-lg focus:outline-none"
                  style={{ paddingLeft: '3.25rem' }}
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="h-10 md:h-12 px-5 md:px-7 mr-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm md:text-base hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all flex items-center gap-2"
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </form>

          {/* Locate Me - Ghost Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <button
              onClick={handleLocateMe}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-300"
            >
              <Crosshair className="h-4 w-4" />
              <span>Use my location</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
