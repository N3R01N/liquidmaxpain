import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useSimulateContract,
    useConnection,
} from 'wagmi';

import { useLiquidMaxPainSwap } from '../context/LiquidMaxPainSwapContext';
import { useOpenSea } from '../context/OpenSeaContext';
import { Button } from '@heroui/react';
import TransactionModal from './TransactionModal';

const LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS =
    process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS as `0x${string}`;

const LIQUID_MAX_PAIN_ARBITRAGE_ABI =
    process.env.NEXT_PUBLIC_ENV === 'prod'
        ? require('../ABI/prod/LiquidMaxPainArbitrage_ABI.json')
        : require('../ABI/dev/LiquidMaxPainArbitrage_ABI.json');

const FulfillmentType = {
    ADVANCED: 0,
    BASIC: 1,
} as const;


export default function Arbitrage() {
    const { address } = useConnection();
    const { buyPrice } = useLiquidMaxPainSwap();
    const sellPrice = 600000000000000;
    //TODO const { buyPrice, sellPrice } = useLiquidMaxPainSwap();
    const { osData } = useOpenSea();

    const [isModalOpen, setIsModalOpen] = useState(false);

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
    const {
        mutate: writeContract,
        data: txHash,
        isPending: isWritePending,
    } = useWriteContract();

    const { isSuccess, isLoading: isConfirming } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    /* ------------------------------------------------------------
       Effects
    ------------------------------------------------------------- */
    useEffect(() => {
        if (isSuccess && isModalOpen) {
            const timer = setTimeout(() => setIsModalOpen(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, isModalOpen]);

    useEffect(() => {
        if (txHash && isConfirming) {
            setIsModalOpen(true);
        }
    }, [txHash, isConfirming]);

    /* ------------------------------------------------------------
       Handler
    ------------------------------------------------------------- */
    const handleArbitrage = () => {
        if (!osData) return;
        if (osData.type === 'basic' && basicSim?.request) {
            writeContract(basicSim.request);
        }

        if (osData.type === 'advanced' && advancedSim?.request) {
            writeContract(advancedSim.request);
        }
    };


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
        <div className="bg-neutral-900 p-2 rounded-xl flex flex-col items-center text-center">
            <h2 className="text-lg font-semibold">Current Prices</h2>

            <div className="mt-2 text-sm">
                <p>
                    Buy Price:{' '}
                    {buyPrice
                        ? Number(formatEther(BigInt(buyPrice))).toFixed(4)
                        : '0'}{' '}
                    ETH
                </p>
                <p>
                    Sell Price:{' '}
                    {sellPrice
                        ? Number(formatEther(BigInt(sellPrice))).toFixed(4)
                        : '0'}{' '}
                    ETH
                </p>
                <p>
                    OS Buy Price:{' '}
                    {osData
                        ? Number(formatEther(BigInt(osData.value))).toFixed(4)
                        : '0'}{' '}
                    ETH
                </p>
            </div>

            <Button
                className="mt-3 w-full bg-[#fc017d] text-black font-bold"
                isDisabled={
                    !osData ||
                    isBasicSimulating ||
                    isAdvancedSimulating ||
                    isWritePending
                }
                onPress={handleArbitrage}
            >
                Run Arbitrage
            </Button>

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
