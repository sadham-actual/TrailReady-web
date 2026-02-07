"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Map, Search, Home } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/trails/search", icon: Search, label: "Search" },
  { href: "/trails/browse", icon: Map, label: "Map" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on landing page
  if (pathname === "/") {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
