import { useState, useEffect } from 'react';
import { formatEther, createPublicClient, http, encodeFunctionData, Hex } from 'viem';
import { mainnet } from 'viem/chains';
import {
    useWalletClient,
    useWaitForTransactionReceipt,
    useSimulateContract,
    useConnection,
    useReadContract,
} from 'wagmi';

import { useLiquidMaxPainSwap } from '../context/LiquidMaxPainSwapContext';
import { useOpenSea } from '../context/OpenSeaContext';
import { Button, Link } from '@heroui/react';
import TransactionModal from './TransactionModal';
import { useLiquidMaxPainToken } from '../context/LiquidMaxPainTokenContext';

const LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS =
    process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS as `0x${string}`;

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;

const ARBITRAGE_ADDRESS = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS as `0x${string}`;
const LiquidMaxPainArbitrage_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/LiquidMaxPainArbitrage_ABI.json') : require('../ABI/dev/LiquidMaxPainArbitrage_ABI.json');

const LIQUID_MAX_PAIN_ARBITRAGE_ABI =
    process.env.NEXT_PUBLIC_ENV === 'prod'
        ? require('../ABI/prod/LiquidMaxPainArbitrage_ABI.json')
        : require('../ABI/dev/LiquidMaxPainArbitrage_ABI.json');

const FulfillmentType = {
    ADVANCED: 0,
    BASIC: 1,
} as const;

const beaverBuilderClient = createPublicClient({
    chain: mainnet,
    transport: http('https://rpc.beaverbuild.org'),
});

export default function Arbitrage() {
    const { address } = useConnection();
    const { buyPrice, sellPrice } = useLiquidMaxPainSwap();
    const { osData } = useOpenSea();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
    const [isWritePending, setIsWritePending] = useState(false);

    const { balance: lqmptBalance, refetch } = useLiquidMaxPainToken();

    /**
     * Arbitrage logic:
     * Buy on OpenSea → Sell in your app
     */
    const sellEth = sellPrice ? Number(formatEther(BigInt(sellPrice))) : 0;
    const osBuyEth = osData ? Number(formatEther(BigInt(osData.value))) : 0;
    const profitEth = sellEth - osBuyEth;
    const hasProfit = profitEth > 0.01;

    const { data: memberData, isLoading: isLoadingMemberThreshold, error: memberError } = useReadContract({
        address: ARBITRAGE_ADDRESS,
        abi: LiquidMaxPainArbitrage_ABI,
        functionName: 'memberThreshold',
        args: [],
    });

    /* ------------------------------------------------------------
       BASIC ORDER SIMULATION
    ------------------------------------------------------------- */
    const { data: basicSim, isLoading: isBasicSimulating, error: basicSimulateError } = useSimulateContract({
        address: LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS,
        abi: LIQUID_MAX_PAIN_ARBITRAGE_ABI,
        functionName: 'executeArbitrage',
        args:
            osData?.type === 'basic'
                ? [
                    osData.value,                          // uint256 _buyAmount
                    BigInt(sellPrice!),                 // uint128 _sellAmount
                    address as `0x${string}`,            // beneficiary
                    FulfillmentType.BASIC,               // fulfillment type
                    {                                   // AdvancedOrder (EMPTY)
                        parameters: {
                            offerer: '0x0000000000000000000000000000000000000000',
                            zone: '0x0000000000000000000000000000000000000000',
                            offer: [],
                            consideration: [],
                            orderType: 0,
                            startTime: 0,
                            endTime: 0,
                            zoneHash: '0x' + '0'.repeat(64),
                            salt: 0n,
                            conduitKey: '0x' + '0'.repeat(64),
                            totalOriginalConsiderationItems: 0,
                        },
                        numerator: 0,
                        denominator: 0,
                        signature: '0x',
                        extraData: '0x',
                    },
                    osData.basicOrderParameters,           // BasicOrderParameters
                    [],                                  // CriteriaResolvers
                    '0x' + '0'.repeat(64),                // fulfillerConduitKey
                ]
                : undefined,
        account: address,
        query: {
            enabled:
                !!address &&
                !!osData &&
                osData.type === 'basic' &&
                !!osData.value &&
                !!sellPrice,
        },
    });

    /* ------------------------------------------------------------
       ADVANCED ORDER SIMULATION
    ------------------------------------------------------------- */
    const { data: advancedSim, isLoading: isAdvancedSimulating, error: advancedSimulateError } = useSimulateContract({
        address: LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS,
        abi: LIQUID_MAX_PAIN_ARBITRAGE_ABI,
        functionName: 'executeArbitrage',
        args:
            osData?.type === 'advanced'
                ? [
                    osData.value,                          // uint256 _buyAmount
                    BigInt(sellPrice!),                 // uint128 _sellAmount
                    address as `0x${string}`,            // beneficiary
                    FulfillmentType.ADVANCED,            // fulfillment type
                    osData.advancedOrder,                  // AdvancedOrder
                    {                                   // BasicOrderParameters (EMPTY)
                        considerationToken: '0x0000000000000000000000000000000000000000',
                        considerationIdentifier: 0n,
                        considerationAmount: 0n,
                        offerer: '0x0000000000000000000000000000000000000000',
                        zone: '0x0000000000000000000000000000000000000000',
                        offerToken: '0x0000000000000000000000000000000000000000',
                        offerIdentifier: 0n,
                        offerAmount: 0n,
                        basicOrderType: 0,
                        startTime: 0n,
                        endTime: 0n,
                        zoneHash: '0x' + '0'.repeat(64),
                        salt: 0n,
                        offererConduitKey: '0x' + '0'.repeat(64),
                        fulfillerConduitKey: osData.fulfillerConduitKey,
                        totalOriginalAdditionalRecipients: 0n,
                        additionalRecipients: [],
                        signature: '0x',
                    },
                    osData.criteriaResolvers,              // CriteriaResolvers
                    osData.fulfillerConduitKey,            // fulfillerConduitKey
                ]
                : undefined,
        account: address,
        query: {
            enabled:
                !!address &&
                !!osData &&
                osData.type === 'advanced' &&
                !!osData.value &&
                !!sellPrice,
        },
    });


    /* ------------------------------------------------------------
       WRITE CONTRACT
    ------------------------------------------------------------- */
    const { data: walletClient } = useWalletClient();

    /* ------------------------------------------------------------
       Effects
    ------------------------------------------------------------- */
    const { isSuccess, isLoading: isConfirming } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    /* ------------------------------------------------------------
       Handler
    ------------------------------------------------------------- */
    const handleArbitrage = async () => {
        if (!walletClient || !address || !osData) return;
        try {

            setIsWritePending(true);

            const sim =
                osData.type === 'basic'
                    ? basicSim
                    : osData.type === 'advanced'
                        ? advancedSim
                        : null;

            console.log('Simulation result:', osData);

            if (!sim?.request) return;

            let calldata: Hex;

            if ('data' in sim.request && sim.request.data) {
                calldata = sim.request.data as Hex;
            } else {
                calldata = encodeFunctionData({
                    abi: LIQUID_MAX_PAIN_ARBITRAGE_ABI,
                    functionName: 'executeArbitrage',
                    args: sim.request.args as any[],
                });
            }

            // Build unsigned transaction
            const unsignedTx = {
                to: sim.request.address,
                data: calldata,
                value: sim.request.value ?? 0n,
                gas: sim.request.gas,
                maxFeePerGas: sim.request.maxFeePerGas,
                maxPriorityFeePerGas: sim.request.maxPriorityFeePerGas,
                nonce: await beaverBuilderClient.getTransactionCount({
                    address,
                }),
                chainId: sim.request.chainId,
                type: 'eip1559' as const,
            };

            console.log('unsignedTx:', unsignedTx);

            console.log('Signing transaction...', walletClient);

            // Sign locally in wallet
            const signedTx = await walletClient.signTransaction(unsignedTx);

            // Send raw tx to Beaver Builder
            const hash = await beaverBuilderClient.sendRawTransaction({
                serializedTransaction: signedTx,
            });

            setTxHash(hash);
            setIsModalOpen(true);
        } catch (err) {
            console.error('Arbitrage tx failed:', err);
        } finally {
            setIsWritePending(false);
        }
    };


    /* ------------------------------------------------------------
        ERRORS reading Blockchain data
     ------------------------------------------------------------- */
    useEffect(() => {
        if (memberError) {
            console.error("Advanced simulation failed:", memberError);
        }
    }, [memberError]);

    useEffect(() => {
        if (advancedSimulateError) {
            console.error("Advanced simulation failed:", advancedSimulateError);
        }
    }, [advancedSimulateError]);

    useEffect(() => {
        if (basicSimulateError) {
            console.error("Basic simulation failed:", basicSimulateError);
        }
    }, [basicSimulateError]);
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
                        You buy Max Pain here
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
                        You sell Max Pain here
                    </span>
                    <span className="text-lg font-bold text-red-400">
                        {sellPrice
                            ? Number(formatEther(BigInt(sellPrice))).toFixed(4)
                            : '0'}{' '}
                        ETH
                    </span>
                </div>
            </div>

            {/* OpenSea */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="mb-3 text-sm font-medium text-neutral-400">
                    On OpenSea
                </p>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-300">
                        You buy Max Pain on OpenSea
                    </span>
                    <span className="text-lg font-bold text-blue-400">
                        {osData
                            ? Number(formatEther(BigInt(osData.value))).toFixed(4)
                            : '0'}{' '}
                        ETH
                    </span>
                </div>
            </div>
            {/* Arbitrage Badge */}
            {hasProfit && (
                <div className="mt-4 flex items-center gap-3">
                    <p className="mt-2 text-xs text-green-400">
                        Arbitrage opportunity detected
                    </p>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                        +{profitEth.toFixed(4)} ETH
                    </span>
                </div>
            )}

            {/* CTA */}
            {lqmptBalance >= (memberData as bigint ?? 0n) ? (
                <Button
                    className="mt-5 w-full rounded-xl bg-[#fc017d] py-2 font-bold text-black hover:opacity-90"
                    isDisabled={
                        !osData ||
                        isBasicSimulating ||
                        isAdvancedSimulating ||
                        isWritePending ||
                        !hasProfit
                    }
                    onPress={handleArbitrage}
                >
                    {hasProfit
                        ? 'Run Arbitrage Strategy'
                        : 'No Arbitrage Opportunity'}
                </Button>
            ) : (
                <Link
                    href={`https://app.uniswap.org/swap?chain=mainnet&inputCurrency=NATIVE&outputCurrency=${LiquidMaxPain_address}`}
                    target="_blank"
                    className="mt-5 block text-center text-sm font-medium text-[#fc017d] hover:underline"
                >
                    Buy at least 1 LQMPT to run arbitrage →
                </Link>
            )}

            <TransactionModal
                isOpen={isModalOpen}
                hash={txHash}
                isConfirming={isWritePending || isConfirming}
                isConfirmed={isSuccess}
                action="Running Arbitrage Strategy for MAX PAIN…"
                image={{
                    src: '/liquify_animation.gif',
                    alt: 'Arbitrage MAX PAIN',
                }}
            />
        </div>

    );
}
