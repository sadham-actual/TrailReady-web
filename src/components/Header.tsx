'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { Mountain, Moon, Sun } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <Mountain className="h-5 w-5" />
          <span>TrailReady</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {!isHome && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/trails">Browse Trails</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
