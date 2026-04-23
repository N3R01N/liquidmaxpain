'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useReadContract, useConnection } from 'wagmi';
import type { ReactNode } from 'react';
import { parseEther } from 'viem';

interface LiquidMaxPainSwapContextType {
    refetch: () => void;
    isLoading: boolean;
    error: Error | null;
    sellPrice: bigint;
    buyPrice: bigint;
}

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;

const QUOTER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_QUOTER_CONTRACT_ADDRESS as `0x${string}`;
const QUOTER_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/QUOTER_ABI.json') : require('../ABI/dev/QUOTER_ABI.json');

const LiquidMaxPainSwapContext = createContext<LiquidMaxPainSwapContextType>({
    buyPrice: 0n,
    sellPrice: 0n,
    refetch: () => { },
    isLoading: false,
    error: null,
});

const SellConfig = {
    poolKey: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: LiquidMaxPain_address,
        fee: 3000,
        tickSpacing: 60,
        hooks: "0x0000000000000000000000000000000000000000",
    },
    zeroForOne: false,
    exactAmount: parseEther("100"),
    hookData: '0x' as `0x${string}`,
} as const;

const BuyConfig = {
    poolKey: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: LiquidMaxPain_address,
        fee: 3000,
        tickSpacing: 60,
        hooks: "0x0000000000000000000000000000000000000000",
    },
    zeroForOne: true,
    exactAmount: parseEther("100"),
    hookData: '0x' as `0x${string}`,
} as const;

export function LiquidMaxPainSwapProvider({ children }: { children: ReactNode }) {
    const { address } = useConnection();

    const [buyPrice, setBuyPrice] = useState<bigint>(0n);
    const [sellPrice, setSellPrice] = useState<bigint>(0n);

    const { data: sellData, isLoading: isLoadingSell, error: sellError, refetch: refetchSell } = useReadContract({
        address: QUOTER_CONTRACT_ADDRESS,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [SellConfig],
        query: {
            staleTime: 1000 * 30,
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        },
    });

    const { data: buyData, isLoading: isLoadingBuy, error: buyError, refetch: refetchBuy } = useReadContract({
        address: QUOTER_CONTRACT_ADDRESS,
        abi: QUOTER_ABI,
        functionName: 'quoteExactOutputSingle',
        args: [BuyConfig],
        query: {
            staleTime: 1000 * 30,
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        },
    });

    useEffect(() => {
        if (buyData) {
            const [amountOut] = buyData as [bigint, bigint];
            setBuyPrice(amountOut);
        }
        if (buyError) {
            console.error("Buy Quote failed:", buyError);
        }
    }, [buyData, buyError]);

    useEffect(() => {
        if (sellData) {
            const [amountOut] = sellData as [bigint, bigint];
            setSellPrice(amountOut);
        }
        if (sellError) {
            console.error("Sell Quote failed:", sellError);
        }
    }, [sellData, sellError]);

    const value: LiquidMaxPainSwapContextType = {
        sellPrice: sellPrice,
        buyPrice: buyPrice,
        refetch: () => { refetchSell(); refetchBuy(); }, // ✅ Expose the refetch function
        error: sellError || buyError,
        isLoading: isLoadingSell || isLoadingBuy,
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