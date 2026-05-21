import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Raise NFT pets. Earn Pi.
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
              PI ANIMALS is an NFT pet-cultivation game built on the Pi Network
              ecosystem. Mint Gen-0 dogs and cats, accrue Pet tokens through
              mining, climb the rarity ladder, and trade on the marketplace.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/mint"
                className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:opacity-90"
              >
                Mint a pet
              </Link>
              <Link
                href="/marketplace"
                className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Browse marketplace
              </Link>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              1 Pi = 100 Pet · Gen-0 supply capped · Tradeable on Polygon
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["🐕", "🐈", "🐩", "🐱"].map((emoji, i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 text-6xl dark:from-violet-950 dark:to-pink-950"
              >
                {emoji}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Mine while you sleep",
              body: "Holding pets accrues Pet tokens passively, weighted by rarity. Cash out 100 Pet → 1 Pi at v1.0.",
            },
            {
              title: "Vitality quests",
              body: "Daily check-ins, referrals, and purchases push your vitality from 0 → 100, unlocking Gen-0 mints.",
            },
            {
              title: "Lottery & dividends",
              body: "Holders share in weekly platform revenue. Lottery uses Chainlink VRF for provable fairness.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                {f.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
