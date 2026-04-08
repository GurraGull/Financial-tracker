import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private Investment Portfolio",
  description: "Private investment portfolio tracker and visualizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
