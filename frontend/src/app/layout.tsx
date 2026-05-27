import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'CodeWeaknesses - Competitive Coding Judge',
  description: 'A real-time competitive coding platform for testing and submitting solutions',
  keywords: ['coding', 'judge', 'competitive programming', 'contests'],
  authors: [{ name: 'CodeWeaknesses' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
