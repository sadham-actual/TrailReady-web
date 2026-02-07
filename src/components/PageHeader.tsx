"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  showBack = false,
  rightContent,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 glass safe-top",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.back()}
              className="-ml-2"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
      </div>
    </header>
  );
}
