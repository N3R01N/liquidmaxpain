'use client';
import { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

interface PriceResponse {
    sellPrice: string | null;
    buyPrice: string | null;
    spotPrice: string | null;
    sellLiquid: boolean;
    buyLiquid: boolean;
}

interface LiquidMaxPainSwapContextType {
    refetch: () => void;
    isLoading: boolean;
    error: Error | null;
    /** Firm sell price from the quoter — 0n when sell side is illiquid */
    sellPrice: bigint;
    /** Firm buy price from the quoter — 0n when buy side is illiquid */
    buyPrice: bigint;
    /** Indicative spot price from the pool (always available if pool exists) */
    spotPrice: bigint;
    /** Whether the pool has enough liquidity to sell 100 LQMPT */
    sellLiquid: boolean;
    /** Whether the pool has enough liquidity to buy 100 LQMPT */
    buyLiquid: boolean;
}

const LiquidMaxPainSwapContext = createContext<LiquidMaxPainSwapContextType>({
    buyPrice: 0n,
    sellPrice: 0n,
    spotPrice: 0n,
    refetch: () => { },
    isLoading: false,
    error: null,
    sellLiquid: false,
    buyLiquid: false,
});

async function fetchPrices(): Promise<PriceResponse> {
    const res = await fetch('/api/price');
    if (!res.ok) {
        throw new Error('Failed to fetch prices');
    }
    return res.json();
}

export function LiquidMaxPainSwapProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['swap-prices'],
        queryFn: fetchPrices,
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 60,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        refetchOnWindowFocus: false,
    });

    const refetch = useCallback(() => {
        queryClient.refetchQueries({ queryKey: ['swap-prices'] });
    }, [queryClient]);

    const value: LiquidMaxPainSwapContextType = {
        sellPrice: data?.sellPrice ? BigInt(data.sellPrice) : 0n,
        buyPrice: data?.buyPrice ? BigInt(data.buyPrice) : 0n,
        spotPrice: data?.spotPrice ? BigInt(data.spotPrice) : 0n,
        refetch,
        error: error ?? null,
        isLoading,
        sellLiquid: data?.sellLiquid ?? false,
        buyLiquid: data?.buyLiquid ?? false,
    };

    return (
        <LiquidMaxPainSwapContext.Provider value={value}>
            {children}
        </LiquidMaxPainSwapContext.Provider>
    );
}

export const useLiquidMaxPainSwap = () => {
    const context = useContext(LiquidMaxPainSwapContext);
    if (!context) {
        throw new Error('useLiquidMaxPainSwap must be used within LiquidMaxPainSwapProvider');
    }
    return context;
};
