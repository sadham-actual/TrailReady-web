'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mountain, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || !isHome
          ? 'bg-[#FAF6F1]/95 backdrop-blur-md border-b border-[#DDD6CA] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2.5 transition-colors ${
            isScrolled || !isHome ? 'text-[#2D5A3D]' : 'text-white'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              isScrolled || !isHome ? 'bg-[#2D5A3D]' : 'bg-white/20 backdrop-blur-sm'
            }`}
          >
            <Mountain
              className={`h-5 w-5 ${isScrolled || !isHome ? 'text-white' : 'text-white'}`}
            />
          </div>
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TrailReady
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {!isHome && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={`rounded-lg transition-colors ${
                isScrolled || !isHome
                  ? 'text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link href="/">Home</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={`rounded-lg transition-colors ${
              isScrolled || !isHome
                ? 'text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC]'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Link href="/trails">Browse Trails</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className={`ml-2 rounded-lg shadow-sm transition-all hover:shadow-md ${
              isScrolled || !isHome
                ? 'bg-[#2D5A3D] hover:bg-[#3D6B4D] text-white'
                : 'bg-white text-[#2D5A3D] hover:bg-white/90'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Link href="/trails">Submit Report</Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            isScrolled || !isHome
              ? 'text-[#2D5A3D] hover:bg-[#EDE6DC]'
              : 'text-white hover:bg-white/10'
          }`}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FAF6F1] border-t border-[#DDD6CA] px-4 py-4 space-y-2">
          {!isHome && (
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC] rounded-lg transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Home
            </Link>
          )}
          <Link
            href="/trails"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2 text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC] rounded-lg transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Browse Trails
          </Link>
          <Link
            href="/trails"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 text-center bg-[#2D5A3D] text-white rounded-lg hover:bg-[#3D6B4D] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Submit Report
          </Link>
        </div>
      )}
    </header>
  );
}
