import "./globals.css";
import { Providers } from "./providers";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata = {
  title: "LiquidMaxPainToken",
  description: "Making the world a better place by unlocking liquidity for non-fungible tokens through a permissionless bonding curve",
  icons: {
    icon: '/favicon.svg',
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="16x16" />
      <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" /> 
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
