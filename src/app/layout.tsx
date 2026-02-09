import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VehicleProvider } from "@/contexts/VehicleContext";
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
            <main>{children}</main>
          </VehicleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
