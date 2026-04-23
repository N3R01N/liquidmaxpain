import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"

import '@/app/globals.css';

const silk = Silkscreen({
    style: 'normal',
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-silkscreen',
});


export const metadata: Metadata = {
    title: 'LiquidMaxPain',
    description: 'liquify your Max Pain NFTs into LiquidMaxPainTokens (LQMPT) and solidify them back anytime!',
    icons: {
        icon: '/favicon.svg',
    },
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <html suppressHydrationWarning lang='en'>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="16x16" />
                <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/favicon.jpg" sizes="180x180" />
            </head>
            <body className={`${silk.className} bg-background text-foreground antialiased`}>
                <Analytics />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
};

export default Layout;
