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

export function readGate3ProfileHandover(): Gate3ProfileHandover | null {
  try {
    const raw = localStorage.getItem(GATE3_PROFILE_HANDOVER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Gate3ProfileHandover;
  } catch {
    return null;
  }
}