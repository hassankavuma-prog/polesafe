import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PoleSafe — School Mobility & Emergency Operations',
  description: 'Transport safety and emergency operations platform built for Uganda-first realities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
