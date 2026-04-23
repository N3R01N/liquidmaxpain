'use client';
import { createContext, useContext } from 'react';
import { useReadContract, useConnection } from 'wagmi';
import type { ReactNode } from 'react';
interface LiquidMaxPainTokenContextType {
    balance: bigint;
    refetch: () => void;
    isLoading: boolean;
}

const LQMPT_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;
const LiquidMaxPainToken_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/LiquidMaxPainToken_ABI.json') : require('../ABI/dev/LiquidMaxPainToken_ABI.json');

const LiquidMaxPainTokenContext = createContext<LiquidMaxPainTokenContextType>({
    balance: 0n,
    refetch: () => { },
    isLoading: false,
});

export function LiquidMaxPainTokenProvider({ children }: { children: ReactNode }) {
    const { address } = useConnection();

    // ✅ Use the hook directly - no unnecessary state copying
    const { data: balance, refetch, isLoading } = useReadContract({
        address: LQMPT_address,
        abi: LiquidMaxPainToken_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            // Optional: add staleTime if you want to control caching
            staleTime: 1000 * 30, // 30 seconds
        },
    });

    const value: LiquidMaxPainTokenContextType = {
        balance: (balance as bigint) ?? 0n,
        refetch, // ✅ Expose the refetch function
        isLoading,
    };

    return (
        <LiquidMaxPainTokenContext.Provider value={value}>
            {children}
        </LiquidMaxPainTokenContext.Provider>
    );
}

export const useLiquidMaxPainToken = () => {
    const context = useContext(LiquidMaxPainTokenContext);
    if (!context) {
        throw new Error('useLiquidMaxPainToken must be used within LiquidMaxPainTokenProvider');
    }
    return context;
};