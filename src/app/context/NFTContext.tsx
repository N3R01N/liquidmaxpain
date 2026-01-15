'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnection } from 'wagmi';
import { MaxPainType } from './Types';
import type { ReactNode } from 'react';

interface NFTContextType {
    balanceOfConnectedAddress: number;
    ownedNftsByConnectedAddress: MaxPainType[];
    balanceOfLiquidMaxPain: number;
    ownedNftsByLiquidMaxPain: MaxPainType[];
    isLoading: boolean;
    error: boolean | unknown;
    mutate: () => void;
}

const defaultContext = {
    balanceOfConnectedAddress: 0,
    ownedNftsByConnectedAddress: [],
    balanceOfLiquidMaxPain: 0,
    ownedNftsByLiquidMaxPain: [],
    isLoading: true,
    error: false,
    mutate: () => { }
}
const NFTContext = createContext<NFTContextType>(defaultContext);

const fetchNFTsFromAPI = async (address: string) => {
    const res = await fetch(`/api/nft?address=${address}`);
    if (!res.ok) {
        throw new Error('Failed to fetch NFTs');
    }
    return res.json();
};

export function NFTProvider({ children }: { children: ReactNode }) {
    // ✅ ALL hooks at the top level - UNCONDITIONAL
    const [ready, setReady] = useState(false);
    const { address } = useConnection();
    const queryClient = useQueryClient();

    // ✅ useEffect stays at top level
    useEffect(() => {
        setReady(true);
    }, []);

    // ✅ useQuery hooks are ALWAYS called, but conditionally enabled
    const { data: data, isLoading: isLoading, error: error } = useQuery({
        queryKey: ['nfts', address],
        queryFn: () => fetchNFTsFromAPI(address!),
        enabled: !!address && ready,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const mutate = useCallback(() => {
        queryClient.refetchQueries({ queryKey: ['nfts'] });
    }, [queryClient]);

    let value: NFTContextType = {
        balanceOfConnectedAddress: data?.user?.balance || 0,
        ownedNftsByConnectedAddress: data?.user?.ownedNfts || [],
        balanceOfLiquidMaxPain: data?.contract?.balance || 0,
        ownedNftsByLiquidMaxPain: data?.contract?.ownedNfts || [],
        isLoading,
        error,
        mutate,
    };

    return <NFTContext.Provider value={value}>{children}</NFTContext.Provider>;
}

export const useNFTs = () => {
    const context = useContext(NFTContext);
    if (!context) {
        throw new Error('useNFTs must be used within NFTProvider');
    }
    return context;
};