"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { NFTProvider } from './context/NFTContext';
import { LiquidMaxPainTokenProvider } from './context/LiquidMaxPainTokenContext';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { useConfig } from './hooks/useConfig';
import { createWagmiConfig } from './wagmi.config';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);
  const appConfig = useConfig();

  // Memoize to prevent recreating config on every render
  const config = useMemo(() => {
    if (!appConfig?.projectId) return null;
    return createWagmiConfig(appConfig.projectId);
  }, [appConfig?.projectId]);

  useEffect(() => setMounted(true), []);

  const client = new QueryClient();

  // Show loading state while config is being fetched
  if (!config) {
    return <div>Loading wallet configuration...</div>;
  }

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