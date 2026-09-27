import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, PhoneCall } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bengal Safety Map | Transparent Civic Decision Support',
  description:
    'Transparent public-interest mapping tool for publicly reported safety incidents, night-time patterns, and legal case timelines in West Bengal.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#1e3a8a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('PWA ServiceWorker registered successfully with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-civic-50 text-civic-900">
        {/* 1. Official Emergency Notice (Persistent Top Bar) */}
        <div className="bg-rose-900 text-rose-100 text-xs px-4 py-2 font-medium flex items-center justify-between shadow-sm z-50">
          <div className="flex items-center space-x-2 mx-auto">
            <PhoneCall className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
            <span>
              <strong>EMERGENCY NOTICE:</strong> In immediate danger, contact local emergency services immediately via{' '}
              <span className="underline font-bold text-white tracking-wide">National Helpline: 112</span>. Do not rely
              on this civic mapping platform for emergency response.
            </span>
          </div>
        </div>

        {/* 2. Synthetic Demo Mode Banner */}
        <div className="bg-amber-500 text-amber-950 text-[11px] font-semibold px-4 py-1 text-center border-b border-amber-600 flex items-center justify-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-900" />
          <span>
            SYNTHETIC DEMO MODE: Operating on fictional demonstration pilot fixtures for Greater Kolkata. Not real-world incident records.
          </span>
        </div>

        {/* Main Application Container */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Institutional Civic Footer */}
        <footer className="bg-white border-t border-civic-200 mt-auto py-6 px-4 sm:px-8 text-xs text-civic-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-civic-700">Bengal Safety Map &bull; Civic Transparency Initiative</p>
              <p className="text-[11px]">
                Descriptive decision-support tool. Does not predict individual danger, rate neighborhoods as unsafe, or
                imply guilt from allegations.
              </p>
            </div>
            <div className="text-center sm:text-right text-[11px] space-y-0.5">
              <p>Pilot Area: Greater Kolkata (KMC &bull; Bidhannagar &bull; Howrah &bull; New Town)</p>
              <p>Timezone: Asia/Kolkata (IST) &bull; Release Version: synthetic_demo_v1</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
