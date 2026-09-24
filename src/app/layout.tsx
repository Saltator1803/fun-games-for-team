import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "FUN FRIDAY GAMES | Your Friday. Your Games. Your Squad.",
  description: "Play fast, competitive party multiplayer games with your friends, teammates, or colleagues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-bg-dark text-foreground min-h-screen flex flex-col`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
