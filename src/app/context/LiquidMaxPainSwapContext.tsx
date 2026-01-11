'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useReadContract, useConnection } from 'wagmi';
import type { ReactNode } from 'react';
import { parseEther } from 'viem';

interface LiquidMaxPainSwapContextType {
    refetch: () => void;
    isLoading: boolean;
    error: Error | null;
    sellPrice?: number;
    buyPrice?: number;
}

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;

const QUOTER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_QUOTER_CONTRACT_ADDRESS as `0x${string}`;
const QUOTER_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/QUOTER_ABI.json') : require('../ABI/dev/QUOTER_ABI.json');

const LiquidMaxPainSwapContext = createContext<LiquidMaxPainSwapContextType>({
    buyPrice: 0,
    sellPrice: 0,
    refetch: () => { },
    isLoading: false,
    error: null,
});

const SellConfig: any = {
    poolKey: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: LiquidMaxPain_address,
        fee: 3000,
        tickSpacing: 60,
        hooks: "0x0000000000000000000000000000000000000000",
    },
    zeroForOne: false,
    exactAmount: parseEther("100"),
    hookData: ''
}

const BuyConfig: any = {
    poolKey: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: LiquidMaxPain_address,
        fee: 3000,
        tickSpacing: 60,
        hooks: "0x0000000000000000000000000000000000000000",
    },
    zeroForOne: true,
    exactAmount: parseEther("100"),
    hookData: ''
}

export function LiquidMaxPainSwapProvider({ children }: { children: ReactNode }) {
    const { address } = useConnection();

    const [buyPrice, setBuyPrice] = useState<number>(0);
    const [sellPrice, setSellPrice] = useState<number>(0);

    const { data: sellData, isLoading: isLoadingSell, error: sellError, refetch: refetchSell } = useReadContract({
        address: QUOTER_CONTRACT_ADDRESS,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [SellConfig],
    });

    const { data: buyData, isLoading: isLoadingBuy, error: buyError, refetch: refetchBuy } = useReadContract({
        address: QUOTER_CONTRACT_ADDRESS,
        abi: QUOTER_ABI,
        functionName: 'quoteExactOutputSingle',
        args: [BuyConfig],
    });

    useEffect(() => {
        if (buyData) {
            const [amountOut, gasEstimate] = buyData as [bigint, bigint];
            setBuyPrice(Number(amountOut));
        }
        if (buyError) {
            console.error("Buy Quote failed:", buyError);
        }
    }, [buyData, buyError]);

    useEffect(() => {
        if (sellData) {
            const [amountOut, gasEstimate] = sellData as [bigint, bigint];
            setSellPrice(Number(amountOut));
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