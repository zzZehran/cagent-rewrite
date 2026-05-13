import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import ConvexClientProvider from "./ConvexClerkProvider";

const geistSans = Geist({
  // variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  // variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal CAgent",
  description: "Generated with HOPE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
           <ConvexClientProvider>
              {children}
            </ConvexClientProvider> 
        </ClerkProvider>
      </body>
    </html>
  );
}
