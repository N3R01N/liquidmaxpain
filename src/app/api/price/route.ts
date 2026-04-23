import { NextResponse } from 'next/server';
import { createPublicClient, http, parseEther, keccak256, encodeAbiParameters } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY!;
const QUOTER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_QUOTER_CONTRACT_ADDRESS! as `0x${string}`;
const LQMPT_ADDRESS = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS! as `0x${string}`;
const IS_PROD = process.env.NEXT_PUBLIC_ENV === 'prod';

const QUOTER_ABI = IS_PROD
    ? require('../../ABI/prod/QUOTER_ABI.json')
    : require('../../ABI/dev/QUOTER_ABI.json');

const chain = IS_PROD ? mainnet : sepolia;
const alchemySubdomain = IS_PROD ? 'eth-mainnet' : 'eth-sepolia';

const client = createPublicClient({
    chain,
    transport: http(`https://${alchemySubdomain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
});

const POOL_MANAGER_ADDRESS = '0x000000000004444c5dc75cB358380D2e3dE08A90' as `0x${string}`;

const poolKey = {
    currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    currency1: LQMPT_ADDRESS,
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

const TOKEN_AMOUNT = parseEther('100');

const sellParams = {
    poolKey,
    zeroForOne: false as const,
    exactAmount: TOKEN_AMOUNT,
    hookData: '0x' as `0x${string}`,
};

const buyParams = {
    poolKey,
    zeroForOne: true as const,
    exactAmount: TOKEN_AMOUNT,
    hookData: '0x' as `0x${string}`,
};

/**
 * Read slot0 from the PoolManager to get the current sqrtPriceX96.
 *
 * PoolManager stores Pool.State in a mapping at slot 6.
 * slot0 packs: sqrtPriceX96 (160 bits) | tick (24 bits) | protocolFee (24 bits) | lpFee (24 bits)
 */
async function getSpotPrice(): Promise<{ sqrtPriceX96: bigint; tick: number } | null> {
    try {
        const poolId = keccak256(
            encodeAbiParameters(
                [
                    { type: 'address' },
                    { type: 'address' },
                    { type: 'uint24' },
                    { type: 'int24' },
                    { type: 'address' },
                ],
                [
                    poolKey.currency0,
                    poolKey.currency1,
                    poolKey.fee,
                    poolKey.tickSpacing,
                    poolKey.hooks,
                ],
            ),
        );

        const stateSlot = keccak256(
            encodeAbiParameters(
                [{ type: 'bytes32' }, { type: 'uint256' }],
                [poolId, 6n],
            ),
        );

        const raw = await client.getStorageAt({
            address: POOL_MANAGER_ADDRESS,
            slot: stateSlot,
        });

        if (!raw || raw === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            return null;
        }

        const val = BigInt(raw);
        const sqrtPriceX96 = val & ((1n << 160n) - 1n);
        const tickRaw = Number((val >> 160n) & ((1n << 24n) - 1n));
        const tick = tickRaw >= (1 << 23) ? tickRaw - (1 << 24) : tickRaw;

        if (sqrtPriceX96 === 0n) return null;

        return { sqrtPriceX96, tick };
    } catch (err) {
        console.error('Failed to read slot0:', err);
        return null;
    }
}

/**
 * Convert sqrtPriceX96 to an ETH amount for a given quantity of LQMPT.
 *
 * currency0 = ETH, currency1 = LQMPT
 * price = (sqrtPriceX96 / 2^96)^2 = LQMPT per ETH
 * ETH for N LQMPT = N * 2^192 / sqrtPriceX96^2
 */
function spotPriceForAmount(sqrtPriceX96: bigint, amount: bigint): bigint {
    const numerator = amount * (1n << 192n);
    const denominator = sqrtPriceX96 * sqrtPriceX96;
    return numerator / denominator;
}

export async function GET() {
    try {
        const [sellResult, buyResult] = await Promise.allSettled([
            client.readContract({
                address: QUOTER_CONTRACT_ADDRESS,
                abi: QUOTER_ABI,
                functionName: 'quoteExactInputSingle',
                args: [sellParams],
            }),
            client.readContract({
                address: QUOTER_CONTRACT_ADDRESS,
                abi: QUOTER_ABI,
                functionName: 'quoteExactOutputSingle',
                args: [buyParams],
            }),
        ]);

        const sellLiquid = sellResult.status === 'fulfilled';
        const buyLiquid = buyResult.status === 'fulfilled';

        const sellPrice = sellLiquid
            ? (sellResult.value as [bigint, bigint])[0].toString()
            : null;

        const buyPrice = buyLiquid
            ? (buyResult.value as [bigint, bigint])[0].toString()
            : null;

        // Always try to get spot price as a reference
        let spotPrice: string | null = null;
        const spot = await getSpotPrice();
        if (spot) {
            spotPrice = spotPriceForAmount(spot.sqrtPriceX96, TOKEN_AMOUNT).toString();
        }

        return NextResponse.json({
            sellPrice,
            buyPrice,
            spotPrice,
            sellLiquid,
            buyLiquid,
        });
    } catch (err) {
        console.error('Price fetch failed:', err);
        return NextResponse.json(
            { error: 'Failed to fetch prices' },
            { status: 500 },
        );
    }
}
