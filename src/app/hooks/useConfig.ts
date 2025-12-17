import { useEffect, useState } from 'react';

export function useConfig() {
    const [appConfig, setAppConfig] = useState<{ projectId: string, apiKey: string } | null>(null);

    useEffect(() => {
        fetch('/api/config', {  // ✅ Remove the /app prefix
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        })
            .then(res => {
                if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
                return res.json();
            })
            .then(data => setAppConfig(data))
            .catch(err => console.error('Fetch failed:', err));
    }, []);

    return appConfig;
}