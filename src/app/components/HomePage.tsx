'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from "next/image";
import Head from 'next/head';
import { Button, Link, Label, Switch } from "@heroui/react";
import '@rainbow-me/rainbowkit/styles.css';
import { useSwitchChain, useConnection } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Liquify from "./Liquify";
import Solidify from "./Solidify";
import LiquifyETH from "./LiquifyETH";
import SolidifyETH from './SolidifyETH';
import Arbitrage from './Arbitrage';
import { useNFTs } from '../context/NFTContext';
import { useLiquidMaxPainToken } from '../context/LiquidMaxPainTokenContext';


const LiquidMaxPain_address = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS;

const desiredNetworkId = 1;

export default function Home() {
  const [isClientSide, setIsClientSide] = useState(false);
  const [isLQMPT, setIsLQMPT] = React.useState(false);
  const { balanceOfLiquidMaxPain } = useNFTs();
  const { balance: lqmptBalance } = useLiquidMaxPainToken();
  const { isConnected, chain } = useConnection();

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

  // Sound playing logic
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSound = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setIsPlaying(true);
      audio.currentTime = 0;
      audio.volume = 0.2;
      await audio.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-6 text-[#75ffba] tracking-tight">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>$LiquidMaxPain</title>
      </Head>

      <div className='bg-neutral-900 p-4 sm:p-6 rounded-xl flex flex-col items-center text-center w-full max-w-4xl mx-auto'>
        <div className='border-b-4 border-stone-600 pb-4 w-full'>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 leading-tight">
            <span className="block sm:inline">Liquid</span><span className="block sm:inline">MaxPain</span>
          </h1>
          <h2 className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Making the world a better place by unlocking liquidity for non-fungible tokens through a permissionless bonding curve and other tech buzzword mumbo jumbo.
          </h2>
        </div>

        {balanceOfLiquidMaxPain && (
          <h2 className='mt-4 text-sm sm:text-base'>
            {balanceOfLiquidMaxPain} / 4849 liquified
          </h2>
        )}
      </div>
      <Arbitrage />
      <div className='my-4 sm:my-6 w-full max-w-sm mx-auto px-4'>
        {chain?.id !== desiredNetworkId && isConnected ? (
          <Button
            variant="primary"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white 
               font-bold 
               w-full 
               py-4 sm:py-3.5 
               text-sm sm:text-base 
               hover:from-red-600 hover:to-red-700 
               active:from-red-700 active:to-red-800
               transition-all duration-200 
               shadow-md sm:shadow-lg 
               rounded-xl 
               tracking-wide
               min-h-[48px]
               active:scale-95"
            onPress={handleSwitchChain}
          >
            Switch to Ethereum Mainnet
          </Button>
        ) : (
          <div className="flex justify-center">
            <ConnectButton
              label="Connect Wallet"
              chainStatus={{
                smallScreen: 'icon',
                largeScreen: 'icon',
              }}
              showBalance={false}
              accountStatus={{
                smallScreen: 'full',
                largeScreen: 'full',
              }}
            />
          </div>
        )}</div>
      <div className='bg-neutral-900 p-2 rounded-xl flex flex-col items-center text-center w-full md:w-auto '>
        <div className='border-b-3 border-stone-600 pb-1'>
          <h2 className="text-lg md:text-xl">You have {lqmptBalance ? formatter.format((BigInt(lqmptBalance) / BigInt(10 ** 20))) : formatter.format(0)} Max Pain</h2>
        </div>
      </div>

      <div className='bg-neutral-900 p-2 rounded-xl flex flex-col items-center text-center w-full md:w-auto '>
        <div className='border-b-3 border-stone-600 pb-1'>
          <Switch isSelected={isLQMPT} onChange={setIsLQMPT}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-sm">swap for LQMPT</Label>
          </Switch>
        </div>
      </div>



      {isLQMPT ?
        (
          <div className="flex flex-col md:flex-row gap-4 w-full md:justify-center">
            <Liquify playAudio={playSound} />
            <Solidify playAudio={playSound} />
          </div>
        )
        :
        (
          <div className="flex flex-col md:flex-row gap-4 w-full md:justify-center">
            <LiquifyETH playAudio={playSound} />
            <SolidifyETH playAudio={playSound} />
          </div>
        )
      }

      <div className='flex flex-col text-center text-sm mt-2'>
        <p><Link href={`https://x.com/XCOPYART`} target="_blank" className="text-[#75ffba] text-sm">XCOPY</Link> is <u>not</u> affiliated with $LiquidMaxPain.</p>
        <p>This is a community-run project.</p>
      </div>
      <div className='flex flex-col text-center text-sm mt-2'>
        <p>Also check out our friends at <Link href={`https://mutatioflies.com/`} target="_blank" className="text-[#72e536] text-sm">mutatioflies.com</Link></p>
      </div>
      <div>
        <Link href={`https://xcopy.art/works/max-pain`} target="_blank">
          <Image
            src="/MAX_PAIN.gif"
            width={225}
            height={225}
            className='m-3 mb-3'
            alt="MAX PAIN"
            priority
            unoptimized
          />
        </Link>
      </div>
      <audio ref={audioRef} src="/Voicy_Max Payne.mp3" preload="auto" />
      <div className='flex flex-row gap-5 bg-neutral-900 p-3 pl-5 pr-5 md:pl-7 md:pr-7 rounded-xl'>
        <Link href={`https://etherscan.io/address/${LiquidMaxPain_address}`} target="_blank">
          <Image
            src="/etherscan-logo-circle.svg"
            width={30}
            height={30}
            alt="etherscan"
          /></Link>
        <Link href={`https://github.com/N3R01N/liquidmaxpain`} target="_blank">
          <Image
            src="/github.png"
            width={30}
            height={30}
            alt="github"
          /></Link>
        <Link href={`https://opensea.io/collection/max-pain-and-frens-by-xcopy`} target="_blank">
          <Image
            src="/opensea.png"
            width={30}
            height={30}
            alt="opensea"
          /></Link>
        <Link href={`https://www.geckoterminal.com/eth/pools/0x8ebec927154f4f09b76e6719894dfa60aca8fe8bbf8e6ada27435f6cd1519283`} target="_blank">
          <Image
            src="/gecko_terminal.png"
            width={30}
            height={30}
            alt="geckoterminal"
          /></Link>
        <Link href={`https://app.uniswap.org/swap?chain=mainnet&inputCurrency=NATIVE&outputCurrency=${LiquidMaxPain_address}`} target="_blank">
          <Image
            src="/uniswap.png"
            width={30}
            height={30}
            alt="uniswap"
          /></Link>
        <Link href={`https://xcopy.art/`} target="_blank">
          <Image
            src="/xcopy_logo.png"
            width={30}
            height={30}
            alt="XCopy"
          /></Link>
      </div>
    </main>
  );
}