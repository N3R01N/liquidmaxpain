'use client'
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Head from 'next/head';
import { Button, Link } from "@nextui-org/react";
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSwitchChain, useAccount, useReadContract } from "wagmi";
import { reconnect } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { config } from './providers'
import Web3 from 'web3';
import Liquify from "./Components/Liquify";
import Solidify from "./Components/Solidify";
import { useNFTs } from './context/NFTContext';

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL;
const alchemyUrl = `${baseUrl}/${alchemyApiKey}`;

// Initialize web3
const web3 = new Web3(alchemyUrl);

export default function Home() {
  useEffect(() => {
    reconnect(config, { connectors: [injected()] });
  }, []);

  const [isClientSide, setIsClientSide] = useState(false);
  const { balanceOfLiquidMaxPain } = useNFTs();
  const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;


  const { isConnected, chain } = useAccount();

  const { switchChain } = useSwitchChain();
  const desiredNetworkId = 1;

  const handleSwitchChain = () => {
    switchChain({ chainId: desiredNetworkId });
  };

  useEffect(() => {
    document.title = '~LiquidMaxPain~';
    setIsClientSide(true);
  }, []);

  return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-24 py-4 text-[#72e536] tracking-tight">
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>$LiquidMaxPain</title>
        </Head>
        <div className='bg-neutral-900 p-2 rounded-xl flex flex-col items-center text-center w-full md:w-auto '>
          <div className='border-b-3 border-stone-600 pb-1'>
            <h1 className="md:text-7xl text-6xl mb-1">LiquidMaxPain</h1>
            <h2 className="text-lg md:text-xl">Making the world a better place by providing liquidity for non-fungible tokens through a permissionless bonding curve</h2>
          </div>
          {balanceOfLiquidMaxPain && <h2 className='mt-1'>{balanceOfLiquidMaxPain} / 7394 liquified</h2>}
        </div>

        <div className='my-3'>
          {chain?.id !== desiredNetworkId && isConnected ? (
            <Button variant="solid" color="danger" onPress={handleSwitchChain}>Switch to Ethereum Mainnet</Button>
          ) : (
            <ConnectButton chainStatus="none" showBalance={false} />
          )}</div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:justify-center">
          <Liquify />
          <Solidify />
        </div>

        <div className='flex flex-col text-center text-sm mt-2'>
          <p><Link href={`https://x.com/XCOPYART`} className="text-[#72e536] text-sm">XCOPY</Link> is <u>not</u> affiliated with $LiquidMaxPain.</p>
          <p>This is a community-run project.</p>
        </div>
        <div>
          <Image
            src="/MAX_PAIN.gif"
            width={225}
            height={225}
            className='m-3 mb-3'
            alt="MAX PAIN"
            priority
          />
        </div>

        <div className='flex flex-row gap-5 bg-neutral-900 p-3 pl-5 pr-5 md:pl-7 md:pr-7 rounded-xl'>
          <Link href={`https://etherscan.io/address/${LiquidMaxPain_address}`} isExternal>
            <Image
              src="/etherscan-logo-circle.svg"
              width={30}
              height={30}
              alt="etherscan"
            /></Link>
          <Link href={`https://github.com/N3R01N/liquidmaxpain`} isExternal>
            <Image
              src="/github.png"
              width={30}
              height={30}
              alt="github"
            /></Link>
          <Link href={`https://opensea.io/collection/max-pain-and-frens-by-xcopy`} isExternal>
            <Image
              src="/opensea.png"
              width={30}
              height={30}
              alt="opensea"
            /></Link>
          <Link href={`https://dexscreener.com/base/${LiquidMaxPain_address}`} isExternal>
            <Image
              src="/dexscreener.png"
              width={30}
              height={30}
              alt="dexscreener"
            /></Link>
          <Link href={`https://www.coingecko.com/de/munze/mutatio-flies`} isExternal>
            <Image
              src="/coingecko.png"
              width={30}
              height={30}
              alt="coingecko"
            /></Link>
          <Link href={`https://app.uniswap.org/add/ETH/${LiquidMaxPain_address}/10000`} isExternal>
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

