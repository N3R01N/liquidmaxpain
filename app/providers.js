"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { NextUIProvider } from '@nextui-org/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, http } from 'wagmi'
import { useState, useEffect } from 'react'
import { QueryTriggerProvider } from './QueryTriggerContext';
import { NFTProvider } from './context/NFTContext';

export const config = getDefaultConfig({
  appName: 'LiquidMaxPain',
  projectId: 'd7059c8929dc8c82fa4224da99a08219',
  chains: [mainnet, sepolia],
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  },
});

const client = new QueryClient();

export function Providers({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Only render NFT providers after client-side mount to prevent hydration issues
  const renderContent = () => {
    if (!mounted) {
      return (
        <main className="dark text-foreground bg-background">
          <div className="min-h-screen flex items-center justify-center">
            {/* Optional: Add a loading spinner here */}
          </div>
        </main>
      );
    }

    return (
      <NFTProvider>
        <main className="dark text-foreground bg-background">
          {children}
        </main>
      </NFTProvider>
    );
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          <NextUIProvider>
            <QueryTriggerProvider>
              {renderContent()}
            </QueryTriggerProvider>
          </NextUIProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

