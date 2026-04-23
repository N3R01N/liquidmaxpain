
import { formatEther } from 'viem';
import { useLiquidMaxPainSwap } from '../context/LiquidMaxPainSwapContext';
import { useOpenSea } from '../context/OpenSeaContext';

export default function Arbitrage() {
    const { buyPrice, sellPrice, spotPrice, sellLiquid, buyLiquid } = useLiquidMaxPainSwap();
    const { data } = useOpenSea();

    // OpenSea prices
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

    // Arbitrage only makes sense when both sides have real liquidity
    const canArbBuyOs = sellLiquid && osSellEth > 0n;
    const canArbSellOs = buyLiquid && osBuyEth > 0n;

    const profitEthBuyOs = canArbBuyOs ? sellPrice - osSellEth : 0n;
    const profitEthSellOs = canArbSellOs ? osBuyEth - buyPrice : 0n;

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
                        You buy
                    </span>
                    {buyLiquid ? (
                        <span className="text-lg font-bold text-green-400">
                            {Number(formatEther(buyPrice)).toFixed(4)} ETH
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-yellow-500">
                            No liquidity
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You sell
                    </span>
                    {sellLiquid ? (
                        <span className="text-lg font-bold text-red-400">
                            {Number(formatEther(sellPrice)).toFixed(4)} ETH
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-yellow-500">
                            No liquidity
                        </span>
                    )}
                </div>

                {spotPrice > 0n && (!sellLiquid || !buyLiquid) && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">
                                Spot price (indicative)
                            </span>
                            <span className="text-xs text-neutral-500">
                                ~{Number(formatEther(spotPrice)).toFixed(4)} ETH
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Arbitrage opportunities — only show when liquidity exists on both sides */}
            {profitEthBuyOs > 0n && (
                <div className="mt-4 flex items-center gap-3">
                    <p className="mt-2 text-xs text-green-300">
                        Arbitrage opportunity
                    </p>
                    <span className="text-xs font-medium text-neutral-400">
                        Buy on OpenSea <span className="mx-1">&rarr;</span> Sell here
                    </span>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                        +{Number(formatEther(profitEthBuyOs)).toFixed(4)}&nbsp;ETH
                    </span>
                </div>
            )}
            {profitEthSellOs > 0n && (
                <div className="mt-4 flex items-center gap-3">
                    <p className="mt-2 text-xs text-green-300">
                        Arbitrage opportunity
                    </p>
                    <span className="text-xs font-medium text-neutral-400">
                        Buy here <span className="mx-1">&rarr;</span> Sell on OpenSea
                    </span>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                        +{Number(formatEther(profitEthSellOs)).toFixed(4)}&nbsp;ETH
                    </span>
                </div>
            )}

            {(!sellLiquid || !buyLiquid) && (
                <div className="my-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
                    <p className="text-xs text-yellow-400">
                        The Uniswap pool has insufficient liquidity
                        {!sellLiquid && !buyLiquid
                            ? ' for buying and selling'
                            : !sellLiquid
                                ? ' for selling'
                                : ' for buying'}
                        . Arbitrage calculations are paused for the illiquid side.
                    </p>
                </div>
            )}

            {/* OpenSea */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="mb-3 text-sm font-medium text-neutral-400">
                    On OpenSea
                </p>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You buy
                    </span>
                    <span className="text-lg font-bold text-blue-400">
                        {osSellEth
                            ? Number(formatEther(osSellEth)).toFixed(4)
                            : '0'}{' '}
                        {osSellCurrency}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You sell
                    </span>
                    <span className="text-lg font-bold text-blue-400">
                        {osBuyEth
                            ? Number(formatEther(osBuyEth)).toFixed(4)
                            : '0'}{' '}
                        {osBuyCurrency}
                    </span>
                </div>
            </div>
        </div>
    );
}
