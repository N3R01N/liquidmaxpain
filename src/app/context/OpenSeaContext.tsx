'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useConfig } from '../hooks/useConfig';

interface OpenSeaListing {
    price: number;
    orderHash: string;
    inputData: any;
}

interface OpenSeaContextType {
    data: OpenSeaListing | null;
    isLoading: boolean;
    error: boolean | unknown;
    mutate: () => void;
}

const defaultContext: OpenSeaContextType = {
    data: null,
    isLoading: true,
    error: false,
    mutate: () => { }
};

const OpenSeaContext = createContext<OpenSeaContextType>(defaultContext);

const fetchBestListing = async () => {
    const res = await fetch(`/api/opensea`);
    if (!res.ok) {
        throw new Error('Failed to fetch OpenSea listing');
    }
    return res.json();
};

export function OpenSeaProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        setReady(true);
    }, []);

    const { data, isLoading, error } = useQuery({
        queryKey: ['opensea-best-listing'],
        queryFn: () => fetchBestListing(),
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
        data: data ?? null,
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

export const useOpenSea = () => {
    const context = useContext(OpenSeaContext);
    if (!context) {
        throw new Error('useOpenSea must be used within OpenSeaProvider');
    }
    return context;
};
