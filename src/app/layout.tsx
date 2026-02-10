import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VehicleProvider } from "@/contexts/VehicleContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head />
      <body className="min-h-screen bg-bone antialiased font-sans">
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
