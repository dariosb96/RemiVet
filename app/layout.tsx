import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RemiVet",
  description: "Sistema de citas veterinarias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
    >
      <body className={geist.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}