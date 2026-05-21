/** Minimal TypeScript surface for the Pi Browser SDK we depend on. */

export interface PiSdkPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface PiIncompletePayment {
  identifier: string;
  transaction?: { txid: string; verified: boolean } | null;
}

export interface PiSdkPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (err: Error, payment?: { identifier: string }) => void;
}

export interface PiSdk {
  init(opts: { version: string; sandbox: boolean }): void;
  authenticate(
    scopes: string[],
    onIncompletePaymentFound: (p: PiIncompletePayment) => void,
  ): Promise<{ accessToken: string; user: { uid: string; username: string } }>;
  createPayment(
    payment: PiSdkPaymentData,
    callbacks: PiSdkPaymentCallbacks,
  ): Promise<unknown>;
}

declare global {
  interface Window {
    Pi?: PiSdk;
  }
}

export {};
