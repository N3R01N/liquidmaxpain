"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, http } from 'wagmi';
import { useState, useEffect } from 'react';
import { QueryTriggerProvider } from './QueryTriggerContext';
import { NFTProvider } from './context/NFTContext';
import { HeroUIProvider } from '@heroui/react';

export const config = getDefaultConfig({
  appName: 'LiquidMaxPain',
  projectId: 'd7059c8929dc8c82fa4224da99a08219',
  chains: [mainnet, sepolia],
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  },
});

const client = new QueryClient();

export function Providers({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <HeroUIProvider> {/* OUTERMOST */}
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider>
            <QueryTriggerProvider>
              {mounted ? (
                <NFTProvider>
                  <main className="dark text-foreground bg-background">
                    {children}
                  </main>
                </NFTProvider>
              ) : (
                <div className="min-h-screen bg-black" /> // Prevents flash
              )}
            </QueryTriggerProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </HeroUIProvider>
  );
}