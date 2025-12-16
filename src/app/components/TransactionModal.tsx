'use client';
import { Modal, Button } from "@heroui/react";
import Image from "next/image";
import { useEffect, useRef } from 'react';
import { useChainId } from 'wagmi';
import { config } from '../wagmi.config';

interface TransactionModalProps {
    isOpen: boolean;
    hash: `0x${string}` | undefined;
    isConfirming: boolean;
    isConfirmed: boolean;
    action: string;
    image: ImageInterface;
}

interface ImageInterface {
    src: string;
    alt: string;
}

export default function TransactionModal({ isOpen, hash, isConfirming, isConfirmed, action, image }: TransactionModalProps) {

    const chainId = useChainId({ config });

    const getExplorerUrl = () => {
        const explorers = {
            1: 'https://etherscan.io',       // Mainnet
            11155111: 'https://sepolia.etherscan.io', // Sepolia
        };
        const baseUrl = explorers[chainId] || 'https://etherscan.io';
        return `${baseUrl}/tx/${hash}`;
    };

    return (
        <Modal>
            <Modal.Container isOpen={isOpen}>
                <Modal.Dialog className="bg-neutral-900 text-white">
                    {({ close }) => (
                        <>
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>Welcome to HeroUI</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col items-center justify-center py-10 px-8">
                                {/* Confirming State */}
                                {isConfirming && (
                                    <div className="text-center">
                                        <div className="rounded-sm overflow-hidden mx-auto w-fit">
                                            <Image
                                                src={image.src}
                                                width={225}
                                                height={225}
                                                className='m-3 mb-3'
                                                alt={image.alt}
                                                priority
                                                unoptimized
                                            />
                                        </div>
                                        <p className="mt-4 text-lg">{action}</p>
                                        <a
                                            href={getExplorerUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-[#75ffba] mt-2 hover:underline break-all block"
                                        >
                                            View on Etherscan: {hash?.slice(0, 6)}...{hash?.slice(-4)}
                                        </a>
                                    </div>
                                )}

                                {/* Success State */}
                                {isConfirmed && (
                                    <div className="text-center">
                                        <div className="text-6xl mb-2">✅</div>
                                        <p className="text-2xl font-bold text-[#75ffba]">Done</p>
                                        <p className="text-sm text-gray-400 mt-2">Transaction completed successfully</p>
                                        <a
                                            href={getExplorerUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-gray-400 mt-3 hover:underline break-all block"
                                        >
                                            View transaction: {hash?.slice(0, 6)}...{hash?.slice(-4)}
                                        </a>
                                    </div>
                                )}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200" onPress={close}>
                                    Close
                                </Button>
                            </Modal.Footer>
                        </>
                    )}
                </Modal.Dialog>
            </Modal.Container>
        </Modal>
    );
}