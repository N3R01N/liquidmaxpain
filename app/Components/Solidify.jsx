'use client';
import React, { useState, useEffect } from 'react';
import { Button, Select, SelectItem, Spinner, Card, CardHeader, CardBody, CardFooter } from "@heroui/react";
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useAccount, useReadContract } from "wagmi";
import { useQueryClient } from '@tanstack/react-query';
import { useNFTs } from '../context/NFTContext';
import TransactionModal from './TransactionModal';
import LiquidMaxPainToken_ABI from "../ABI/LiquidMaxPainToken_ABI.json";

export default function Solidify() {
  const [maxPainToSolidify, setMaxPainToSolidify] = useState("");
  const [lqmptBalance, setLqmptBalance] = useState(0);
  const { balanceOfLiquidMaxPain, ownedNftsByLiquidMaxPain, isLoading, mutate } = useNFTs();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ONEHUNDRED_LQMPT = BigInt(100000000000000000000);
  const LQMPT_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { data: readBalanceOf, isSuccess: isSuccessBalanceOf } = useReadContract({
    address: LQMPT_address,
    abi: LiquidMaxPainToken_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (isSuccessBalanceOf && readBalanceOf !== undefined) {
      setLqmptBalance(readBalanceOf);
    }
  }, [readBalanceOf, isSuccessBalanceOf]);

  const { data: simulateSolidifyMaxPain } = useSimulateContract({
    address: LQMPT_address,
    abi: LiquidMaxPainToken_ABI,
    functionName: 'solidify',
    args: maxPainToSolidify ? [maxPainToSolidify, ONEHUNDRED_LQMPT, address] : undefined,
    query: { enabled: !!maxPainToSolidify && !!address },
  });

  const { writeContract: solidifyMaxPain, data: solidifyMaxPainHash, isPending: isWritePending } = useWriteContract();

  const { isSuccess: solidifyMaxPainConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: solidifyMaxPainHash,
  });

  useEffect(() => {
    if (solidifyMaxPainHash && !solidifyMaxPainConfirmed) {
      setIsModalOpen(true);
    }
  }, [solidifyMaxPainConfirmed, solidifyMaxPainHash]);

  const closeModal = () => {
    if (!isWritePending && !isConfirming) {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    if (solidifyMaxPainConfirmed) {
      setMaxPainToSolidify("");
      mutate();
    }
  }, [solidifyMaxPainConfirmed, mutate]);

  return (
    <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto border border-stone-600' shadow="lg">
      <CardHeader className="items-center justify-center text-center border-b border-stone-600 pb-3">
        <h3 className="text-xl md:text-2xl font-bold">Solidify Max Pain</h3>
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
              placeholder='Choose an NFT'
              selectedKeys={maxPainToSolidify ? [maxPainToSolidify.toString()] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setMaxPainToSolidify(selected ? Number(selected) : "");
              }}
              label={`${(Number(lqmptBalance) / 10 ** 18).toFixed(2)} LQMPT`}
              classNames={{
                base: "w-full mb-2",
                trigger: "bg-neutral-800 border-2 border-stone-500 text-[#75ffba] hover:border-[#fc017d] focus:border-[#fc017d] transition-colors",
                listbox: "bg-neutral-900 border-2 border-stone-500",
                popoverContent: "bg-neutral-900 border-2 border-stone-500 shadow-2xl",
                placeholder: "text-gray-400",
                value: "text-[#75ffba]"
              }}
            >
              {ownedNftsByLiquidMaxPain.map(nft => (
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
            isDisabled={balanceOfLiquidMaxPain == 0 || lqmptBalance < ONEHUNDRED_LQMPT || !maxPainToSolidify}
            onPress={() => solidifyMaxPain(simulateSolidifyMaxPain?.request)}
            className="mt-2 w-full bg-[#fc017d] text-black font-bold hover:bg-[#e0016f] active:bg-[#c80161] transition-all duration-200"
          >
            Solidify
          </Button>
        </div>
      </CardBody>
      <CardFooter className="flex flex-col gap-3 py-4 px-5 bg-neutral-800 min-h-[80px] justify-center">
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-gray-400 text-sm font-medium">You give:</span>
          <span className="font-mono text-[#75ffba] text-sm">
            {maxPainToSolidify ? `100 LQMPT` : '—'}
          </span>
        </div>
        <div className="flex justify-between w-full max-w-xs">
          <span className="text-gray-400 text-sm font-medium">You get:</span>
          <span className="font-mono text-[#75ffba] text-sm">
            {maxPainToSolidify ? `MAX PAIN #${maxPainToSolidify}` : '—'}
          </span>
        </div>
      </CardFooter>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        hash={solidifyMaxPainHash}
        isConfirming={isWritePending || isConfirming}
        isConfirmed={solidifyMaxPainConfirmed}
      />
    </Card>
  );
}