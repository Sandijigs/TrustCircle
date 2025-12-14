import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { SelfXyzProvider } from "@/providers/SelfXyzProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustCircle - Web3 Micro-Lending Platform",
  description: "Verified micro-lending platform on Celo with AI-powered credit scoring and social lending circles",
  keywords: ["DeFi", "Micro-lending", "Celo", "Web3", "Credit Score", "Lending Circles"],
  authors: [{ name: "TrustCircle Team" }],
  openGraph: {
    title: "TrustCircle - Web3 Micro-Lending Platform",
    description: "Access micro-loans with AI credit scoring on Celo blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <SelfXyzProvider>
            {children}
          </SelfXyzProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
