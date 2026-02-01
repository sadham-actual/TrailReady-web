import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mountain, MapPin, Users, Compass, TreePine } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with subtle pattern */}
      <section className="relative flex flex-col items-center justify-center px-4 py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,139,34,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,90,43,0.06),transparent_50%)]" />
          {/* Subtle topographic-style lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="topo" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 Q 25 30, 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                <path d="M0 70 Q 25 50, 50 70 T 100 70" fill="none" stroke="currentColor" strokeWidth="1"/>
                <path d="M0 30 Q 25 10, 50 30 T 100 30" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo)" />
          </svg>
        </div>

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          {/* Logo icon */}
          <div className="rounded-full bg-primary/10 p-4 mb-2 ring-1 ring-primary/20">
            <Mountain className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Know before you go
          </h1>

          <p className="text-lg text-muted-foreground max-w-[600px] md:text-xl leading-relaxed">
            Real-time trail condition reports from the off-road community.
            Check current trail status before you head out.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button size="lg" className="min-w-[160px] h-12 text-base" asChild>
              <Link href="/trails">
                <Compass className="mr-2 h-5 w-5" />
                Browse Trails
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="min-w-[160px] h-12 text-base" asChild>
              <Link href="/trails">
                <TreePine className="mr-2 h-5 w-5" />
                Submit a Report
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-background/50 border border-border/50">
              <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Find Trails</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse trails by region and search for your favorite off-road destinations.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-background/50 border border-border/50">
              <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Community Reports</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get real conditions from fellow off-roaders who have recently driven the trail.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-background/50 border border-border/50">
              <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                <Mountain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Share Your Experience</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Help the community by submitting your own trail condition reports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
