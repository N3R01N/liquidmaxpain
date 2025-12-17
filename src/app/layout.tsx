import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import { Providers } from "./providers";

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
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        // ? https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
        // ? https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors
        <html suppressHydrationWarning lang='en'>
            <body className={`${silk.className} bg-background text-foreground antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
};

export default Layout;
