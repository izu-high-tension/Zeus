import Link from "next/link";
import { PiLoginButton } from "./PiLoginButton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/50 bg-white/80 backdrop-blur dark:border-neutral-800/50 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>🐾</span>
          <span>PI ANIMALS</span>
        </Link>
        <nav className="hidden gap-4 text-sm font-medium md:flex">
          <Link href="/pets">My Pets</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/mint">Mint</Link>
          <Link href="/vitality">Vitality</Link>
          <Link href="/referrals">Referrals</Link>
        </nav>
        <PiLoginButton />
      </div>
    </header>
  );
}
