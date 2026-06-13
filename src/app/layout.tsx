import type { Metadata } from "next";
import { ClerkProvider } from "@/providers/clerk-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuperAlien",
  description: "AI-powered productivity platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
