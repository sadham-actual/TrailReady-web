import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VehicleProvider } from "@/contexts/VehicleContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrailReady - Know Before You Go",
  description: "Real-time trail condition reports from the off-road community. Plan smarter, explore further.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider>
          <VehicleProvider>
            <Header />
            <main className="pb-20 md:pb-0">{children}</main>
            <BottomNav />
            <Toaster />
          </VehicleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
