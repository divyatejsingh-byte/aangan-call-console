import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aangan Studio · Vaani Call Console',
  description: 'Inbound Voice AI call queue, transcripts and lead dossiers for Aangan Studio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
