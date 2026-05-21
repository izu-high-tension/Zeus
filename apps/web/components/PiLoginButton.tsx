"use client";

import { usePi } from "@/lib/pi/client";
import { cn } from "@/lib/utils";

export function PiLoginButton({ className }: { className?: string }) {
  const { user, login, logout, ready } = usePi();

  if (!ready) {
    return (
      <button
        disabled
        className={cn(
          "rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium",
          className,
        )}
      >
        Loading…
      </button>
    );
  }

  if (user) {
    return (
      <button
        onClick={() => logout()}
        className={cn(
          "rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700",
          className,
        )}
      >
        Logout ({user.username ?? user.id.slice(0, 6)})
      </button>
    );
  }

  return (
    <button
      onClick={() => login().catch(console.error)}
      className={cn(
        "rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90",
        className,
      )}
    >
      Login with Pi
    </button>
  );
}
