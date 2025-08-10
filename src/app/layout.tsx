import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SynapSense - The AI Professor',
  description: 'Emotionally and cognitively adaptive AI professor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)',
          background: 'rgba(11,16,32,0.7)', borderBottom: '1px solid #222849'
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              <b>SynapSense</b>
            </div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>The AI Professor that feels your mind</div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}




