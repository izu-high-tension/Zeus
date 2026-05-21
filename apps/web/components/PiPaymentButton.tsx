"use client";

import { useState } from "react";
import { usePi } from "@/lib/pi/client";
import { cn } from "@/lib/utils";

export function PiPaymentButton({
  label,
  purpose,
  metadata,
  className,
  onCompleted,
}: {
  label: string;
  purpose: "MINT" | "LISTING_FEE" | "PET_PURCHASE" | "TOPUP";
  metadata: Record<string, unknown>;
  className?: string;
  onCompleted?: () => void;
}) {
  const { pay, user } = usePi();
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-1">
      <button
        disabled={status === "pending"}
        onClick={async () => {
          setStatus("pending");
          setError(null);
          try {
            const r = await pay({ purpose, metadata });
            if (r.status === "COMPLETED") {
              setStatus("done");
              onCompleted?.();
            } else {
              setStatus("idle");
            }
          } catch (e) {
            setStatus("error");
            setError((e as Error).message);
          }
        }}
        className={cn(
          "rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-50",
          className,
        )}
      >
        {status === "pending" ? "Processing…" : label}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
