import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Profense - The AI Professor',
  description: 'Emotionally and cognitively adaptive AI professor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Light, friendly gradient background for the whole app */}
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white antialiased"> 
        {children}
      </body>
    </html>
  );
}




