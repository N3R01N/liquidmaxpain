'use client';

import { useState, useEffect } from 'react';
import { Button, Select, Card, ListBox } from "@heroui/react";
import type { Key } from "react-aria-components";
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useConnection } from "wagmi";
import { useNFTs } from '../context/NFTContext';
import { useLiquidMaxPainToken } from '../context/LiquidMaxPainTokenContext';
import MAX_PAIN_ABI_DEV from '../ABI/dev/MAX_PAIN_ABI.json';
import MAX_PAIN_ABI_PROD from '../ABI/prod/MAX_PAIN_ABI.json';
import { config } from '../wagmi.config';
import { MaxPainType } from '../context/Types';
import TransactionModal from './TransactionModal';

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;
const MAX_PAIN_address = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS as `0x${string}`;
const MAX_PAIN_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? MAX_PAIN_ABI_PROD : MAX_PAIN_ABI_DEV;

export default function Liquify() {
    const [selectedMaxPain, setSelectedMaxPain] = useState<Key | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Wagmi hooks
    const { address } = useConnection({ config });
    const { balanceOfConnectedAddress, ownedNftsByConnectedAddress, mutate } = useNFTs();
    const { refetch } = useLiquidMaxPainToken();

    // Simulate contract call
    const { data: simulateSendMaxPain, isLoading: isSimulating, error: simulateError } = useSimulateContract({
        address: MAX_PAIN_address,
        abi: MAX_PAIN_ABI,
        functionName: 'safeTransferFrom',
        args: [address, LiquidMaxPain_address, selectedMaxPain],
        account: address,
        query: { enabled: !!address && !!selectedMaxPain },
    });

    // Write contract
    const { mutate: sendMaxPain, data: sendMaxPainHash, isPending: isWritePending } = useWriteContract();

    // Wait for transaction
    const { isSuccess: sendMaxPainConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: sendMaxPainHash,
    });

    // Reset selection and refresh NFTs after successful transaction
    useEffect(() => {
        if (sendMaxPainConfirmed) {
            setSelectedMaxPain(null);
            mutate();
            refetch();
        }
    }, [sendMaxPainConfirmed]);

    useEffect(() => {
        if (simulateError) {
            console.error("Simulation failed:", simulateError);
        }
    }, [simulateError]);

    useEffect(() => {
        if (sendMaxPainConfirmed && isModalOpen) {
            const timer = setTimeout(() => setIsModalOpen(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [sendMaxPainConfirmed, isModalOpen]);

    useEffect(() => {
        if (sendMaxPainHash && isConfirming) {
            setIsModalOpen(true);
        }
    }, [sendMaxPainHash, isConfirming]);

    // Handle liquify button click
    const handleLiquify = () => {
        if (simulateSendMaxPain?.request) {
            sendMaxPain(simulateSendMaxPain.request);
        }
    };

    return (
        <>
            <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto border border-stone-600'>
                <Card.Header className="items-center justify-center text-center border-b border-stone-600 pb-3">
                    <h3 className="text-xl md:text-2xl font-bold">Solidify Max Pain</h3>
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
                        <Button
                            variant="primary"
                            isDisabled={!address || Number(balanceOfConnectedAddress) === 0 || !selectedMaxPain || isSimulating}
                            onPress={handleLiquify}
                            className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
                        >
                            Liquify
                        </Button>
                    </div>
                </Card.Content>
                <Card.Footer className="flex flex-col gap-3 py-4 px-5 bg-neutral-800 min-h-[80px] justify-center">
                    <div className="flex justify-between w-full max-w-xs">
                        <span className="text-gray-400 text-sm font-medium">You give:</span>
                        <span className="font-mono text-[#75ffba] text-sm">
                            {selectedMaxPain ? `MAX PAIN #${selectedMaxPain}` : '—'}

                        </span>
                    </div>
                    <div className="flex justify-between w-full max-w-xs">
                        <span className="text-gray-400 text-sm font-medium">You get:</span>
                        <span className="font-mono text-[#75ffba] text-sm">
                            {selectedMaxPain ? `100 LQMPT` : '—'}
                        </span>
                    </div>
                </Card.Footer>
            </Card>
            <TransactionModal
                isOpen={isModalOpen}
                hash={sendMaxPainHash}
                isConfirming={isWritePending || isConfirming}
                isConfirmed={sendMaxPainConfirmed}
                action="Liquifying Max Pain..."
                image={{ src: "/liquify_animation.gif", alt: "Liquify MAX PAIN" }}
            />
        </>
    );
}