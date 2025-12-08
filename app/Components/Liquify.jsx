'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Button, Select, SelectItem, Spinner } from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";
import '@rainbow-me/rainbowkit/styles.css';
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useAccount } from "wagmi";
import { useQueryTrigger } from '../QueryTriggerContext';
import { useNFTs } from '../context/NFTContext';
import TransactionModal from './TransactionModal';

import MAX_PAIN_ABI from "../ABI/MAX_PAIN_ABI.json";
const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;
const MAX_PAIN_address = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS;

export default function Liquify() {
    const [maxPainToLiquify, setMaxPainToLiquify] = useState("");
    const { toggleQueryTrigger } = useQueryTrigger();
    const inputRef = useRef(null);

    const { address, isConnected } = useAccount();
    const { balanceOfConnectedAddress, ownedNftsByConnectedAddress, isLoading, mutate } = useNFTs();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: simulateSendMaxPain } = useSimulateContract({
        address: MAX_PAIN_address,
        abi: MAX_PAIN_ABI,
        functionName: 'safeTransferFrom',
        args: [address, LiquidMaxPain_address, maxPainToLiquify],
        account: address,
    });
    const { writeContract: sendMaxPain, data: sendMaxPainHash, isPending: isWritePending } = useWriteContract();

    const { isSuccess: sendMaxPainConfirmed, isLoading: isConfirming } =
        useWaitForTransactionReceipt({
            hash: sendMaxPainHash,
        })

    useEffect(() => {
        if (sendMaxPainHash && !sendMaxPainConfirmed) {
            setIsModalOpen(true);
        }
    }, [sendMaxPainConfirmed, sendMaxPainHash])

    const closeModal = () => {
        if (!isWritePending && !isConfirming) {
            setIsModalOpen(false);
        }
    }

    useEffect(() => {
        if (sendMaxPainConfirmed) {
            toggleQueryTrigger();
            setMaxPainToLiquify("");
            mutate();
        }
    }, [sendMaxPainConfirmed]);

    useEffect(() => {
        if (inputRef.current && maxPainToLiquify != "") {
            inputRef.current.focus();
        }
    }, [maxPainToLiquify]);

    return (
        <main>
            <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto '>
                <CardHeader className="items-center justify-center text-center border-b-3 border-stone-600">
                    <h3 className="text-xl md:text-2xl">Liquify MAX PAIN</h3>
                </CardHeader>
                <CardBody className="items-center justify-center">
                    <div className='flex flex-col w-64 pb-3 items-center justify-center mt-2'>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Spinner
                                    size="sm"
                                    color="success"
                                    className="text-[#75ffba]"
                                />
                                <p className="mt-3 text-sm text-gray-300">Loading your MAX PAIN NFTs...</p>
                            </div>
                        ) : (
                            <Select
                                ref={inputRef}
                                placeholder='Select Max Pain to Liquify'
                                selectedKeys={maxPainToLiquify ? [maxPainToLiquify.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const key = Array.from(keys)[0];
                                    setMaxPainToLiquify(Number(key));
                                }}
                                label={
                                    <>
                                        Balance:&nbsp;
                                        <button className="hover:underline" disabled={!isConnected || !Number(balanceOfConnectedAddress) > 0} onClick={() => setMaxPainToLiquify(Number(balanceOfConnectedAddress))}>
                                            {Number(balanceOfConnectedAddress)} MAX PAIN
                                        </button>
                                    </>
                                }
                                className='mb-1 text-white'
                            >
                                {ownedNftsByConnectedAddress.map(nft => (
                                    <SelectItem key={nft.id} value={nft.name}>
                                        {nft.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        )}
                        <Button
                            variant="solid"
                            isDisabled={balanceOfConnectedAddress == 0 || !(maxPainToLiquify > 0)}
                            onPress={() => sendMaxPain(simulateSendMaxPain?.request)}
                            className="text-black bg-[#fc017d] mt-1 text-md w-full"
                        >
                            Liquify
                        </Button>
                    </div>
                </CardBody>
                <CardFooter className="flex flex-col gap-2 py-3 px-4 bg-neutral-800 min-h-[80px] justify-center">
                    <div className="flex justify-between w-full max-w-xs">
                        <span className="text-gray-400 text-sm">You give:</span>
                        <span className="font-mono text-[#75ffba] text-sm">
                            {maxPainToLiquify ? `MAX PAIN #${maxPainToLiquify}` : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between w-full max-w-xs">
                        <span className="text-gray-400 text-sm">You get:</span>
                        <span className="font-mono text-[#75ffba] text-sm">
                            {maxPainToLiquify ? `100 LQMPT` : '—'}
                        </span>
                    </div>
                </CardFooter>
                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    hash={sendMaxPainHash}
                    isConfirming={isWritePending || isConfirming}
                    isConfirmed={sendMaxPainConfirmed}
                />
            </Card>
        </main>
    );
}

