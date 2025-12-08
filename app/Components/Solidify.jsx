'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Button, Select, SelectItem, Spinner } from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";
import '@rainbow-me/rainbowkit/styles.css';
import { useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useAccount, useReadContract } from "wagmi";
import { useQueryClient } from '@tanstack/react-query'
import { useQueryTrigger } from '../QueryTriggerContext';
import { useNFTs } from '../context/NFTContext';
import TransactionModal from './TransactionModal';

import LiquidMaxPainToken_ABI from "../ABI/LiquidMaxPainToken_ABI.json";

export default function Solidify() {

  const [maxPainToSolidify, setMaxPainToSolidify] = useState("");
  const [lqmptBalance, setLqmptBalance] = useState(0);
  const { queryTrigger, toggleQueryTrigger } = useQueryTrigger();
  const { balanceOfLiquidMaxPain, ownedNftsByLiquidMaxPain, isLoading, mutate } = useNFTs();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputRef = useRef(null);
  const ONEHUNDRED_LQMPT = BigInt(100000000000000000000);

  const LQMPT_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;

  const { address, isConnected } = useAccount();

  const queryClient = useQueryClient()

  const { data: readBalanceOf, isSuccess: isSuccessBalanceOf, queryKey: balanceQueryKey } = useReadContract({
    address: LQMPT_address,
    abi: LiquidMaxPainToken_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  useEffect(() => {
    if (isSuccessBalanceOf) {
      setLqmptBalance(readBalanceOf);
    }
  }, [readBalanceOf, isSuccessBalanceOf]);

  //deploy new contract for liquidmaxpainnptoken
  const { data: simulateSolidifyMaxPain } = useSimulateContract({
    address: LQMPT_address,
    abi: LiquidMaxPainToken_ABI,
    functionName: 'solidify',
    args: [maxPainToSolidify, ONEHUNDRED_LQMPT, address],
  });
  const { writeContract: solidifyMaxPain, data: solidifyMaxPainHash, isPending: isWritePending } = useWriteContract();

  const { isSuccess: solidifyMaxPainConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: solidifyMaxPainHash,
    })

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
      toggleQueryTrigger();
      setMaxPainToSolidify("");
      mutate();
    }
  }, [solidifyMaxPainConfirmed]);


  useEffect(() => {
    queryClient.invalidateQueries({ balanceQueryKey });
  }, [queryTrigger])

  return (
    <main>
      <Card className='text-[#75ffba] bg-neutral-900 p-3 w-full md:w-auto'>
        <CardHeader className="items-center justify-center text-center border-b-3 border-stone-600">
          <h3 className="text-xl md:text-2xl">Solidify Max Pain</h3>
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
                placeholder='Select Max Pain to Solidify'
                selectedKeys={maxPainToSolidify ? [maxPainToSolidify.toString()] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0];
                  setMaxPainToSolidify(Number(key));
                }}
                label={
                  <>
                    Balance:&nbsp;
                    <button className="hover:underline" disabled={!isConnected || !Number(lqmptBalance) > 0} onClick={() => setMaxPainToSolidify(Number(balanceOfLiquidMaxPain))}>
                      {Number(lqmptBalance) / 10 ** 18} LQMPT
                    </button>
                  </>
                }
                className='mb-1 text-white'
              >
                {ownedNftsByLiquidMaxPain.map(nft => (
                  <SelectItem key={nft.id} value={nft.name}>
                    {nft.name}
                  </SelectItem>
                ))}
              </Select>
            )}
            <Button
              variant="solid"
              isDisabled={balanceOfLiquidMaxPain == 0 || lqmptBalance < ONEHUNDRED_LQMPT || !(maxPainToSolidify > 0)}
              onPress={() => {
                console.log("trying to solidify")
                console.log("args", maxPainToSolidify, ONEHUNDRED_LQMPT, address)
                solidifyMaxPain(simulateSolidifyMaxPain?.request)
              }}
              className="text-black bg-[#fc017d] mt-1 text-md w-full"
            >
              Solidify
            </Button>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col gap-2 py-3 px-4 bg-neutral-800 min-h-[80px] justify-center">
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-gray-400 text-sm">You give:</span>
            <span className="font-mono text-[#75ffba] text-sm">
              {maxPainToSolidify ? `100 LQMPT` : '—'}
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-gray-400 text-sm">You get:</span>
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
    </main>
  );
}

