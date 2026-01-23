
import { formatEther } from 'viem';
import { useLiquidMaxPainSwap } from '../context/LiquidMaxPainSwapContext';
import { useOpenSea } from '../context/OpenSeaContext';

export default function Arbitrage() {
    const { buyPrice, sellPrice } = useLiquidMaxPainSwap();
    const { data } = useOpenSea();

    /**
     * Arbitrage logic:
     * Buy on OpenSea → Sell in your app
     */
    // get prices in wei as bigint
    const osBuyEth: bigint = data?.offer
        ? BigInt(data.offer.priceWei)
        : 0n;

    const osBuyCurrency = data?.offer
        ? data.offer.currency
        : null;

    const osSellEth: bigint = data?.listing
        ? BigInt(data.listing.priceWei)
        : 0n;

    const osSellCurrency = data?.listing
        ? data.listing.currency
        : null;

    // your app prices (assume they are already bigint!)
    const appBuyEth: bigint = BigInt(buyPrice!) ?? 0n;
    const appSellEth: bigint = BigInt(sellPrice!) ?? 0n;

    // Profit calculations in wei
    const profitEthBuyOs: bigint = appSellEth - osSellEth; // Buy on OpenSea, sell here
    const profitEthSellOs: bigint = osBuyEth - appBuyEth; // Buy here, sell on OpenSea


    /* ------------------------------------------------------------
       UI
    ------------------------------------------------------------- */
    return (
        <div className="mt-6 w-full max-w-md rounded-2xl bg-neutral-900 p-4 text-white shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
                Max Pain Price Comparison
            </h2>

            {/* Your App */}
            <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="mb-3 text-sm font-medium text-neutral-400">
                    In this app
                </p>

                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-300">
                        You buy here
                    </span>
                    <span className="text-lg font-bold text-green-400">
                        {buyPrice
                            ? Number(formatEther(BigInt(buyPrice))).toFixed(4)
                            : '0'}{' '}
                        ETH
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You sell here
                    </span>
                    <span className="text-lg font-bold text-red-400">
                        {sellPrice
                            ? Number(formatEther(BigInt(sellPrice))).toFixed(4)
                            : '0'}{' '}
                        ETH
                    </span>
                </div>
            </div>
            {profitEthBuyOs > 0 && (
                <div className="mt-4 flex items-center gap-3">
                    <p className="mt-2 text-xs text-green-300">
                        Arbitrage opportunity
                    </p>
                    <span className="text-xs font-medium text-neutral-400">
                        Buy on OpenSea <span className="mx-1">→</span> Sell here
                    </span>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                        +{Number(formatEther(BigInt(profitEthBuyOs))).toFixed(4)}&nbsp;ETH
                    </span>
                </div>
            )}
            {profitEthSellOs > 0 && (
                <div className="mt-4 flex items-center gap-3">
                    <p className="mt-2 text-xs text-green-300">
                        Arbitrage opportunity
                    </p>
                    <span className="text-xs font-medium text-neutral-400">
                        Buy here <span className="mx-1">→</span> Buy on OpenSea
                    </span>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                        +{Number(formatEther(BigInt(profitEthSellOs))).toFixed(4)}
                        ETH
                    </span>
                </div>
            )}

            {/* OpenSea */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="mb-3 text-sm font-medium text-neutral-400">
                    On OpenSea
                </p>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You buy on OpenSea
                    </span>
                    <span className="text-lg font-bold text-blue-400">
                        {osSellEth
                            ? Number(formatEther(BigInt(osSellEth))).toFixed(4)
                            : '0'}{' '}
                        {osSellCurrency}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You sell on OpenSea
                    </span>
                    <span className="text-lg font-bold text-blue-400">
                        {osBuyEth
                            ? Number(formatEther(BigInt(osBuyEth))).toFixed(4)
                            : '0'}{' '}
                        {osBuyCurrency}
                    </span>
                </div>
            </div>
        </div>
    );
}
