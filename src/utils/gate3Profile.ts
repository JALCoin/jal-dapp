import { getScopedStorageKey } from "./scopedStorage";

export const GATE3_PROFILE_HANDOVER_KEY = "gate3_profile_handover_v1";

export type Gate3ProfileHandover = {
  sourceGate: "enter";
  handoffAt: number;
  identity: {
    displayName: string;
    email: string;
    projectName: string;
    tokenSymbol: string;
    dexDomain: string;
    landingButtonLogo: string;
    headerLogo: string;
  };
  payment: {
    status: "missing" | "pending" | "paid" | "failed";
    source: "missing" | "dev" | "verified";
    receiptNumber: string;
    customerEmail: string;
  };
  wallet: {
    connected: boolean;
    address: string;
    connectionSource: "missing" | "dev" | "verified";
    messageSigned: boolean;
    signedMessageSignature: string;
    signingSource: "missing" | "dev" | "verified";
  };
  transaction: {
    initiated: boolean;
    submitted: boolean;
    confirmed: boolean;
    signature: string;
    explorerUrl: string;
    amountSol: number;
    destination: string;
    confirmationSource: "missing" | "dev" | "verified";
  };
  completion: {
    enterPassed: boolean;
    participantState: boolean;
    developmentFlowComplete: boolean;
    buildReady: boolean;
    completedAt: number | null;
  };
  buildPreview: {
    next: string[];
  };
};

export function readGate3ProfileHandover(storageScope?: string | null): Gate3ProfileHandover | null {
  try {
    const raw = localStorage.getItem(
      getScopedStorageKey(GATE3_PROFILE_HANDOVER_KEY, storageScope)
    );
    if (!raw) return null;
    return JSON.parse(raw) as Gate3ProfileHandover;
  } catch {
    return null;
  }
}

export function writeGate3ProfileHandover(
  payload: Gate3ProfileHandover,
  storageScope?: string | null
) {
  localStorage.setItem(
    getScopedStorageKey(GATE3_PROFILE_HANDOVER_KEY, storageScope),
    JSON.stringify(payload)
  );
}
