import type { Metadata } from "next";
import { ClerkProvider } from "@/providers/clerk-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuperAlien",
  description: "AI-powered productivity platform",
  icons: {
    icon: "/Logo.png",
    apple: "/Logo.png",
  },
  openGraph: {
    title: "SuperAlien",
    description: "AI-powered productivity platform",
    images: [{ url: "/Logo.png", width: 2048, height: 2048, alt: "SuperAlien logo" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ClerkProvider>{children}</ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
