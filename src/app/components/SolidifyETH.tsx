'use client';

import { useState, useEffect } from 'react';
import { Button, Select, ListBox, Card } from "@heroui/react";
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useConnection, useBalance } from "wagmi";
import { useNFTs } from '../context/NFTContext';
import { useLiquidMaxPainSwap } from '../context/LiquidMaxPainSwapContext';
import type { Key } from "react-aria-components";
import { MaxPainType } from '../context/Types';
import TransactionModal from './TransactionModal';
import { formatEther } from 'viem';

const LiquidMaxpainSwap_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_SWAP_ADDRESS as `0x${string}`;
const LIQUID_MAX_PAIN_SWAP_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? require('../ABI/prod/LiquidMaxPainSwap_ABI.json') : require('../ABI/dev/LiquidMaxPainSwap_ABI.json');

interface SolidifyProps {
  playAudio: () => void | Promise<void>;
}

export default function SolidifyETH({ playAudio }: SolidifyProps) {
  const [selectedMaxPain, setSelectedMaxPain] = useState<Key | null>(null);

  // Wagmi hooks
  const { address } = useConnection();
  const { balanceOfLiquidMaxPain, ownedNftsByLiquidMaxPain, mutate } = useNFTs();
  const { buyPrice, refetch } = useLiquidMaxPainSwap();

  const { data } = useBalance({
    address: address,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: simulateBuyMaxPain, isLoading: isSimulating, error: simulateError } = useSimulateContract({
    address: LiquidMaxpainSwap_address,
    abi: LIQUID_MAX_PAIN_SWAP_ABI,
    functionName: 'swapEthForMaxPain',
    args: [address as `0x${string}`, selectedMaxPain as Key],
    account: address,
    value: BigInt(buyPrice as number),
    query: { enabled: !!selectedMaxPain && !!address && !!buyPrice && data?.value as bigint >= buyPrice },
  });

  const { mutate: buyMaxPain, data: buyMaxPainHash, isPending: isBuyPending } = useWriteContract();

  const { isSuccess: buyMaxPainConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: buyMaxPainHash,
  });

  useEffect(() => {
    if (buyMaxPainConfirmed) {
      setSelectedMaxPain(null);
      mutate();
      refetch();
      playAudio()
    }
  }, [buyMaxPainConfirmed]);

  useEffect(() => {
    if (buyMaxPainHash && isConfirming) {
      setIsModalOpen(true);
    }
  }, [buyMaxPainHash, isConfirming]);

  useEffect(() => {
    if (simulateError) {
      console.error("Buy Simulation failed:", simulateError);
    }
  }, [simulateError]);

  // Add this effect to handle auto-close
  useEffect(() => {
    if (buyMaxPainConfirmed && isModalOpen) {
      const timer = setTimeout(() => setIsModalOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [buyMaxPainConfirmed, isModalOpen]);
  // Handle buy button click
  const handleBuy = () => {
    if (simulateBuyMaxPain?.request) {
      buyMaxPain(simulateBuyMaxPain?.request);
    }
  };

  return (
    <>
      <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto border border-stone-600'>
        <Card.Header className="items-center justify-center text-center border-b border-stone-600 pb-3">
          <h3 className="text-xl md:text-2xl font-bold">Buy Max Pain</h3>
        </Card.Header>
        <Card.Content className="items-center justify-center py-5">
          <div className='flex flex-col w-64 items-center justify-center gap-4'>
            <Select
              className="w-[256px] data-[open=true]:bg-neutral-800"
              placeholder='Choose a Max Pain to solidify'
              aria-label="Choose a Max Pain to solidify"
              value={selectedMaxPain}
              onChange={setSelectedMaxPain}
            >
              <Select.Trigger className="bg-neutral-800 text-[#75ffba] data-[placeholder]:text-[#75ffba] hover:bg-stone-700 transition-colors">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="bg-neutral-800 border border-stone-600">
                <ListBox>
                  {ownedNftsByLiquidMaxPain.map((nft: MaxPainType) => {
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
              isDisabled={balanceOfLiquidMaxPain == 0 || data?.value as bigint < BigInt(buyPrice as number) || !selectedMaxPain || isSimulating}
              onPress={handleBuy}
              className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
            >
              Buy
            </Button>
          </div>
        </Card.Content>
        <Card.Footer className="flex flex-col gap-3 py-4 px-5 bg-neutral-800 min-h-[80px] justify-center">
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-gray-400 text-sm font-medium">You give:</span>
            <span className="font-mono text-[#75ffba] text-sm">
              {selectedMaxPain ? `${buyPrice ? formatEther(BigInt(buyPrice)) : '0'} ETH` : '—'}
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-gray-400 text-sm font-medium">You get:</span>
            <span className="font-mono text-[#75ffba] text-sm">
              {selectedMaxPain ? `MAX PAIN #${selectedMaxPain}` : '—'}
            </span>
          </div>
        </Card.Footer>
      </Card>
      <TransactionModal
        isOpen={isModalOpen}
        hash={buyMaxPainHash}
        isConfirming={isBuyPending || isConfirming}
        isConfirmed={buyMaxPainConfirmed}
        action="Buying Max Pain..."
        image={{ src: "/solidify_animation.gif", alt: "Buy MAX PAIN" }}
      />
    </>
  );
}