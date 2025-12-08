
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';

// Create Context
const NFTContext = createContext();

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;

// Fetcher function (unchanged)
const fetchMaxPainInWallet = async (address) => {
    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const alchemyNftEndpoint = process.env.NEXT_PUBLIC_ALCHEMY_NFT_URL;
    const maxPainAddress = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS;

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
        ownedNfts: data.ownedNfts?.map((nft) => ({
            id: nft.tokenId,
            name: `MAX PAIN #${nft.tokenId % 10 ** 4}/7394`
        })) || []
    };
};

// Provider Component - now accepts two address props
export function NFTProvider({ children }) {

    const [ready, setReady] = useState(false);
     
      useEffect(() => {
        setReady(true);
      }, []);

    const {address} = useAccount();
    // Fetch data for first address
    const { data: data1, error: error1, isLoading: isLoading1, mutate: mutate1 } = useSWR(
        address ? `nfts-${address}` : null,
        () => fetchMaxPainInWallet(address),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Fetch data for second address
    const { data: data2, error: error2, isLoading: isLoading2, mutate: mutate2 } = useSWR(
        LiquidMaxPain_address ? `nfts-${LiquidMaxPain_address}` : null,
        () => fetchMaxPainInWallet(LiquidMaxPain_address),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Combine states
    const isLoading = isLoading1 || isLoading2;
    const error = error1 || error2;
    const mutate = () => {
        mutate1();
        mutate2();
    };

    const value = {
        // First address data
        balanceOfConnectedAddress: data1?.balance || 0,
        ownedNftsByConnectedAddress: data1?.ownedNfts || [],

        // Second address data
        balanceOfLiquidMaxPain: data2?.balance || 0,
        ownedNftsByLiquidMaxPain: data2?.ownedNfts || [],
        
        isLoading,
        error,
        mutate,
    };

    return <NFTContext.Provider value={value}>{children}</NFTContext.Provider>;
}

// Custom Hook
export const useNFTs = () => {
    const context = useContext(NFTContext);
    if (!context) {
        throw new Error('useNFTs must be used within NFTProvider');
    }
    return context;
};