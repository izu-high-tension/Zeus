import { env } from "../env";

/**
 * Server-side client for the Pi Platform API.
 *
 * Every mutating Pi action (approve, complete, A2U payouts) must go through
 * here — the API key lives ONLY in server env.
 *
 * Reference: https://github.com/pi-apps/pi-platform-docs
 */

export interface PiMe {
  uid: string;
  username: string;
  credentials?: unknown;
}

export interface PiPayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  to_address: string;
  created_at: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction?: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export class PiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Pi Platform API ${status}: ${body}`);
    this.name = "PiApiError";
  }
}

async function piFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.PI_PLATFORM_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Key ${env.PI_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PiApiError(res.status, body);
  }
  return (await res.json()) as T;
}

/** Resolve the Pi UID for a user given the access token they got from the SDK. */
export async function piVerifyAccessToken(accessToken: string): Promise<PiMe> {
  const res = await fetch(`${env.PI_PLATFORM_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new PiApiError(res.status, await res.text().catch(() => ""));
  }
  return (await res.json()) as PiMe;
}

export async function piGetPayment(paymentId: string): Promise<PiPayment> {
  return piFetch<PiPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function piApprovePayment(paymentId: string): Promise<PiPayment> {
  return piFetch<PiPayment>(
    `/payments/${encodeURIComponent(paymentId)}/approve`,
    { method: "POST" },
  );
}

export async function piCompletePayment(
  paymentId: string,
  txid: string,
): Promise<PiPayment> {
  return piFetch<PiPayment>(
    `/payments/${encodeURIComponent(paymentId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ txid }),
    },
  );
}
