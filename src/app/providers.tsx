"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { NFTProvider } from './context/NFTContext';
import { OpenSeaProvider } from './context/OpenSeaContext';
import { LiquidMaxPainTokenProvider } from './context/LiquidMaxPainTokenContext';
import { LiquidMaxPainSwapProvider } from './context/LiquidMaxPainSwapContext';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { mainnet, sepolia } from 'wagmi/chains';
import Image from 'next/image';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);
  const [client] = useState(() => new QueryClient());

  // Create wagmi config client-side only — RainbowKit's getDefaultConfig
  // validates projectId eagerly and throws during SSR prerendering
  const config = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getDefaultConfig({
      appName: 'LiquidMaxPain',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      chains: [mainnet, sepolia],
    });
  }, []);

  useEffect(() => setMounted(true), []);

  if (!config) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-black">
        <Image
          src="/MAX_PAIN.gif"
          width={225}
          height={225}
          alt="Loading..."
          priority
          unoptimized
        />
      </main>
    );
  }

  return (
    <ThemeProvider attribute='class'>
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider>
            {mounted ? (
              <NFTProvider>
                <OpenSeaProvider>
                  <LiquidMaxPainTokenProvider>
                    <LiquidMaxPainSwapProvider>
                      <main className="dark text-foreground bg-background">
                        {children}
                      </main>
                    </LiquidMaxPainSwapProvider>
                  </LiquidMaxPainTokenProvider>
                </OpenSeaProvider>
              </NFTProvider>
            ) : (
              <main className="flex items-center justify-center min-h-screen bg-black">
                <Image
                  src="/MAX_PAIN.gif"
                  width={225}
                  height={225}
                  alt="Loading..."
                  priority
                  unoptimized
                />
              </main>
            )}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
