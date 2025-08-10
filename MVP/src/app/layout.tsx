import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SynapSense - The AI Professor',
  description: 'Emotionally and cognitively adaptive AI professor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}




