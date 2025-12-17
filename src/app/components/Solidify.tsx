'use client';

import { useState, useEffect } from 'react';
import { Button, Select, ListBox, Card } from "@heroui/react";
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useConnection } from "wagmi";
import { useNFTs } from '../context/NFTContext';
import { useLiquidMaxPainToken } from '../context/LiquidMaxPainTokenContext';
import LiquidMaxPainToken_ABI_DEV from "../ABI/dev/LiquidMaxPainToken_ABI.json";
import LiquidMaxPainToken_ABI_PROD from "../ABI/prod/LiquidMaxPainToken_ABI.json";
import type { Key } from "react-aria-components";
import { MaxPainType } from '../context/Types';
import TransactionModal from './TransactionModal';

const LQMPT_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS as `0x${string}`;
const LiquidMaxPainToken_ABI = process.env.NEXT_PUBLIC_ENV === 'prod' ? LiquidMaxPainToken_ABI_PROD : LiquidMaxPainToken_ABI_DEV;

export default function Solidify() {
  const [selectedMaxPain, setSelectedMaxPain] = useState<Key | null>(null);

  const ONEHUNDRED_LQMPT = BigInt(100000000000000000000);

  // Wagmi hooks
  const { address } = useConnection();
  const { balanceOfLiquidMaxPain, ownedNftsByLiquidMaxPain, mutate } = useNFTs();
  const { balance: lqmptBalance, refetch } = useLiquidMaxPainToken();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: simulateSolidifyMaxPain, isLoading: isSimulating, error: simulateError } = useSimulateContract({
    address: LQMPT_address,
    abi: LiquidMaxPainToken_ABI,
    functionName: 'solidify',
    args: [selectedMaxPain, ONEHUNDRED_LQMPT, address],
    query: { enabled: !!selectedMaxPain && !!address },
  });

  const { mutate: solidifyMaxPain, data: solidifyMaxPainHash, isPending: isWritePending } = useWriteContract();

  const { isSuccess: solidifyMaxPainConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: solidifyMaxPainHash,
  });

  useEffect(() => {
    if (solidifyMaxPainConfirmed) {
      setSelectedMaxPain(null);
      mutate();
      refetch();
    }
  }, [solidifyMaxPainConfirmed]);

  useEffect(() => {
    if (solidifyMaxPainHash && isConfirming) {
      setIsModalOpen(true);
    }
  }, [solidifyMaxPainHash, isConfirming]);

  // Handle liquify button click
  const handleSolidify = () => {
    if (simulateSolidifyMaxPain?.request) {
      solidifyMaxPain(simulateSolidifyMaxPain?.request);
    }
  };

  useEffect(() => {
    if (simulateError) {
      console.error("Simulation failed:", simulateError);
    }
  }, [simulateError]);

  // Add this effect to handle auto-close
  useEffect(() => {
    if (solidifyMaxPainConfirmed && isModalOpen) {
      const timer = setTimeout(() => setIsModalOpen(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [solidifyMaxPainConfirmed, isModalOpen]);

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
              isDisabled={balanceOfLiquidMaxPain == 0 || lqmptBalance < ONEHUNDRED_LQMPT || !selectedMaxPain || isSimulating}
              onPress={handleSolidify}
              className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
            >
              Solidify
            </Button>
          </div>
        </Card.Content>
        <Card.Footer className="flex flex-col gap-3 py-4 px-5 bg-neutral-800 min-h-[80px] justify-center">
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-gray-400 text-sm font-medium">You give:</span>
            <span className="font-mono text-[#75ffba] text-sm">
              {selectedMaxPain ? `100 LQMPT` : '—'}
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
        hash={solidifyMaxPainHash}
        isConfirming={isWritePending || isConfirming}
        isConfirmed={solidifyMaxPainConfirmed}
        action="Solidifying Max Pain..."
        image={{ src: "/solidify_animation.gif", alt: "Solidify MAX PAIN" }}
      />
    </>
  );
}