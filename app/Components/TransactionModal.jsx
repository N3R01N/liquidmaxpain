'use client';
import { Modal, ModalContent, ModalBody } from "@heroui/react";
import { Spinner } from "@heroui/react";
import { useEffect } from 'react';
import { useChainId } from 'wagmi';

export default function TransactionModal({ isOpen, onClose, hash, isConfirming, isConfirmed }) {

    const chainId = useChainId();
    // Auto-close after 3 seconds on success
    useEffect(() => {
        if (isConfirmed) {
            const timer = setTimeout(() => onClose(), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConfirmed, onClose]);

    const getExplorerUrl = () => {
        const explorers = {
            1: 'https://etherscan.io',       // Mainnet
            11155111: 'https://sepolia.etherscan.io', // Sepolia
        };
        const baseUrl = explorers[chainId] || 'https://etherscan.io';
        return `${baseUrl}/tx/${hash}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            hideCloseButton={isConfirming}
            placement="center"
            backdrop="blur"
             classNames={{
    wrapper: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001]",
    backdrop: "z-[1000]",
  }}
        >
            <ModalContent className="bg-neutral-900 text-white">
                <ModalBody className="flex flex-col items-center justify-center py-10 px-8">
                    {/* Confirming State */}
                    {isConfirming && (
                        <div className="text-center">
                            <Spinner size="lg" color="success" className="text-[#75ffba]" />
                            <p className="mt-4 text-lg">Processing Transaction</p>
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
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}