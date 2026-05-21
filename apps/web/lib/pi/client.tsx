"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PiSdk } from "./types";

interface SessionUser {
  id: string;
  username: string | null;
  vitality: number;
}

interface PiCtx {
  ready: boolean;
  sandbox: boolean;
  user: SessionUser | null;
  csrf: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  pay: (input: {
    purpose: "MINT" | "LISTING_FEE" | "PET_PURCHASE" | "TOPUP";
    metadata: Record<string, unknown>;
  }) => Promise<{ status: "COMPLETED" | "CANCELLED" }>;
}

const Ctx = createContext<PiCtx | null>(null);

export function usePi(): PiCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePi must be used inside PiProvider");
  return v;
}

function getPi(): PiSdk | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Pi;
}

export function PiProvider({
  sandbox,
  children,
}: {
  sandbox: boolean;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [csrf, setCsrf] = useState<string | null>(null);

  // Initialize SDK if present (the loader script is injected in the root layout).
  useEffect(() => {
    const pi = getPi();
    if (pi) {
      try {
        pi.init({ version: "2.0", sandbox });
      } catch {
        // Re-init is harmless; the SDK throws if called twice.
      }
    }
    void fetch("/api/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.user) setUser(j.user);
        if (j.csrf) setCsrf(j.csrf);
      })
      .finally(() => setReady(true));
  }, [sandbox]);

  const login = useCallback(async () => {
    const pi = getPi();
    if (!pi) throw new Error("Pi SDK not available — open inside Pi Browser");

    const auth = await pi.authenticate(["username", "payments"], (incomplete) => {
      // Recover orphaned payments — re-post to /complete.
      if (incomplete.transaction?.txid) {
        void fetch("/api/payments/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrf ? { "x-csrf": csrf } : {}),
          },
          body: JSON.stringify({
            paymentId: incomplete.identifier,
            txid: incomplete.transaction.txid,
          }),
        });
      }
    });

    const res = await fetch("/api/auth/pi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: auth.accessToken }),
    });
    if (!res.ok) throw new Error("Pi login failed");
    const j = await res.json();
    setUser(j.user);
    setCsrf(j.csrf);
  }, [csrf]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/pi", { method: "DELETE" });
    setUser(null);
    setCsrf(null);
  }, []);

  const pay = useCallback<PiCtx["pay"]>(
    async (input) => {
      const pi = getPi();
      if (!pi) throw new Error("Pi SDK not available");
      if (!csrf) throw new Error("Not authenticated");

      // 1. Server-side intent.
      const intentRes = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf": csrf },
        body: JSON.stringify(input),
      });
      if (!intentRes.ok) throw new Error("Intent failed");
      const intent = (await intentRes.json()) as {
        idempotencyKey: string;
        amountPi: string;
        memo: string;
        metadata: Record<string, unknown>;
      };

      // 2. SDK payment with server-provided amount/memo.
      return new Promise((resolve, reject) => {
        void pi.createPayment(
          {
            amount: Number(intent.amountPi),
            memo: intent.memo,
            metadata: { ...intent.metadata, idempotencyKey: intent.idempotencyKey },
          },
          {
            onReadyForServerApproval: (paymentId) => {
              void fetch("/api/payments/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-csrf": csrf },
                body: JSON.stringify({
                  paymentId,
                  idempotencyKey: intent.idempotencyKey,
                }),
              });
            },
            onReadyForServerCompletion: (paymentId, txid) => {
              void fetch("/api/payments/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-csrf": csrf },
                body: JSON.stringify({ paymentId, txid }),
              }).then((r) => {
                if (r.ok) resolve({ status: "COMPLETED" });
                else reject(new Error("complete_failed"));
              });
            },
            onCancel: () => resolve({ status: "CANCELLED" }),
            onError: (err) => reject(err),
          },
        );
      });
    },
    [csrf],
  );

  const value = useMemo<PiCtx>(
    () => ({ ready, sandbox, user, csrf, login, logout, pay }),
    [ready, sandbox, user, csrf, login, logout, pay],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
