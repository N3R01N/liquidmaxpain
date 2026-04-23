import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

export function createWagmiConfig(projectId: string) {
    return getDefaultConfig({
        appName: 'LiquidMaxPain',
        projectId,
        chains: [mainnet, sepolia],
    });
}