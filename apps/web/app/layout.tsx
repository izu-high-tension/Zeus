import type { Metadata } from "next";
import Script from "next/script";
import { PiProvider } from "@/lib/pi/client";
import { isSandbox } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "PI ANIMALS — NFT pets on Pi Network",
  description:
    "Mint, breed, and trade NFT pets on the Pi Network ecosystem. Earn Pet tokens through mining, vitality, and lottery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <PiProvider sandbox={isSandbox}>{children}</PiProvider>
      </body>
    </html>
  );
}
