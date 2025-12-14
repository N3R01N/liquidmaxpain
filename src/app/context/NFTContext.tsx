'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnection } from 'wagmi';
import { config } from '../wagmi.config';
import { MaxPainType } from './Types';
import type { ReactNode } from 'react';
import { Address } from 'viem';

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
    mutate: () => { console.log("mutate") }
}
const NFTContext = createContext<NFTContextType>(defaultContext);

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const alchemyNftEndpoint = process.env.NEXT_PUBLIC_ALCHEMY_NFT_URL;
const maxPainAddress = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS;

// Fetcher function (unchanged)
const fetchMaxPainInWallet = async (address: Address) => {


    if (!address) {
        return { balance: 0, ownedNfts: [] };
    }

    const endpoint = `${alchemyNftEndpoint}/${alchemyApiKey}/getNFTsForOwner?owner=${address}&contractAddresses%5B%5D=${maxPainAddress}&withMetadata=false&pageSize=100`;

    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
        balance: data.totalCount || 0,
        ownedNfts: data.ownedNfts?.map((nft: MaxPainType) => ({
            tokenId: nft.tokenId,
            name: `MAX PAIN #${Number(nft.tokenId) % 10 ** 4}/7394`
        })) || []
    };
};

export function NFTProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        setReady(true);
    }, []);

    const { address } = useConnection({ config });
    const queryClient = useQueryClient();

    if (!address || !LiquidMaxPain_address) {
        return <NFTContext.Provider value={defaultContext}>{children}</NFTContext.Provider>;
    }

    // Fetch data for connected address
    const { data: data1, isLoading: isLoading1, error: error1 } = useQuery({
        queryKey: ['nfts', address],
        queryFn: () => fetchMaxPainInWallet(address),
        enabled: !!address && ready,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });


    // Fetch data for LiquidMaxPain address
    const { data: data2, isLoading: isLoading2, error: error2 } = useQuery({
        queryKey: ['nfts', LiquidMaxPain_address],
        queryFn: () => fetchMaxPainInWallet(LiquidMaxPain_address),
        enabled: !!LiquidMaxPain_address && ready,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    // Combine states
    const isLoading = isLoading1 || isLoading2;
    const error = error1 || error2;

    // Mutate function invalidates both queries
    const mutate = () => {
        queryClient.invalidateQueries({ queryKey: ['nfts'] });
    };

    const value: NFTContextType = {
        balanceOfConnectedAddress: data1?.balance || 0,
        ownedNftsByConnectedAddress: data1?.ownedNfts || [],
        balanceOfLiquidMaxPain: data2?.balance || 0,
        ownedNftsByLiquidMaxPain: data2?.ownedNfts || [],
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