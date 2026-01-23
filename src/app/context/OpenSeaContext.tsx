'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/* ------------------------------------------------------------
   Types
------------------------------------------------------------- */

type PriceData = {
    priceWei: string;
    currency: string;
};

export type OpenSeaMarketData = {
    nft: {
        tokenId: string;
    };
    listing: PriceData;
    offer: PriceData | null;
};

interface OpenSeaContextType {
    data: OpenSeaMarketData | null;
    isLoading: boolean;
    error: boolean | unknown;

    /** utils */
    refetch: () => void;
}

/* ------------------------------------------------------------
   Context
------------------------------------------------------------- */

const defaultContext: OpenSeaContextType = {
    data: null,
    isLoading: true,
    error: false,
    refetch: () => { },
};

const OpenSeaContext = createContext<OpenSeaContextType>(defaultContext);

/* ------------------------------------------------------------
   Fetcher
------------------------------------------------------------- */

const fetchMarketData = async (): Promise<OpenSeaMarketData> => {
    const res = await fetch('/api/opensea');
    if (!res.ok) {
        throw new Error('Failed to fetch OpenSea market data');
    }
    return res.json();
};

/* ------------------------------------------------------------
   Provider
------------------------------------------------------------- */

export function OpenSeaProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        setReady(true);
    }, []);

    const { data, isLoading, error } = useQuery<OpenSeaMarketData>({
        queryKey: ['opensea-market-data'],
        queryFn: fetchMarketData,
        enabled: ready,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    /* ------------------------------------------------------------
       Actions
    ------------------------------------------------------------- */

    const refetch = useCallback(() => {
        queryClient.refetchQueries({
            queryKey: ['opensea-market-data'],
        });
    }, [queryClient]);

    return (
        <OpenSeaContext.Provider
            value={{
                data: data ?? null,
                isLoading,
                error,
                refetch,
            }}
        >
            {children}
        </OpenSeaContext.Provider>
    );
}

/* ------------------------------------------------------------
   Hook
------------------------------------------------------------- */

export const useOpenSea = () => {
    const context = useContext(OpenSeaContext);
    if (!context) {
        throw new Error('useOpenSea must be used within OpenSeaProvider');
    }
    return context;
};
