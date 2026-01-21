'use client';

import { useState, useEffect } from 'react';
import { Button, Select, Card, ListBox } from "@heroui/react";
import type { Key } from "react-aria-components";
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useConnection, useReadContract } from "wagmi";
import { useLiquidMaxPainSwap } from '../context/LiquidMaxPainSwapContext';
import { useNFTs } from '../context/NFTContext';
import { MaxPainType } from '../context/Types';
import TransactionModal from './TransactionModal';
import { formatEther } from 'viem';

const MAX_PAIN_address = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS as `0x${string}`;
const MAX_PAIN_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/MAX_PAIN_ABI.json') : require('../ABI/dev/MAX_PAIN_ABI.json');

const LiquidMaxpainSwap_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_SWAP_ADDRESS as `0x${string}`;
const LIQUID_MAX_PAIN_SWAP_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/LiquidMaxPainSwap_ABI.json') : require('../ABI/dev/LiquidMaxPainSwap_ABI.json');

interface LiquifyProps {
    playAudio: () => void | Promise<void>;
}

export default function LiquifyETH({ playAudio }: LiquifyProps) {
    const [selectedMaxPain, setSelectedMaxPain] = useState<Key | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Wagmi hooks
    const { address } = useConnection();
    const { balanceOfConnectedAddress, ownedNftsByConnectedAddress, mutate } = useNFTs();
    const { sellPrice, refetch } = useLiquidMaxPainSwap();

    const [isApproved, setIsApproved] = useState<boolean>(false);

    // Simulate contract call
    const { data: simulateApproveAllMaxPain, isLoading: isSimulating, error: simulateError } = useSimulateContract({
        address: MAX_PAIN_address,
        abi: MAX_PAIN_ABI,
        functionName: 'setApprovalForAll',
        args: [LiquidMaxpainSwap_address, true],
        account: address,
        query: { enabled: !!address && !isApproved },
    });

    const { mutate: sellMaxPain, data: sellMaxPainHash, isPending: isSellPending } = useWriteContract();

    // Write contract
    const { mutate: approveMaxPain, data: approveMaxPainHash, isPending: isApprovePending } = useWriteContract();

    const { data: isApprovedForAllData, error: approvedError, refetch: refetchIsApprovedForAll } = useReadContract({
        address: MAX_PAIN_address,
        abi: MAX_PAIN_ABI,
        functionName: 'isApprovedForAll',
        args: [address as `0x${string}`, LiquidMaxpainSwap_address],
        query: { enabled: !!address },
    });

    const { data: simulateSellMaxPain, isLoading: isSimulatingSell, error: simulateSellError } = useSimulateContract({
        address: LiquidMaxpainSwap_address,
        abi: LIQUID_MAX_PAIN_SWAP_ABI,
        functionName: 'swapMaxPainForEth',
        args: [BigInt(sellPrice as number), address as `0x${string}`, selectedMaxPain as Key],
        account: address,
        query: { enabled: !!selectedMaxPain && !!address && isApproved && !!sellPrice },
    });

    useEffect(() => {
        if (approvedError) {
            console.error("Approval check failed:", approvedError);
        }
        if (isApprovedForAllData !== undefined) {
            setIsApproved(isApprovedForAllData as boolean);
        }
    }, [isApprovedForAllData, approvedError]);

    // Wait for transaction
    const { isSuccess: sellMaxPainConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: sellMaxPainHash,
    });

    const { isSuccess: approveMaxPainConfirmed, isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
        hash: approveMaxPainHash,
    });

    useEffect(() => {
        if (approveMaxPainConfirmed) {
            refetchIsApprovedForAll();
        }
    }, [approveMaxPainConfirmed]);

    // Reset selection and refresh NFTs after successful transaction
    useEffect(() => {
        if (sellMaxPainConfirmed) {
            setSelectedMaxPain(null);
            refetch();
            mutate();
            playAudio()
        }
    }, [sellMaxPainConfirmed]);

    useEffect(() => {
        if (simulateError) {
            console.error("Sell Simulation failed:", simulateError);
        }
    }, [simulateError]);

    useEffect(() => {
        if (sellMaxPainConfirmed && isModalOpen) {
            const timer = setTimeout(() => setIsModalOpen(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [sellMaxPainConfirmed, isModalOpen]);

    useEffect(() => {
        if (sellMaxPainHash && isConfirming) {
            setIsModalOpen(true);
        }
    }, [sellMaxPainHash, isConfirming]);

    // Handle approval if not approved
    const handleApprove = () => {
        if (simulateApproveAllMaxPain?.request) {
            approveMaxPain(simulateApproveAllMaxPain.request);
        }
    };

    // Handle Sell button click
    const handleSell = () => {
        if (simulateSellMaxPain?.request) {
            sellMaxPain(simulateSellMaxPain.request);
        }
    };

    return (
        <>
            <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto border border-stone-600'>
                <Card.Header className="items-center justify-center text-center border-b border-stone-600 pb-3">
                    <h3 className="text-xl md:text-2xl font-bold">Sell Max Pain</h3>
                </Card.Header>
                <Card.Content className="items-center justify-center py-5">
                    <div className='flex flex-col w-64 items-center justify-center gap-4'>
                        <Select
                            className="w-[256px] data-[open=true]:bg-neutral-800"
                            placeholder="Select max pain to liquify"
                            aria-label="Select max pain to liquify"
                            value={selectedMaxPain}
                            onChange={setSelectedMaxPain}>
                            <Select.Trigger className="bg-neutral-800 text-[#75ffba] data-[placeholder]:text-[#75ffba] hover:bg-stone-700 transition-colors">
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className="bg-neutral-800 border border-stone-600">
                                <ListBox>
                                    {ownedNftsByConnectedAddress.map((nft: MaxPainType) => {
                                        return (
                                            <ListBox.Item
                                                key={nft.tokenId}
                                                id={nft.tokenId}
                                                textValue={nft.name}
                                                className="text-[#75ffba] hover:bg-stone-700 data-[selected=true]:bg-[#fc017d] data-[selected=true]:text-black"
                                            >
                                                {nft.name}
                                            </ListBox.Item>
                                        )
                                    })}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                        {isApproved ? (<Button
                            variant="primary"
                            isDisabled={!address || Number(balanceOfConnectedAddress) === 0 || !selectedMaxPain || isSimulating}
                            onPress={handleSell}
                            className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
                        >
                            Sell
                        </Button>) : (
                            <Button
                                variant="primary"
                                onPress={handleApprove}
                                className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
                            >
                                Approve Max Pain
                            </Button>
                        )}
                    </div>
                </Card.Content>
                <Card.Footer className="flex flex-col gap-3 py-4 px-5 bg-neutral-800 min-h-[80px] justify-center">
                    <div className="flex justify-between w-full max-w-xs">
                        <span className="text-gray-400 text-sm font-medium">You give:</span>
                        <span className="font-mono text-[#75ffba] text-sm">
                            {selectedMaxPain ? `MAX PAIN #${Number(selectedMaxPain) % 10 ** 4}` : '—'}

                        </span>
                    </div>
                    <div className="flex justify-between w-full max-w-xs">
                        <span className="text-gray-400 text-sm font-medium">You get:</span>
                        <span className="font-mono text-[#75ffba] text-sm">
                            {selectedMaxPain ? `${sellPrice ? Number(formatEther(BigInt(sellPrice))).toFixed(4) : '0'} ETH` : '—'}
                        </span>
                    </div>
                </Card.Footer>
            </Card>
            <TransactionModal
                isOpen={isModalOpen}
                hash={sellMaxPainHash}
                isConfirming={isSellPending || isConfirming}
                isConfirmed={sellMaxPainConfirmed}
                action="Selling Max Pain..."
                image={{ src: "/liquify_animation.gif", alt: "Sell MAX PAIN" }}
            />
        </>
    );
}