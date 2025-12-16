"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { NFTProvider } from './context/NFTContext';
import { LiquidMaxPainTokenProvider } from './context/LiquidMaxPainTokenContext';
import type { ReactNode } from 'react';
import { config } from './wagmi.config';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const client = new QueryClient();

  return (
    <ThemeProvider attribute='class'>
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider>
            {mounted ? (
              <NFTProvider>
                <LiquidMaxPainTokenProvider>
                  <main className="dark text-foreground bg-background">
                    {children}
                  </main>
                </LiquidMaxPainTokenProvider>
              </NFTProvider>
            ) : (
              <div className="min-h-screen bg-black" /> // Prevents flash
            )}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}