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

type BasicOrderResponse = {
    type: 'basic';
    chain: string;
    value: string;
    basicOrderParameters: any;
};

type AdvancedOrderResponse = {
    type: 'advanced';
    chain: string;
    value: string;
    advancedOrder: any;
    criteriaResolvers: any[];
    fulfillerConduitKey: string;
};

type OpenSeaListing = BasicOrderResponse | AdvancedOrderResponse;

interface OpenSeaContextType {
    osData: OpenSeaListing | null;
    isLoading: boolean;
    error: boolean | unknown;
    mutate: () => void;
}

/* ------------------------------------------------------------
   Context
------------------------------------------------------------- */

const defaultContext: OpenSeaContextType = {
    osData: null,
    isLoading: true,
    error: false,
    mutate: () => { },
};

const OpenSeaContext = createContext<OpenSeaContextType>(defaultContext);

/* ------------------------------------------------------------
   Fetcher
------------------------------------------------------------- */

const fetchBestListing = async (): Promise<OpenSeaListing> => {
    const res = await fetch('/api/opensea');
    if (!res.ok) {
        throw new Error('Failed to fetch OpenSea listing');
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

    const { data, isLoading, error } = useQuery<OpenSeaListing>({
        queryKey: ['opensea-best-listing'],
        queryFn: fetchBestListing,
        enabled: ready,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const mutate = useCallback(() => {
        queryClient.refetchQueries({
            queryKey: ['opensea-best-listing'],
        });
    }, [queryClient]);

    const value: OpenSeaContextType = {
        osData: data ?? null,
        isLoading,
        error,
        mutate,
    };

    return (
        <OpenSeaContext.Provider value={value}>
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
