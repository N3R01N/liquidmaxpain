'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button, Select, SelectItem, Spinner, Card, CardHeader, CardBody, CardFooter, Modal, ModalBody, ModalContent } from "@heroui/react";
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useAccount } from "wagmi";
import { useNFTs } from '../context/NFTContext';
import TransactionModal from './TransactionModal';
import MAX_PAIN_ABI from "../ABI/MAX_PAIN_ABI.json";

const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;
const MAX_PAIN_address = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS;

export default function Liquify() {
    const [maxPainToLiquify, setMaxPainToLiquify] = useState("");

    const inputRef = useRef(null);
    const { address } = useAccount();
    const { balanceOfConnectedAddress, ownedNftsByConnectedAddress, isLoading, mutate } = useNFTs();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isOpen, setOpen] = useState(false);

    const { data: simulateSendMaxPain } = useSimulateContract({
        address: MAX_PAIN_address,
        abi: MAX_PAIN_ABI,
        functionName: 'safeTransferFrom',
        args: maxPainToLiquify ? [address, LiquidMaxPain_address, maxPainToLiquify] : undefined,
        account: address,
        query: { enabled: !!maxPainToLiquify && !!address },
    });

    const { writeContract: sendMaxPain, data: sendMaxPainHash, isPending: isWritePending } = useWriteContract();

    const { isSuccess: sendMaxPainConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: sendMaxPainHash,
    });

    useEffect(() => {
        if (isConfirming) {
            setIsModalOpen(true);
        }
    }, [isConfirming]);

    const closeModal = () => {
        if (!isWritePending && !isConfirming) {
            setIsModalOpen(false);
        }
    };

    useEffect(() => {
        if (sendMaxPainConfirmed) {
            setMaxPainToLiquify("");
            mutate();
        }
    }, [sendMaxPainConfirmed, mutate]);

    useEffect(() => {
        if (inputRef.current && maxPainToLiquify != "") {
            inputRef.current.focus();
        }
    }, [maxPainToLiquify]);

    return (
        <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto border border-stone-600' shadow="lg">
            <CardHeader className="items-center justify-center text-center border-b border-stone-600 pb-3">
                <h3 className="text-xl md:text-2xl font-bold">Liquify MAX PAIN</h3>
            </CardHeader>
            <CardBody className="items-center justify-center py-5">
                <div className='flex flex-col w-64 items-center justify-center gap-4'>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Spinner size="lg" color="primary" />
                            <p className="mt-3 text-sm text-gray-300">Loading your MAX PAIN NFTs...</p>
                        </div>
                    ) : (
                        <Select
                            ref={inputRef}
                            placeholder='Choose an NFT'
                            selectedKeys={maxPainToLiquify ? [maxPainToLiquify.toString()] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0];
                                setMaxPainToLiquify(selected ? Number(selected) : "");
                            }}
                            label={`${Number(balanceOfConnectedAddress)} MAX PAIN`}
                            classNames={{
                                base: "w-full mb-2",
                                trigger: "bg-neutral-800 border-2 border-stone-500 text-[#75ffba] hover:border-[#fc017d] focus:border-[#fc017d] transition-colors",
                                listbox: "bg-neutral-900 border-2 border-stone-500",
                                popoverContent: "bg-neutral-900 border-2 border-stone-500 shadow-2xl",
                                placeholder: "text-gray-400",
                                value: "text-[#75ffba]"
                            }}
                        >
                            {ownedNftsByConnectedAddress.map(nft => (
                                <SelectItem
                                    key={nft.id.toString()}
                                    textValue={nft.name}
                                    className="text-[#75ffba] hover:bg-stone-700 data-[selected=true]:bg-[#fc017d] data-[selected=true]:text-black"
                                >
                                    {nft.name}
                                </SelectItem>
                            ))}
                        </Select>
                    )}
                    <Button
                        variant="solid"
                        isDisabled={balanceOfConnectedAddress == 0 || !maxPainToLiquify}
                        onPress={() => sendMaxPain(simulateSendMaxPain?.request)}
                        className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
                    >
                        Liquify
                    </Button>
                </div>
            </CardBody>
            <CardFooter className="flex flex-col gap-3 py-4 px-5 bg-neutral-800 min-h-[80px] justify-center">
                <div className="flex justify-between w-full max-w-xs">
                    <span className="text-gray-400 text-sm font-medium">You give:</span>
                    <span className="font-mono text-[#75ffba] text-sm">
                        {maxPainToLiquify ? `MAX PAIN #${maxPainToLiquify}` : '—'}
                    </span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                    <span className="text-gray-400 text-sm font-medium">You get:</span>
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
    );
}