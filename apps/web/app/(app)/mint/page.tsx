"use client";

import { useState } from "react";
import { usePi } from "@/lib/pi/client";
import { PiPaymentButton } from "@/components/PiPaymentButton";

export default function MintPage() {
  const { user } = usePi();
  const [species, setSpecies] = useState<"DOG" | "CAT">("DOG");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Mint a Gen-0 PI ANIMALS</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Gen-0 pets are limited and convey lifetime mining + dividend rights. 1
        Pi mints one randomized pet of your chosen species.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["DOG", "CAT"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSpecies(s)}
            className={`flex aspect-square items-center justify-center rounded-xl border-2 text-6xl transition ${
              species === s
                ? "border-brand bg-brand/5"
                : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
            }`}
          >
            {s === "DOG" ? "🐕" : "🐈"}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Species</dt>
            <dd>{species === "DOG" ? "PI ANIMALS Dog" : "PI ANIMALS Cat"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Generation</dt>
            <dd>0 (Genesis)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Price</dt>
            <dd>1.00 Pi</dd>
          </div>
        </dl>
        <div className="mt-4">
          {user ? (
            <PiPaymentButton
              label="Mint with Pi"
              purpose="MINT"
              metadata={{ species }}
            />
          ) : (
            <p className="text-sm text-neutral-500">
              Log in with Pi (top-right) to mint.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
