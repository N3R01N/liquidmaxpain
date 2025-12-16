'use client';
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Head from 'next/head';
import { Button, Link } from "@heroui/react";
import '@rainbow-me/rainbowkit/styles.css';
import { useSwitchChain, useConnection } from "wagmi";
import { config } from '../wagmi.config'
import Liquify from "./Liquify";
import Solidify from "./Solidify";
import { useNFTs } from '../context/NFTContext';
import { useLiquidMaxPainToken } from '../context/LiquidMaxPainTokenContext';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const RainbowKitProvider = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.RainbowKitProvider),
  { ssr: false }
);

const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.ConnectButton),
  { ssr: false }
);


const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;

const desiredNetworkId = 1;

export default function Home() {
  const [isClientSide, setIsClientSide] = useState(false);
  const { balanceOfLiquidMaxPain } = useNFTs();
  const { balance: lqmptBalance } = useLiquidMaxPainToken();
  const { isConnected, chain } = useConnection({ config });
  console.log("Current chain:", lqmptBalance);

  const { mutate } = useSwitchChain();

  const formatter = new Intl.NumberFormat('en-EN', {
    style: 'percent',
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    document.title = '~LiquidMaxPain~';
    setIsClientSide(true);
  }, []);

  const handleSwitchChain = () => {
    mutate({ chainId: desiredNetworkId });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-24 py-4 text-[#75ffba] tracking-tight">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>$LiquidMaxPain</title>
      </Head>
      <div className='bg-neutral-900 p-2 rounded-xl flex flex-col items-center text-center w-full md:w-auto '>
        <div className='border-b-3 border-stone-600 pb-1'>
          <h1 className="md:text-7xl text-6xl mb-1">LiquidMaxPain</h1>
          <h2 className="text-lg md:text-xl">Making the world a better place by unlocking liquidity for non-fungible tokens through a permissionless bonding curve</h2>
        </div>
        {balanceOfLiquidMaxPain && <h2 className='mt-1'>{balanceOfLiquidMaxPain} / 7394 liquified</h2>}
      </div>

      <div className='my-3'>
        {chain?.id !== desiredNetworkId && isConnected ? (
          <Button
            variant="primary"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-8 py-4 text-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
            onPress={handleSwitchChain}
          >
            Switch to Ethereum Mainnet
          </Button>
        ) : (
          <ConnectButton
            label="Connect Wallet"
            chainStatus={{
              smallScreen: 'none',
              largeScreen: 'icon',
            }}
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        )}</div>

      <div className='bg-neutral-900 p-2 rounded-xl flex flex-col items-center text-center w-full md:w-auto '>
        <div className='border-b-3 border-stone-600 pb-1'>
          <h2 className="text-lg md:text-xl">You have {lqmptBalance ? formatter.format((BigInt(lqmptBalance) / BigInt(10 ** 20))) : formatter.format(0)} Max Pain</h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full md:justify-center">
        <Liquify />
        <Solidify />
      </div>

      <div className='flex flex-col text-center text-sm mt-2'>
        <p><Link href={`https://x.com/XCOPYART`} className="text-[#75ffba] text-sm">XCOPY</Link> is <u>not</u> affiliated with $LiquidMaxPain.</p>
        <p>This is a community-run project.</p>
      </div>
      <div className='flex flex-col text-center text-sm mt-2'>
        <p>Also check out our friends at <Link href={`https://mutatioflies.com/`} className="text-[#72e536] text-sm">mutatioflies.com</Link></p>
      </div>
      <div>
        <Image
          src="/MAX_PAIN.gif"
          width={225}
          height={225}
          className='m-3 mb-3'
          alt="MAX PAIN"
          priority
          unoptimized
        />
      </div>

      <div className='flex flex-row gap-5 bg-neutral-900 p-3 pl-5 pr-5 md:pl-7 md:pr-7 rounded-xl'>
        <Link href={`https://etherscan.io/address/${LiquidMaxPain_address}`} >
          <Image
            src="/etherscan-logo-circle.svg"
            width={30}
            height={30}
            alt="etherscan"
          /></Link>
        <Link href={`https://github.com/N3R01N/liquidmaxpain`} >
          <Image
            src="/github.png"
            width={30}
            height={30}
            alt="github"
          /></Link>
        <Link href={`https://opensea.io/collection/max-pain-and-frens-by-xcopy`} >
          <Image
            src="/opensea.png"
            width={30}
            height={30}
            alt="opensea"
          /></Link>
        <Link href={`https://dexscreener.com/base/${LiquidMaxPain_address}`} >
          <Image
            src="/dexscreener.png"
            width={30}
            height={30}
            alt="dexscreener"
          /></Link>
        <Link href={`https://www.coingecko.com/de/munze/mutatio-flies`} >
          <Image
            src="/coingecko.png"
            width={30}
            height={30}
            alt="coingecko"
          /></Link>
        <Link href={`https://app.uniswap.org/add/ETH/${LiquidMaxPain_address}/10000`}>
          <Image
            src="/uniswap.png"
            width={30}
            height={30}
            alt="uniswap"
          /></Link>

      </div>
    </main>
  );
}