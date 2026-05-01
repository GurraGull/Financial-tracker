import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PM Terminal',
  description: 'Private market portfolio tracker for sophisticated investors',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
