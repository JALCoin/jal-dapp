import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import TokenFitGameV10 from "../components/TokenFitGamev10";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/shop";

type GatePoint = {
  k: string;
  v: string;
};

type ProofSource = "missing" | "dev" | "verified";
type PaymentStatus = "missing" | "pending" | "paid" | "failed";

type Gate2Stage =
  | "home"
  | "profile"
  | "payment"
  | "module-1-wallet"
  | "module-2-custody"
  | "module-3-finality"
  | "module-4-connection"
  | "module-5-action-path"
  | "module-6-verification"
  | "test"
  | "trial-brief"
  | "trial"
  | "wallet"
  | "transaction"
  | "verify"
  | "passed";

type TrialState =
  | "locked"
  | "available"
  | "in_run"
  | "failed_run"
  | "one_pass"
  | "passed";

type TrialMode = "trial" | "endless";

type TestQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type ModuleContent = {
  stage: Extract<
    Gate2Stage,
    | "module-1-wallet"
    | "module-2-custody"
    | "module-3-finality"
    | "module-4-connection"
    | "module-5-action-path"
    | "module-6-verification"
  >;
  title: string;
  note: string;
  meaning: string[];
  requirement: string[];
  risk: string[];
  nextStage: Gate2Stage;
};

type Gate2ProgressState = {
  privateHomeSeen: boolean;
  currentStage: Gate2Stage;

  profile: {
    created: boolean;
    displayName: string;
    email: string;
    projectName: string;
    tokenSymbol: string;
    dexDomain: string;
    landingButtonLogo: string;
    headerLogo: string;
    acceptedTerms: boolean;
    createdAt: number | null;
  };

  package: {
    checkoutStarted: boolean;
    stripeSessionId: string;
    stripeReceiptNumber: string;
    stripeCustomerEmail: string;
    paymentStatus: PaymentStatus;
    paymentSource: ProofSource;
    paidAt: number | null;
  };

  modulesCompleted: string[];

  test: {
    answers: Record<string, number | null>;
    submitted: boolean;
    score: number;
    passed: boolean;
  };

  trial: {
    state: TrialState;
    unlocked: boolean;
    acknowledged: boolean;
    successfulRuns: number;
    passed: boolean;
    trialHighScore: number;
    endlessHighScore: number;
    bestScore: number;
    lastRunScore: number;
    lastRunPassed: boolean | null;
    lastRunMode: TrialMode | null;
    endlessUnlocked: boolean;
    achievements: {
      firstSuccessfulRun: boolean;
      consistencyRequired: boolean;
      trialComplete: boolean;
      newPersonalBest: boolean;
      endlessScoreImproved: boolean;
      leaderboardEligible: boolean;
      jalClaimPotential: boolean;
    };
  };

  wallet: {
    connected: boolean;
    address: string;
    connectionSource: ProofSource;
    messageSigned: boolean;
    signedMessageText: string;
    signedMessageSignature: string;
    signingSource: ProofSource;
  };

  transaction: {
    initiated: boolean;
    submitted: boolean;
    signature: string;
    confirmed: boolean;
    explorerUrl: string;
    amountSol: number;
    destination: string;
    sourceWallet: string;
    submittedAt: number | null;
    confirmedAt: number | null;
    confirmationSource: ProofSource;
  };

  completion: {
    enterPassed: boolean;
    participantState: boolean;
    developmentFlowComplete: boolean;
    buildReady: boolean;
    completedAt: number | null;
  };
};

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";
const GATE2_PROGRESS_KEY = "gate2_progress_v2";
const GATE2_ADMIN_BYPASS_KEY = "gate2_admin_bypass";
const GATE3_PROFILE_HANDOVER_KEY = "gate3_profile_handover_v1";

const SOLANA_RPC_URL =
  (import.meta as ImportMeta & {
    env?: { VITE_SOLANA_RPC_URL?: string };
  }).env?.VITE_SOLANA_RPC_URL || "https://solana-proxy-production.up.railway.app";

type Gate3ProfileHandover = {
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
    status: PaymentStatus;
    source: ProofSource;
    receiptNumber: string;
    customerEmail: string;
  };
  wallet: {
    connected: boolean;
    address: string;
    connectionSource: ProofSource;
    messageSigned: boolean;
    signedMessageSignature: string;
    signingSource: ProofSource;
  };
  transaction: {
    initiated: boolean;
    submitted: boolean;
    confirmed: boolean;
    signature: string;
    explorerUrl: string;
    amountSol: number;
    destination: string;
    confirmationSource: ProofSource;
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

const MINT_AUTHORITY = "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2";
const CREATOR_DISPLAY_NAME = "JAL";
const CREATOR_EMAIL = "358jal@gmail.com";
const MIN_TRANSFER_SOL = 0.001;
const GATE2_PAYMENT_LINK = "https://buy.stripe.com/14AbJ06ladovgl19EE0x20b";

function normalizeIdentityValue(value: string) {
  return value.trim().toLowerCase();
}

function isCreatorIdentity(displayName: string, email: string) {
  return (
    normalizeIdentityValue(displayName) === normalizeIdentityValue(CREATOR_DISPLAY_NAME) &&
    normalizeIdentityValue(email) === normalizeIdentityValue(CREATOR_EMAIL)
  );
}

const VALID_GATE2_STAGES: Gate2Stage[] = [
  "home",
  "profile",
  "payment",
  "module-1-wallet",
  "module-2-custody",
  "module-3-finality",
  "module-4-connection",
  "module-5-action-path",
  "module-6-verification",
  "test",
  "trial-brief",
  "trial",
  "wallet",
  "transaction",
  "verify",
  "passed",
];

const ENTRY_RAIL: { id: Gate2Stage; title: string; note: string }[] = [
  {
    id: "profile",
    title: "Profile",
    note: "Create the Gate 02 package identity before live progression.",
  },
  {
    id: "payment",
    title: "Payment",
    note: "Gate 02 package truth must exist before deeper access opens.",
  },
  {
    id: "module-1-wallet",
    title: "Learn — Wallet",
    note: "Understand that a wallet is a control point, not a decorative login.",
  },
  {
    id: "module-2-custody",
    title: "Learn — Custody",
    note: "Understand who carries responsibility for control and error.",
  },
  {
    id: "module-3-finality",
    title: "Learn — Finality",
    note: "Understand that signed transactions may be irreversible.",
  },
  {
    id: "module-4-connection",
    title: "Learn — Connection",
    note: "Understand what connection and signing authority actually mean.",
  },
  {
    id: "module-5-action-path",
    title: "Learn — Action Path",
    note: "Understand the first real movement path before it goes live.",
  },
  {
    id: "module-6-verification",
    title: "Learn — Verification",
    note: "Understand how proof must be shown and validated.",
  },
  {
    id: "test",
    title: "Comprehend",
    note: "Pass the comprehension test before trial access opens.",
  },
  {
    id: "trial-brief",
    title: "Trial Brief",
    note: "Read the Gate 2 Token Fit requirements before the trial begins.",
  },
  {
    id: "trial",
    title: "Trial",
    note: "Pass the Gate 02 threshold twice before wallet authority opens.",
  },
  {
    id: "wallet",
    title: "Wallet",
    note: "Connect and sign before sending any real transaction.",
  },
  {
    id: "transaction",
    title: "Transaction",
    note: "Perform the first controlled SOL transfer after proven authority.",
  },
  {
    id: "verify",
    title: "Verify",
    note: "Proof must be visible before state change can be granted.",
  },
  {
    id: "passed",
    title: "Participant",
    note: "Gate 02 sequence complete. Build path is now evaluated from proof.",
  },
];

const GATE2_SEQUENCE: Gate2Stage[] = ENTRY_RAIL.map((step) => step.id);
const JALSOL_SEQUENCE_TITLE = "JALSOL Sequence Progress";

function getPreviousStageId(stage: Gate2Stage): Gate2Stage | null {
  const index = GATE2_SEQUENCE.indexOf(stage);
  if (index <= 0) return null;
  return GATE2_SEQUENCE[index - 1];
}

function getNextStageId(stage: Gate2Stage): Gate2Stage | null {
  const index = GATE2_SEQUENCE.indexOf(stage);
  if (index < 0 || index >= GATE2_SEQUENCE.length - 1) return null;
  return GATE2_SEQUENCE[index + 1];
}

const MODULE_CONTENT: ModuleContent[] = [
  {
    stage: "module-1-wallet",
    title: "Module 1 — Wallet",
    note: "Control point",
    meaning: [
      "A wallet is not decoration and it is not only a login.",
      "Inside Gate 02, the wallet is the point of control that gives authority to sign real actions.",
      "Once a wallet is connected and used, movement stops being theoretical.",
    ],
    requirement: [
      "Understand that wallet connection is not cosmetic.",
      "Understand that the wallet is where signing authority begins.",
      "Understand that later Gate 02 phases depend on this control point being handled correctly.",
    ],
    risk: [
      "If the user treats wallet connection like a harmless login, they may approve an action without understanding what they are authorising.",
      "Gate 02 exists to stop that kind of careless movement before it happens.",
    ],
    nextStage: "module-2-custody",
  },
  {
    stage: "module-2-custody",
    title: "Module 2 — Custody",
    note: "Responsibility layer",
    meaning: [
      "Custody means who holds practical responsibility for control and error.",
      "On a guided platform, some burden is carried by the platform.",
      "As the user moves closer to direct wallet control, responsibility moves closer to the user.",
    ],
    requirement: [
      "Understand that control and responsibility travel together.",
      "Understand that more direct control means less room for careless behaviour.",
      "Understand that Gate 02 is preparing the user to act with ownership, not dependency.",
    ],
    risk: [
      "If the user wants the benefits of control without the responsibility of control, errors become more likely.",
      "Custody confusion creates false confidence before real consequence.",
    ],
    nextStage: "module-3-finality",
  },
  {
    stage: "module-3-finality",
    title: "Module 3 — Transaction Finality",
    note: "Irreversibility",
    meaning: [
      "A transaction is a signed instruction that can change state.",
      "Once an instruction is signed and confirmed, reversal may not be available.",
      "Finality is what makes careless movement expensive.",
    ],
    requirement: [
      "Understand that the system is not asking for random clicks.",
      "Understand that later signing phases must be reviewed before approval.",
      "Understand that consequence is part of why Gate 02 is structured slowly.",
    ],
    risk: [
      "If the user assumes every action can be undone, they will treat signing too casually.",
      "Believing that confirmation is harmless destroys procedural discipline.",
    ],
    nextStage: "module-4-connection",
  },
  {
    stage: "module-4-connection",
    title: "Module 4 — Connection and Signing",
    note: "Authority binding",
    meaning: [
      "Connection binds the wallet to a live system context.",
      "Signing is the act that proves the user is authorising the instruction.",
      "Connection without understanding creates friction. Signing without understanding creates damage.",
    ],
    requirement: [
      "Understand the difference between being connected and approving an action.",
      "Understand that signing is not only technical — it is behavioural authority.",
      "Understand that the user must review details before granting approval.",
    ],
    risk: [
      "If the user does not distinguish connection from signing, they may authorise something they did not intend.",
      "A rushed signer becomes vulnerable to avoidable mistakes.",
    ],
    nextStage: "module-5-action-path",
  },
  {
    stage: "module-5-action-path",
    title: "Module 5 — First Real Action Path",
    note: "Execution preview",
    meaning: [
      "Gate 02 does not jump from theory into unexplained execution.",
      "The real action phase will require wallet connection, message signing, transaction review, and a fixed minimal SOL transfer.",
      "This path exists so the user knows what is coming before consequence is live.",
    ],
    requirement: [
      "Understand the order: profile, payment, learn, test, trial, wallet, transaction, verification.",
      "Understand that the real action will be deliberate, not spontaneous.",
      "Understand that the transfer phase is the participant threshold.",
    ],
    risk: [
      "If the real path feels vague, the user begins guessing.",
      "Execution without a clear path causes hesitation or blind approval.",
    ],
    nextStage: "module-6-verification",
  },
  {
    stage: "module-6-verification",
    title: "Module 6 — Verification",
    note: "Proof layer",
    meaning: [
      "Verification is what separates a claimed action from a proven one.",
      "Gate 02 does not succeed because the user says they acted. It succeeds because proof is visible.",
      "Wallet address, signed message, transaction signature, confirmation state, and explorer proof complete the sequence.",
    ],
    requirement: [
      "Understand that proof must be shown after the real transaction phase.",
      "Understand that verification is part of the pass condition, not a nice extra.",
      "Understand that participant state is only granted after proof exists.",
    ],
    risk: [
      "Without verification, completion becomes guesswork.",
      "If proof is not required, Gate 02 loses legitimacy and seriousness.",
    ],
    nextStage: "test",
  },
];

const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: "wallet-control",
    prompt: "What is the wallet in Gate 02 primarily being treated as?",
    options: [
      "A decorative profile feature",
      "A control point that carries signing authority",
      "A rewards account for points",
      "A temporary nickname login",
    ],
    correctIndex: 1,
    explanation:
      "Gate 02 treats the wallet as the control point where real authority begins.",
  },
  {
    id: "custody-responsibility",
    prompt: "What does custody mean inside Gate 02?",
    options: [
      "The system carries all responsibility for user actions",
      "Responsibility disappears once a wallet is connected",
      "Whoever carries control also carries responsibility",
      "Custody only matters after Build",
    ],
    correctIndex: 2,
    explanation:
      "Control and responsibility move together. More direct control means more direct responsibility.",
  },
  {
    id: "transaction-finality",
    prompt: "Why does Gate 02 teach transaction finality before execution?",
    options: [
      "Because every transaction can always be reversed later",
      "Because signing and confirmation may create irreversible consequence",
      "Because finality only applies to large transactions",
      "Because wallet connection automatically cancels mistakes",
    ],
    correctIndex: 1,
    explanation:
      "Gate 02 slows the user down so they understand that signed and confirmed actions may be irreversible.",
  },
  {
    id: "connection-vs-signing",
    prompt: "Which statement is correct about connection and signing?",
    options: [
      "They are the same action with different names",
      "Connection is harmless but signing never matters",
      "Connection binds the wallet to context; signing authorises the instruction",
      "Signing happens automatically and does not require review",
    ],
    correctIndex: 2,
    explanation:
      "Connection and signing are different. Signing is the act that grants real authority.",
  },
  {
    id: "gate-order",
    prompt:
      "What is the correct Gate 02 order before participant state can be granted?",
    options: [
      "Wallet, transaction, trial, verification",
      "Profile, payment, learn, test, trial, wallet, transaction, verification",
      "Trial, wallet, learn, transaction, verification",
      "Learn, wallet, transaction, trial, verification",
    ],
    correctIndex: 1,
    explanation:
      "Gate 02 enforces sequence. Understanding and readiness come before pressure, execution, and proof.",
  },
];

const DEFAULT_GATE2_PROGRESS: Gate2ProgressState = {
  privateHomeSeen: false,
  currentStage: "home",
  profile: {
    created: false,
    displayName: "",
    email: "",
    projectName: "",
    tokenSymbol: "",
    dexDomain: "",
    landingButtonLogo: "",
    headerLogo: "",
    acceptedTerms: false,
    createdAt: null,
  },
  package: {
    checkoutStarted: false,
    stripeSessionId: "",
    stripeReceiptNumber: "",
    stripeCustomerEmail: "",
    paymentStatus: "missing",
    paymentSource: "missing",
    paidAt: null,
  },
  modulesCompleted: [],
  test: {
    answers: {},
    submitted: false,
    score: 0,
    passed: false,
  },
  trial: {
    state: "locked",
    unlocked: false,
    acknowledged: false,
    successfulRuns: 0,
    passed: false,
    trialHighScore: 0,
    endlessHighScore: 0,
    bestScore: 0,
    lastRunScore: 0,
    lastRunPassed: null,
    lastRunMode: null,
    endlessUnlocked: false,
    achievements: {
      firstSuccessfulRun: false,
      consistencyRequired: false,
      trialComplete: false,
      newPersonalBest: false,
      endlessScoreImproved: false,
      leaderboardEligible: false,
      jalClaimPotential: false,
    },
  },
  wallet: {
    connected: false,
    address: "",
    connectionSource: "missing",
    messageSigned: false,
    signedMessageText: "",
    signedMessageSignature: "",
    signingSource: "missing",
  },
  transaction: {
    initiated: false,
    submitted: false,
    signature: "",
    confirmed: false,
    explorerUrl: "",
    amountSol: MIN_TRANSFER_SOL,
    destination: MINT_AUTHORITY,
    sourceWallet: "",
    submittedAt: null,
    confirmedAt: null,
    confirmationSource: "missing",
  },
  completion: {
    enterPassed: false,
    participantState: false,
    developmentFlowComplete: false,
    buildReady: false,
    completedAt: null,
  },
};

function isValidGate2Stage(value: unknown): value is Gate2Stage {
  return typeof value === "string" && VALID_GATE2_STAGES.includes(value as Gate2Stage);
}

function isValidTrialState(value: unknown): value is TrialState {
  return (
    value === "locked" ||
    value === "available" ||
    value === "in_run" ||
    value === "failed_run" ||
    value === "one_pass" ||
    value === "passed"
  );
}

function isValidProofSource(value: unknown): value is ProofSource {
  return value === "missing" || value === "dev" || value === "verified";
}

function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "missing" || value === "pending" || value === "paid" || value === "failed";
}

function readObservePassed(): boolean {
  try {
    const raw = localStorage.getItem(OBSERVE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(
      parsed?.passed && parsed?.gate === "observe" && parsed?.nextGate === "enter"
    );
  } catch {
    return false;
  }
}

function readGate2AdminBypass(): boolean {
  return localStorage.getItem(GATE2_ADMIN_BYPASS_KEY) === "true";
}

function readGate2Progress(): Gate2ProgressState {
  try {
    const raw = localStorage.getItem(GATE2_PROGRESS_KEY);
    if (!raw) return DEFAULT_GATE2_PROGRESS;

    const parsed = JSON.parse(raw) as Partial<Gate2ProgressState>;

    return {
      privateHomeSeen: Boolean(parsed.privateHomeSeen),
      currentStage: isValidGate2Stage(parsed.currentStage)
        ? parsed.currentStage
        : "home",

      profile: {
        created: Boolean(parsed.profile?.created),
        displayName:
          typeof parsed.profile?.displayName === "string"
            ? parsed.profile.displayName
            : "",
        email:
          typeof parsed.profile?.email === "string" ? parsed.profile.email : "",
        projectName:
          typeof parsed.profile?.projectName === "string"
            ? parsed.profile.projectName
            : "",
        tokenSymbol:
          typeof parsed.profile?.tokenSymbol === "string"
            ? parsed.profile.tokenSymbol
            : "",
        dexDomain:
          typeof parsed.profile?.dexDomain === "string"
            ? parsed.profile.dexDomain
            : "",
        landingButtonLogo:
          typeof parsed.profile?.landingButtonLogo === "string"
            ? parsed.profile.landingButtonLogo
            : "",
        headerLogo:
          typeof parsed.profile?.headerLogo === "string"
            ? parsed.profile.headerLogo
            : "",
        acceptedTerms: Boolean(parsed.profile?.acceptedTerms),
        createdAt:
          typeof parsed.profile?.createdAt === "number"
            ? parsed.profile.createdAt
            : null,
      },

      package: {
        checkoutStarted: Boolean(parsed.package?.checkoutStarted),
        stripeSessionId:
          typeof parsed.package?.stripeSessionId === "string"
            ? parsed.package.stripeSessionId
            : "",
        stripeReceiptNumber:
          typeof parsed.package?.stripeReceiptNumber === "string"
            ? parsed.package.stripeReceiptNumber
            : "",
        stripeCustomerEmail:
          typeof parsed.package?.stripeCustomerEmail === "string"
            ? parsed.package.stripeCustomerEmail
            : "",
        paymentStatus: isValidPaymentStatus(parsed.package?.paymentStatus)
          ? parsed.package.paymentStatus
          : "missing",
        paymentSource: isValidProofSource(parsed.package?.paymentSource)
          ? parsed.package.paymentSource
          : "missing",
        paidAt:
          typeof parsed.package?.paidAt === "number" ? parsed.package.paidAt : null,
      },

      modulesCompleted: Array.isArray(parsed.modulesCompleted)
        ? parsed.modulesCompleted.filter(
            (item): item is string => typeof item === "string"
          )
        : [],

      test: {
        answers:
          parsed.test?.answers && typeof parsed.test.answers === "object"
            ? parsed.test.answers
            : {},
        submitted: Boolean(parsed.test?.submitted),
        score: typeof parsed.test?.score === "number" ? parsed.test.score : 0,
        passed: Boolean(parsed.test?.passed),
      },

      trial: {
        state: isValidTrialState(parsed.trial?.state) ? parsed.trial.state : "locked",
        unlocked: Boolean(parsed.trial?.unlocked),
        acknowledged: Boolean(parsed.trial?.acknowledged),
        successfulRuns:
          typeof parsed.trial?.successfulRuns === "number"
            ? parsed.trial.successfulRuns
            : 0,
        passed: Boolean(parsed.trial?.passed),
        trialHighScore:
          typeof parsed.trial?.trialHighScore === "number"
            ? parsed.trial.trialHighScore
            : 0,
        endlessHighScore:
          typeof parsed.trial?.endlessHighScore === "number"
            ? parsed.trial.endlessHighScore
            : 0,
        bestScore:
          typeof parsed.trial?.bestScore === "number" ? parsed.trial.bestScore : 0,
        lastRunScore:
          typeof parsed.trial?.lastRunScore === "number"
            ? parsed.trial.lastRunScore
            : 0,
        lastRunPassed:
          typeof parsed.trial?.lastRunPassed === "boolean"
            ? parsed.trial.lastRunPassed
            : null,
        lastRunMode:
          parsed.trial?.lastRunMode === "trial" ||
          parsed.trial?.lastRunMode === "endless"
            ? parsed.trial.lastRunMode
            : null,
        endlessUnlocked: Boolean(parsed.trial?.endlessUnlocked),
        achievements: {
          firstSuccessfulRun: Boolean(parsed.trial?.achievements?.firstSuccessfulRun),
          consistencyRequired: Boolean(parsed.trial?.achievements?.consistencyRequired),
          trialComplete: Boolean(parsed.trial?.achievements?.trialComplete),
          newPersonalBest: Boolean(parsed.trial?.achievements?.newPersonalBest),
          endlessScoreImproved: Boolean(parsed.trial?.achievements?.endlessScoreImproved),
          leaderboardEligible: Boolean(parsed.trial?.achievements?.leaderboardEligible),
          jalClaimPotential: Boolean(parsed.trial?.achievements?.jalClaimPotential),
        },
      },

      wallet: {
        connected: Boolean(parsed.wallet?.connected),
        address:
          typeof parsed.wallet?.address === "string" ? parsed.wallet.address : "",
        connectionSource: isValidProofSource(parsed.wallet?.connectionSource)
          ? parsed.wallet.connectionSource
          : "missing",
        messageSigned: Boolean(parsed.wallet?.messageSigned),
        signedMessageText:
          typeof parsed.wallet?.signedMessageText === "string"
            ? parsed.wallet.signedMessageText
            : "",
        signedMessageSignature:
          typeof parsed.wallet?.signedMessageSignature === "string"
            ? parsed.wallet.signedMessageSignature
            : "",
        signingSource: isValidProofSource(parsed.wallet?.signingSource)
          ? parsed.wallet.signingSource
          : "missing",
      },

      transaction: {
        initiated: Boolean(parsed.transaction?.initiated),
        submitted: Boolean(parsed.transaction?.submitted),
        signature:
          typeof parsed.transaction?.signature === "string"
            ? parsed.transaction.signature
            : "",
        confirmed: Boolean(parsed.transaction?.confirmed),
        explorerUrl:
          typeof parsed.transaction?.explorerUrl === "string"
            ? parsed.transaction.explorerUrl
            : "",
        amountSol:
          typeof parsed.transaction?.amountSol === "number"
            ? parsed.transaction.amountSol
            : MIN_TRANSFER_SOL,
        destination:
          typeof parsed.transaction?.destination === "string"
            ? parsed.transaction.destination
            : MINT_AUTHORITY,
        sourceWallet:
          typeof parsed.transaction?.sourceWallet === "string"
            ? parsed.transaction.sourceWallet
            : "",
        submittedAt:
          typeof parsed.transaction?.submittedAt === "number"
            ? parsed.transaction.submittedAt
            : null,
        confirmedAt:
          typeof parsed.transaction?.confirmedAt === "number"
            ? parsed.transaction.confirmedAt
            : null,
        confirmationSource: isValidProofSource(parsed.transaction?.confirmationSource)
          ? parsed.transaction.confirmationSource
          : "missing",
      },

      completion: {
        enterPassed: Boolean(parsed.completion?.enterPassed),
        participantState: Boolean(parsed.completion?.participantState),
        developmentFlowComplete: Boolean(parsed.completion?.developmentFlowComplete),
        buildReady: Boolean(parsed.completion?.buildReady),
        completedAt:
          typeof parsed.completion?.completedAt === "number"
            ? parsed.completion.completedAt
            : null,
      },
    };
  } catch {
    return DEFAULT_GATE2_PROGRESS;
  }
}

function writeGate2Progress(progress: Gate2ProgressState) {
  localStorage.setItem(GATE2_PROGRESS_KEY, JSON.stringify(progress));
}

function createMockSessionId() {
  return `cs_test_${Date.now().toString(36)}`;
}

function createMockReceiptNumber() {
  return `rcpt_${Date.now().toString(36).toUpperCase()}`;
}

function buildSigningMessage(displayName: string) {
  return [
    "JAL/SOL Gate 02 — Enter",
    `Display Name: ${displayName || "Unnamed"}`,
    `Authority Wallet: ${MINT_AUTHORITY}`,
    "Purpose: prove control before first transfer",
  ].join("\n");
}

function getPaymentComplete(progress: Gate2ProgressState) {
  return (
    progress.package.paymentStatus === "paid" &&
    progress.package.paymentSource === "verified"
  );
}

function getCreatorBypass(progress: Gate2ProgressState) {
  return isCreatorIdentity(progress.profile.displayName, progress.profile.email);
}

function getPaymentOrCreatorAccess(progress: Gate2ProgressState) {
  return getPaymentComplete(progress) || getCreatorBypass(progress);
}

function getHasWalletAuthority(progress: Gate2ProgressState) {
  return progress.wallet.connected && progress.wallet.messageSigned;
}

function getDevelopmentFlowComplete(progress: Gate2ProgressState) {
  return Boolean(
    progress.profile.created &&
      progress.profile.acceptedTerms &&
      getPaymentOrCreatorAccess(progress) &&
      progress.modulesCompleted.includes("module-6-verification") &&
      progress.test.passed &&
      progress.trial.passed &&
      progress.wallet.connected &&
      progress.wallet.messageSigned &&
      progress.transaction.submitted &&
      progress.transaction.confirmed
  );
}

function getTrueParticipantState(progress: Gate2ProgressState) {
  const creatorBypass = getCreatorBypass(progress);

  return Boolean(
    getDevelopmentFlowComplete(progress) &&
      (creatorBypass || progress.package.paymentSource === "verified") &&
      progress.wallet.connectionSource === "verified" &&
      progress.wallet.signingSource === "verified" &&
      progress.transaction.confirmationSource === "verified"
  );
}

function canAccessStage(progress: Gate2ProgressState, stage: Gate2Stage): boolean {
  switch (stage) {
    case "home":
    case "profile":
      return true;
    case "payment":
      return progress.profile.created && progress.profile.acceptedTerms;
    case "module-1-wallet":
      return getPaymentOrCreatorAccess(progress);
    case "module-2-custody":
      return progress.modulesCompleted.includes("module-1-wallet");
    case "module-3-finality":
      return progress.modulesCompleted.includes("module-2-custody");
    case "module-4-connection":
      return progress.modulesCompleted.includes("module-3-finality");
    case "module-5-action-path":
      return progress.modulesCompleted.includes("module-4-connection");
    case "module-6-verification":
      return progress.modulesCompleted.includes("module-5-action-path");
    case "test":
      return progress.modulesCompleted.includes("module-6-verification");
    case "trial-brief":
      return progress.test.passed;
    case "trial":
      return progress.trial.acknowledged;
    case "wallet":
      return progress.trial.passed;
    case "transaction":
      return getHasWalletAuthority(progress);
    case "verify":
      return progress.transaction.submitted;
    case "passed":
      return getDevelopmentFlowComplete(progress);
    default:
      return false;
  }
}

function isStepCompleted(progress: Gate2ProgressState, stepId: Gate2Stage): boolean {
  if (progress.modulesCompleted.includes(stepId)) return true;

  switch (stepId) {
  case "profile":
      return progress.profile.created;
    case "payment":
      return getPaymentOrCreatorAccess(progress);
    case "test":
      return progress.test.passed;
    case "trial-brief":
      return progress.trial.acknowledged;
    case "trial":
      return progress.trial.passed;
    case "wallet":
      return getHasWalletAuthority(progress);
    case "transaction":
      return progress.transaction.submitted;
    case "verify":
      return progress.transaction.confirmed;
    case "passed":
      return progress.completion.enterPassed;
    default:
      return false;
  }
}

function getStatusTone(ready: boolean) {
  return ready ? "jal-cred-ok" : "jal-cred-bad";
}
function shortenAddress(value: string, left = 4, right = 4) {
  if (!value || value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function buildExplorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`;
}

function createGate3ProfileHandover(progress: Gate2ProgressState): Gate3ProfileHandover {
  return {
    sourceGate: "enter",
    handoffAt: Date.now(),
    identity: {
  displayName: progress.profile.displayName,
  email: progress.profile.email,
  projectName: progress.profile.projectName,
  tokenSymbol: progress.profile.tokenSymbol,
  dexDomain: progress.profile.dexDomain,
  landingButtonLogo: progress.profile.landingButtonLogo,
  headerLogo: progress.profile.headerLogo,
},
    payment: {
      status: progress.package.paymentStatus,
      source: progress.package.paymentSource,
      receiptNumber: progress.package.stripeReceiptNumber,
      customerEmail: progress.package.stripeCustomerEmail,
    },
    wallet: {
      connected: progress.wallet.connected,
      address: progress.wallet.address,
      connectionSource: progress.wallet.connectionSource,
      messageSigned: progress.wallet.messageSigned,
      signedMessageSignature: progress.wallet.signedMessageSignature,
      signingSource: progress.wallet.signingSource,
    },
    transaction: {
      initiated: progress.transaction.initiated,
      submitted: progress.transaction.submitted,
      confirmed: progress.transaction.confirmed,
      signature: progress.transaction.signature,
      explorerUrl: progress.transaction.explorerUrl,
      amountSol: progress.transaction.amountSol,
      destination: progress.transaction.destination,
      confirmationSource: progress.transaction.confirmationSource,
    },
    completion: {
      enterPassed: progress.completion.enterPassed,
      participantState: progress.completion.participantState,
      developmentFlowComplete: progress.completion.developmentFlowComplete,
      buildReady: progress.completion.buildReady,
      completedAt: progress.completion.completedAt,
    },
    buildPreview: {
      next: [
        "Create token mint",
        "Create associated token account",
        "Mint supply",
        "Attach metadata",
        "Open Vault / Build identity",
      ],
    },
  };
}

function writeGate3ProfileHandover(progress: Gate2ProgressState) {
  const payload = createGate3ProfileHandover(progress);
  localStorage.setItem(GATE3_PROFILE_HANDOVER_KEY, JSON.stringify(payload));
}

export default function JalSolEnter() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const { publicKey, connected, sendTransaction, signMessage } = useWallet();

    const connection = useMemo(
    () => new Connection(SOLANA_RPC_URL, "confirmed"),
    []
  );

  const [loading, setLoading] = useState(false);
  const [observePassed, setObservePassed] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const [progress, setProgress] =
    useState<Gate2ProgressState>(DEFAULT_GATE2_PROGRESS);

  const [profileDraft, setProfileDraft] = useState(DEFAULT_GATE2_PROGRESS.profile);
  const [profileError, setProfileError] = useState("");
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [showPaymentCeremony, setShowPaymentCeremony] = useState(false);
  const [paymentCommitChecked, setPaymentCommitChecked] = useState(false);

  function patchProgress(recipe: (prev: Gate2ProgressState) => Gate2ProgressState) {
    setProgress((prev) => {
      const cooked = recipe(prev);
      const complete = getDevelopmentFlowComplete(cooked);

      const withCompletion: Gate2ProgressState = {
        ...cooked,
        completion: {
          ...cooked.completion,
          enterPassed: complete,
          participantState: getTrueParticipantState(cooked),
          developmentFlowComplete: complete,
          buildReady: getTrueParticipantState(cooked),
          completedAt: complete
            ? cooked.completion.completedAt ?? Date.now()
            : null,
        },
      };

      writeGate2Progress(withCompletion);
      return withCompletion;
    });
  }

  useEffect(() => {
  const observe = readObservePassed();
  const bypass = readGate2AdminBypass();
  const saved = readGate2Progress();

  setObservePassed(observe);
  setAdminBypass(bypass);
  setProgress(saved);
  setProfileDraft(saved.profile.created ? saved.profile : DEFAULT_GATE2_PROGRESS.profile);
}, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      document.body.style.pointerEvents = "";
    };
  }, []);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paid = params.get("paid");

  if (paid !== "true") return;
  if (!progress.profile.created) return;

  setShowPaymentCeremony(false);
  setPaymentCommitChecked(false);

  if (
    progress.package.paymentStatus === "paid" &&
    progress.package.paymentSource === "verified"
  ) {
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

    patchProgress((prev) => {
      return {
        ...prev,
        package: {
          ...prev.package,
          checkoutStarted: true,
          stripeSessionId: prev.package.stripeSessionId || createMockSessionId(),
          stripeReceiptNumber:
            prev.package.stripeReceiptNumber || createMockReceiptNumber(),
          stripeCustomerEmail: prev.profile.email,
          paymentStatus: "paid",
          paymentSource: "verified",
          paidAt: prev.package.paidAt ?? Date.now(),
        },
        currentStage: "module-1-wallet",
      };
    });

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [
    progress.profile.created,
    progress.package.paymentStatus,
    progress.package.paymentSource,
  ]);

      useEffect(() => {
    if (!progress.trial.passed) return;

    if (connected && publicKey) {
      patchProgress((prev) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          connected: true,
          address: publicKey.toBase58(),
          connectionSource: "verified",
        },
      }));
      return;
    }

    if (!connected && progress.wallet.connected) {
      setVerifyMessage("");
      patchProgress((prev) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          connected: false,
          address: "",
          connectionSource: "missing",
          messageSigned: false,
          signedMessageText: "",
          signedMessageSignature: "",
          signingSource: "missing",
        },
      }));
    }
  }, [connected, publicKey, progress.trial.passed]);

  const canEnterGate2 = adminBypass || observePassed;
  const currentStage = progress.currentStage;
  const activeModule = currentStage.startsWith("module-")
    ? MODULE_CONTENT.find((module) => module.stage === currentStage) ?? null
    : null;

  const currentStageLabel =
    ENTRY_RAIL.find((step) => step.id === currentStage)?.title || currentStage;

  const currentStageIndex = GATE2_SEQUENCE.indexOf(currentStage);
  const previousStageId = getPreviousStageId(currentStage);
  const nextStageId = getNextStageId(currentStage);
  const showCompactHeader = currentStage !== "home";
  const shouldShowFullHero = currentStage === "home";

      const allTestAnswered = useMemo(
    () =>
      TEST_QUESTIONS.every(
        (question) => typeof progress.test.answers[question.id] === "number"
      ),
    [progress.test.answers]
  );

  const creatorBypass = getCreatorBypass(progress);
  const hasWalletAuthority = getHasWalletAuthority(progress);
  const developmentFlowComplete = getDevelopmentFlowComplete(progress);
  const participantState = getTrueParticipantState(progress);

  const isCreatorProfile = creatorBypass;

  const isCreatorDraft = isCreatorIdentity(
    profileDraft.displayName,
    profileDraft.email
  );

  const accessLabel = !canEnterGate2
    ? "Locked — Observe Required"
    : currentStage === "home"
    ? "Entry Sequence Ready"
    : participantState
    ? "Participant State Achieved"
    : developmentFlowComplete
    ? "Development Flow Complete"
    : "Sequence Active";

  function beginRoute(to: RouteTo) {
    if (loading) return;

    setLoading(true);
    document.body.style.pointerEvents = "none";

    timerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(to);
      document.body.style.pointerEvents = "";
    }, 1200);
  }

    function goToStage(stage: Gate2Stage) {
    setVerifyMessage("");
    patchProgress((prev) => {
      const reviewUnlocked =
  prev.completion.enterPassed && GATE2_SEQUENCE.includes(stage);

if (
  !reviewUnlocked &&
  !canAccessStage(prev, stage) &&
  stage !== "home" &&
  stage !== "profile"
) {
  return prev;
}

      return {
        ...prev,
        currentStage: stage,
      };
    });
  }

    function goBackStage(stage: Gate2Stage) {
    setVerifyMessage("");
    patchProgress((prev) => ({
      ...prev,
      currentStage: stage,
    }));
  }

  function handleProfileSave() {
    if (loading) return;

        const cleanDisplayName = profileDraft.displayName.trim();
        const cleanEmail = profileDraft.email.trim().toLowerCase();

    if (!cleanDisplayName || !cleanEmail || !profileDraft.acceptedTerms) {
      setProfileError("Display name, email, and terms acceptance are required.");
      return;
    }

        const creatorIdentity = isCreatorIdentity(cleanDisplayName, cleanEmail);

    patchProgress((prev) => ({
      ...prev,
      profile: {
  ...prev.profile,
  created: true,
  displayName: cleanDisplayName,
  email: cleanEmail,
  projectName: profileDraft.projectName.trim(),
  tokenSymbol: profileDraft.tokenSymbol.trim().toUpperCase(),
  dexDomain: prev.profile.dexDomain,
  landingButtonLogo: prev.profile.landingButtonLogo,
  headerLogo: prev.profile.headerLogo,
  acceptedTerms: true,
  createdAt: prev.profile.createdAt ?? Date.now(),
},
        package: creatorIdentity
        ? {
            ...prev.package,
            checkoutStarted: false,
            stripeSessionId: "CREATOR_BYPASS",
            stripeReceiptNumber: "CREATOR_BYPASS",
            stripeCustomerEmail: cleanEmail,
            paymentStatus: "paid",
            paymentSource: "verified",
            paidAt: prev.package.paidAt ?? Date.now(),
          }
        : prev.package,
      currentStage: creatorIdentity ? "module-1-wallet" : "payment",
    }));

    setProfileDraft((prev) => ({
  ...prev,
  created: true,
  displayName: cleanDisplayName,
  email: cleanEmail,
  projectName: prev.projectName.trim(),
  tokenSymbol: prev.tokenSymbol.trim().toUpperCase(),
  acceptedTerms: true,
  createdAt: prev.createdAt ?? Date.now(),
}));

    setProfileError("");
  }

  function handleModuleContinue(module: ModuleContent) {
    if (loading) return;

    patchProgress((prev) => {
      const nextModules = prev.modulesCompleted.includes(module.stage)
        ? prev.modulesCompleted
        : [...prev.modulesCompleted, module.stage];

      return {
        ...prev,
        modulesCompleted: nextModules,
        currentStage: module.nextStage,
      };
    });
  }

  function updateTestAnswer(questionId: string, answerIndex: number) {
    patchProgress((prev) => ({
      ...prev,
      test: {
        ...prev.test,
        answers: {
          ...prev.test.answers,
          [questionId]: answerIndex,
        },
        submitted: false,
      },
    }));
  }

  function resetComprehensionTest() {
    patchProgress((prev) => ({
      ...prev,
      test: {
        answers: {},
        submitted: false,
        score: 0,
        passed: false,
      },
    }));
  }

  function submitComprehensionTest() {
    if (loading || !allTestAnswered) return;

    const score = TEST_QUESTIONS.reduce((total, question) => {
      return total + (progress.test.answers[question.id] === question.correctIndex ? 1 : 0);
    }, 0);

    const passed = score >= 4;

    patchProgress((prev) => ({
      ...prev,
      test: {
        ...prev.test,
        submitted: true,
        score,
        passed,
      },
      currentStage: passed ? "trial-brief" : "test",
    }));
  }

  function handleTrialRunComplete(payload: { score: number; mode: TrialMode }) {
    const numeric = Number(payload.score);
    if (!Number.isFinite(numeric) || numeric < 0) return;

    patchProgress((prev): Gate2ProgressState => {
      const priorBest = prev.trial.bestScore;
      const priorEndlessHigh = prev.trial.endlessHighScore;
      const passedRun = payload.mode === "trial" ? numeric >= 20 : true;

      let successfulRuns = prev.trial.successfulRuns;
      let passed = prev.trial.passed;
      let state: TrialState = prev.trial.state;

      if (payload.mode === "trial") {
        successfulRuns = passedRun ? prev.trial.successfulRuns + 1 : 0;
        passed = successfulRuns >= 2;
        state = !passedRun ? "failed_run" : passed ? "passed" : "one_pass";
      } else {
        state = prev.trial.passed ? "passed" : prev.trial.state;
      }

      const trialHighScore =
        payload.mode === "trial"
          ? Math.max(prev.trial.trialHighScore, numeric)
          : prev.trial.trialHighScore;

      const endlessHighScore =
        payload.mode === "endless"
          ? Math.max(prev.trial.endlessHighScore, numeric)
          : prev.trial.endlessHighScore;

      const bestScore = Math.max(priorBest, numeric);

      return {
        ...prev,
        trial: {
          ...prev.trial,
          state,
          unlocked: true,
          acknowledged: true,
          successfulRuns,
          passed,
          trialHighScore,
          endlessHighScore,
          bestScore,
          lastRunScore: numeric,
          lastRunPassed: payload.mode === "trial" ? passedRun : true,
          lastRunMode: payload.mode,
          endlessUnlocked: passed,
          achievements: {
            firstSuccessfulRun:
              prev.trial.achievements.firstSuccessfulRun ||
              (payload.mode === "trial" && passedRun),
            consistencyRequired:
              prev.trial.achievements.consistencyRequired || successfulRuns >= 1,
            trialComplete: prev.trial.achievements.trialComplete || passed,
            newPersonalBest:
              payload.mode === "trial"
                ? numeric > priorBest
                : prev.trial.achievements.newPersonalBest,
            endlessScoreImproved:
              payload.mode === "endless"
                ? numeric > priorEndlessHigh
                : prev.trial.achievements.endlessScoreImproved,
            leaderboardEligible:
              prev.trial.achievements.leaderboardEligible || passed || numeric >= 30,
            jalClaimPotential:
              prev.trial.achievements.jalClaimPotential || numeric >= 40,
          },
        },
        currentStage: passed ? "wallet" : "trial",
      };
    });
  }

    function resetTrialProgress() {
    setVerifyMessage("");
    patchProgress((prev) => ({
      ...prev,
      trial: {
        ...prev.trial,
        state: prev.trial.acknowledged ? "available" : "locked",
        unlocked: prev.trial.unlocked,
        acknowledged: prev.trial.acknowledged,
        successfulRuns: 0,
        passed: false,
        trialHighScore: 0,
        endlessHighScore: 0,
        bestScore: 0,
        lastRunScore: 0,
        lastRunPassed: null,
        lastRunMode: null,
        endlessUnlocked: false,
        achievements: {
          firstSuccessfulRun: false,
          consistencyRequired: false,
          trialComplete: false,
          newPersonalBest: false,
          endlessScoreImproved: false,
          leaderboardEligible: false,
          jalClaimPotential: false,
        },
      },
            wallet: {
        ...prev.wallet,
        connected: false,
        address: "",
        connectionSource: "missing",
        messageSigned: false,
        signedMessageText: "",
        signedMessageSignature: "",
        signingSource: "missing",
      },
      transaction: {
        initiated: false,
        submitted: false,
        signature: "",
        confirmed: false,
        explorerUrl: "",
        amountSol: MIN_TRANSFER_SOL,
        destination: MINT_AUTHORITY,
        sourceWallet: "",
        submittedAt: null,
        confirmedAt: null,
        confirmationSource: "missing",
      },
      currentStage: "trial",
    }));
  }

      function syncConnectedWallet() {
  if (loading || !progress.trial.passed || !connected || !publicKey) return;

  patchProgress((prev) => ({
    ...prev,
    wallet: {
      ...prev.wallet,
      connected: true,
      address: publicKey.toBase58(),
      connectionSource: "verified",
    },
  }));
}

      async function handleWalletSignReal() {
  if (loading || !progress.wallet.connected || !publicKey || !signMessage) return;

  try {
    setLoading(true);
    setVerifyMessage("");

    const message = buildSigningMessage(progress.profile.displayName);
    const encoded = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(encoded);

    const signatureBase64 = btoa(
      String.fromCharCode(...Array.from(signatureBytes))
    );

    patchProgress((prev) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        messageSigned: true,
        signedMessageText: message,
        signedMessageSignature: signatureBase64,
        signingSource: "verified",
      },
      currentStage: "transaction",
    }));
  } catch (error) {
  console.error("Gate 02 signing failed:", error);
  setVerifyMessage("Message signing was cancelled or failed. Please try again.");
} finally {
    setLoading(false);
  }
}

  function resetWalletState() {
  setVerifyMessage("");

  patchProgress((prev) => ({
    ...prev,
    wallet: {
  ...prev.wallet,
  connected: false,
  address: "",
  connectionSource: "missing",
  messageSigned: false,
  signedMessageText: "",
  signedMessageSignature: "",
  signingSource: "missing",
},
    transaction: {
      initiated: false,
      submitted: false,
      signature: "",
      confirmed: false,
      explorerUrl: "",
      amountSol: MIN_TRANSFER_SOL,
      destination: MINT_AUTHORITY,
      sourceWallet: "",
      submittedAt: null,
      confirmedAt: null,
      confirmationSource: "missing",
    },
    currentStage: "wallet",
  }));
}

  async function handleTransactionStartReal() {
  if (
    loading ||
    !hasWalletAuthority ||
    !publicKey ||
    !sendTransaction ||
    !progress.transaction.destination
  ) {
    setVerifyMessage("Wallet authority is missing. Connect, sync, and sign first.");
    return;
  }

  try {
    setLoading(true);
    setVerifyMessage("");

    const destination = new PublicKey(progress.transaction.destination);
    const lamports = Math.round(progress.transaction.amountSol * LAMPORTS_PER_SOL);

    const balance = await connection.getBalance(publicKey, "confirmed");
    if (balance < lamports + 5000) {
      throw new Error("Insufficient SOL for transfer and network fee.");
    }

    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({
      feePayer: publicKey,
      recentBlockhash: blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: destination,
        lamports,
      })
    );

    const signature = await sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    patchProgress((prev) => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        initiated: true,
        submitted: true,
        signature,
        explorerUrl: buildExplorerTxUrl(signature),
        sourceWallet: publicKey.toBase58(),
        submittedAt: Date.now(),
        confirmationSource: "missing",
      },
      currentStage: "verify",
    }));

    setVerifyMessage("");
  } catch (error) {
    console.error("Gate 02 transfer failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Transfer failed or was cancelled. Please review the wallet prompt and try again.";

    setVerifyMessage(message);
  } finally {
    setLoading(false);
  }
}

      async function handleTransactionConfirmReal() {
  if (loading || !progress.transaction.submitted || !progress.transaction.signature) return;

  try {
    setLoading(true);
    setVerifyMessage("");

    const result = await connection.getSignatureStatuses([
      progress.transaction.signature,
    ]);

    const status = result?.value?.[0];
    const isConfirmed = Boolean(
      status &&
        (status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized")
    );

    if (!isConfirmed) {
      setVerifyMessage(
        "Transaction found, but confirmation is not final yet. Check again shortly."
      );
      return;
    }

    setVerifyMessage("");

    patchProgress((prev) => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        confirmed: true,
        confirmedAt: Date.now(),
        confirmationSource: "verified",
      },
      currentStage: "passed",
    }));
  } catch (error) {
    console.error("Gate 02 confirmation check failed:", error);
    setVerifyMessage("Confirmation check failed. Please try again.");
  } finally {
    setLoading(false);
  }
}

  function resetTransactionState() {
  setVerifyMessage("");

  patchProgress((prev) => ({
    ...prev,
    transaction: {
      initiated: false,
      submitted: false,
      signature: "",
      confirmed: false,
      explorerUrl: "",
      amountSol: MIN_TRANSFER_SOL,
      destination: MINT_AUTHORITY,
      sourceWallet: "",
      submittedAt: null,
      confirmedAt: null,
      confirmationSource: "missing",
    },
    currentStage: "transaction",
  }));
}

  const verificationRows: GatePoint[] = [
    { k: "Stripe Receipt Number", v: progress.package.stripeReceiptNumber || "Missing" },
    { k: "Stripe Customer Email", v: progress.package.stripeCustomerEmail || "Missing" },
    {
  k: "Stripe Payment State",
  v: creatorBypass
    ? "CREATOR BYPASS (verified)"
    : progress.package.paymentStatus === "paid"
    ? `PAID (${progress.package.paymentSource})`
    : progress.package.paymentStatus.toUpperCase(),
},
    {
  k: "Stripe Checkout Session ID",
  v: creatorBypass
    ? "CREATOR_BYPASS"
    : progress.package.stripeSessionId || "Missing",
},
    {
  k: "Creator Rights",
  v: creatorBypass ? "Granted" : "Standard User",
},
    {
  k: "Wallet Public Key",
  v: progress.wallet.address
    ? shortenAddress(progress.wallet.address, 6, 6)
    : "Missing",
},
    {
      k: "Message Signed Status",
      v: progress.wallet.messageSigned
        ? `SIGNED (${progress.wallet.signingSource})`
        : "Missing",
    },
    { k: "Transaction Signature", v: progress.transaction.signature || "Missing" },
    { k: "Explorer URL", v: progress.transaction.explorerUrl || "Missing" },
    {
      k: "Transaction Confirmed",
      v: progress.transaction.confirmed
        ? `CONFIRMED (${progress.transaction.confirmationSource})`
        : "Missing",
    },
    { k: "Mint Authority Wallet", v: shortenAddress(MINT_AUTHORITY, 6, 6) },
    { k: "Chosen Token Symbol", v: progress.profile.tokenSymbol || "Missing" },
    { k: "DEX Domain", v: progress.profile.dexDomain || "Missing" },
    {
      k: "Landing Button Logo",
      v: progress.profile.landingButtonLogo ? "Present" : "Missing",
    },
    { k: "Header Logo", v: progress.profile.headerLogo ? "Present" : "Missing" },
    { k: "Gate 1 Complete", v: observePassed || adminBypass ? "Yes" : "No" },
    { k: "Gate 2 Complete", v: developmentFlowComplete ? "Yes" : "No" },
    { k: "Gate 3 Complete", v: "Not yet" },
    { k: "Build Readiness", v: progress.completion.buildReady ? "Unlocked" : "Locked" },
  ];

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Gate 02 Enter"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          {shouldShowFullHero && (
  <section
    className={`jal-hero jal-world-hero ${showCompactHeader ? "jal-enter-hero--compact" : ""}`}
    aria-label="Enter gate hero"
  >
              <div className="jal-hero-top">
                <div className="jal-kicker">JAL/SOL • GATE 02</div>

                <div className="jal-status" aria-label="Gate 02 state">
                  <span className="jal-status-dot" />
                  <span className="jal-status-text">{accessLabel}</span>
                </div>
              </div>

              <div className="jal-hero-center jal-enter-hero-center">
  <h1 className="home-title jal-enter-gate-title">GATE 02</h1>

  <p className="jal-world-pretitle">Participation gate</p>

  <h2 className="jal-enter-statement">
    This is the point where observation ends.
    <br />
    You either act with intent,
    <br />
    or remain outside the system.
  </h2>

  <div className="jal-links jal-links-center">
    <button
  type="button"
  className="button gold"
  onClick={() => {
  if (loading || !canEnterGate2) return;

  setProfileError("");
  setShowProfileOverlay(true);

  patchProgress((prev) => ({
    ...prev,
    privateHomeSeen: true,
    currentStage: "profile",
  }));
}}
  disabled={loading}
>
  Enter
</button>
  </div>
</div>

              <div className="jal-arrival-note" aria-label="Enter principles">
  <span>CONTROLLED ENTRY</span>
  <span>PROFILE → PAYMENT → AUTHORITY → EXECUTION → VERIFICATION</span>
  <span>PARTICIPATION BEGINS WITH PROVEN MOVEMENT</span>
</div>
            </section>
          )}

          {canEnterGate2 && currentStage !== "home" && !showProfileOverlay && (
  <>
    <section className="jal-stage-bar" aria-label="Current Gate 02 stage">
      <div className="jal-stage-bar-left">
        <span>JAL/SOL • Gate 02</span>
        <strong>{currentStageLabel}</strong>
      </div>

      <div className="jal-stage-bar-right">
        <span className="jal-status-dot" />
        <span>{accessLabel}</span>
      </div>
    </section>

    <section className="jal-bay jal-bay-wide jal-sequence-progress-shell" aria-label="Gate 02 sequence">
  <div className="jal-bay-head jal-bay-head-center">
    <div className="jal-bay-title jal-center-text jal-sequence-progress-title">
      {JALSOL_SEQUENCE_TITLE}
    </div>
    <div className="jal-bay-note jal-center-text">
      Gate 02 • {currentStageIndex >= 0 ? `${currentStageIndex + 1} / ${GATE2_SEQUENCE.length}` : ""}
    </div>
  </div>

  <p className="jal-note jal-center-text jal-sequence-progress-copy">
    Movement through JALSOL is earned in order. Each gate and each stage confirms direction before the next opens.
  </p>

  <div className="jal-sequence-dot-row jal-sequence-dot-row-center" aria-label="Gate 02 step indicators">
    {ENTRY_RAIL.map((step, index) => {
      const completed = isStepCompleted(progress, step.id);
      const active = step.id === currentStage;

      return (
        <button
          key={step.id}
          type="button"
          className={`jal-sequence-dot ${
            active ? "is-current" : completed ? "is-complete" : "is-waiting"
          }`}
          onClick={() => goToStage(step.id)}
          disabled={
  loading ||
  (!progress.completion.enterPassed &&
    !canAccessStage(progress, step.id) &&
    step.id !== "profile")
}
          aria-label={`${index + 1}. ${step.title}`}
          aria-current={active ? "step" : undefined}
          title={`${String(index + 1).padStart(2, "0")} · ${step.title}`}
        />
      );
    })}
  </div>
</section>
  </>
)}

          {!canEnterGate2 && (
            <section className="jal-bay jal-bay-wide" aria-label="Gate blocked">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Gate 02 Locked</div>
                <div className="jal-bay-note">Observe required first</div>
              </div>

              <p className="jal-note">
                Gate 02 requires completion of Observe before controlled entry can begin.
                The system does not allow real participation to open before awareness has
                been established.
              </p>

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Requirement</div>
                  <div className="jal-bullet-v">Observe must be completed first.</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Reason</div>
                  <div className="jal-bullet-v">
                    Entry without understanding creates avoidable error and weakens system trust.
                  </div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Path</div>
                  <div className="jal-bullet-v">
                    Complete Observe, return here, then enter Gate 02.
                  </div>
                </article>
              </div>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol/observe")}
                  disabled={loading}
                >
                  Go To Observe
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/jal-sol")}
                  disabled={loading}
                >
                  Return To World Hub
                </button>
              </div>
            </section>
          )}

          {canEnterGate2 &&
  showProfileOverlay &&
  createPortal(
    <div
      className="jal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Gate 02 profile creation"
    >
      <div
        className="jal-overlay-backdrop"
        onClick={() => {
          setProfileError("");
          setShowProfileOverlay(false);
        }}
      />

      <section className="jal-overlay-panel jal-bay jal-bay-wide">
        <div className="jal-bay-head">
          <div className="jal-bay-title">Gate 02 Profile Creation</div>
          <div className="jal-bay-note">Participant shell required</div>
        </div>

        <p className="jal-note jal-center-text">
          Complete your participant shell to begin Gate 02 progression.
        </p>

        <div className="jal-grid">
          <section className="jal-bay">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Required To Begin</div>
              <div className="jal-bay-note">Active now</div>
            </div>

            <label className="jal-field">
              <span className="jal-field-label">Display name</span>
              <input
                className="jal-input"
                type="text"
                value={profileDraft.displayName}
                onChange={(e) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Your visible Gate 02 identity"
              />
            </label>

            <label className="jal-field">
              <span className="jal-field-label">Email</span>
              <input
                className="jal-input"
                type="email"
                value={profileDraft.email}
                onChange={(e) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="you@example.com"
              />
            </label>

            <label className="jal-field">
  <span className="jal-field-label">Project name (optional for Build prefill)</span>
  <input
    className="jal-input"
    type="text"
    value={profileDraft.projectName}
    onChange={(e) =>
      setProfileDraft((prev) => ({
        ...prev,
        projectName: e.target.value,
      }))
    }
    placeholder="Your project or currency identity"
  />
</label>

<label className="jal-field">
  <span className="jal-field-label">Token symbol (optional for Build prefill)</span>
  <input
    className="jal-input"
    type="text"
    value={profileDraft.tokenSymbol}
    onChange={(e) =>
      setProfileDraft((prev) => ({
        ...prev,
        tokenSymbol: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
      }))
    }
    placeholder="JAL"
  />
</label>

            <div className={`jal-note ${isCreatorDraft ? "jal-note-creator" : ""}`}>
              {isCreatorDraft ? (
                <>
                  Creator identity detected. This profile matches <strong>JAL</strong> /
                  <strong> 358jal@gmail.com</strong> and will bypass Stripe payment with
                  creator rights.
                </>
              ) : (
                <>
                  Standard participant profile. Use your own display name and the same
                  email used during Stripe purchase so payment can be matched correctly.
                </>
              )}
            </div>

            <label className="jal-check">
              <input
                type="checkbox"
                checked={profileDraft.acceptedTerms}
                onChange={(e) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    acceptedTerms: e.target.checked,
                  }))
                }
              />
              <span>
                I accept the Gate 02 terms and understand that this participant shell
                is tied to progression, payment, wallet authority, and verification.
              </span>
            </label>
          </section>

          <section className="jal-bay jal-emerging-panel">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Emerging Identity</div>
              <div className="jal-bay-note">Forms through progression</div>
            </div>

            <p className="jal-note">
              These parts of the package become real only after the required actions have
              been taken and confirmed.
            </p>
          </section>
        </div>

        {profileError ? <p className="jal-error-text">{profileError}</p> : null}

        <div className="jal-bay-actions jal-bay-actions-center">
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              setProfileError("");
              setShowProfileOverlay(false);
            }}
            disabled={loading}
          >
            Cancel
          </button>

          <button
  type="button"
  className="button gold"
  onClick={() => {
    handleProfileSave();

    const cleanDisplayName = profileDraft.displayName.trim();
    const cleanEmail = profileDraft.email.trim().toLowerCase();

    if (cleanDisplayName && cleanEmail && profileDraft.acceptedTerms) {
      setShowProfileOverlay(false);
    }
  }}
  disabled={loading}
>
  Save Participant Shell
</button>
        </div>
      </section>
    </div>,
    document.body
  )}

          {canEnterGate2 && currentStage === "payment" && (
  <section className="jal-bay jal-bay-wide" aria-label="Gate 02 payment">
    <div className="jal-bay-head">
      <div className="jal-bay-title">Gate 02 Entry Condition</div>
      <div className="jal-bay-note">Commitment required</div>
    </div>

    <p className="jal-note">
      Entry into Gate 02 is not granted by navigation. It is granted by
      commitment. This step confirms intent before authority is given.
    </p>

    <div className="jal-grid">
      <section className="jal-bay">
        <div className="jal-bay-head">
          <div className="jal-bay-title">Intent</div>
          <div className="jal-bay-note">Declaration</div>
        </div>

        <p className="jal-note">
          You are not purchasing access. You are committing to proceed through a
          controlled system of value creation.
        </p>

        <div className="jal-emerging-stack">
          <div className="jal-emerging-row">
            <div>
              <div className="jal-emerging-label">Outcome</div>
              <div className="jal-emerging-note">
                Access to Gate 02 environment and progression path.
              </div>
            </div>
            <span className="jal-emerging-chip">UNLOCK</span>
          </div>
      </section>

      <section className="jal-bay">
        <div className="jal-bay-head">
          <div className="jal-bay-title">Payment</div>
          <div className="jal-bay-note">External verification</div>
        </div>

        <p className="jal-note">
        Gate 02 entry is currently set at <strong>$5 AUD</strong> to open controlled participation at a lower threshold.
        </p>

        <p className="jal-note">
          {isCreatorProfile ? (
            <>
              Creator profile active. <strong>{CREATOR_DISPLAY_NAME}</strong>
              {" / "}
              <strong>{CREATOR_EMAIL}</strong> bypasses Stripe payment and can proceed
              directly through Gate 02 with creator rights.
            </>
          ) : (
            <>
              Use your own display name and the same email used during Stripe purchase
              so payment can be matched correctly to your participant shell.
            </>
          )}
        </p>

        <div className="jal-bay-actions">
          {isCreatorProfile ? (
            <button
              type="button"
              className="button gold"
              onClick={() => goToStage("module-1-wallet")}
              disabled={loading}
            >
              Continue As Creator
            </button>
          ) : (
            <button
  type="button"
  className="button gold"
  onClick={() => {
    setPaymentCommitChecked(false);
    setShowPaymentCeremony(true);
  }}
  disabled={loading}
>
  Proceed To Gate 02 — $5
</button>
          )}
        </div>
      </section>
    </div>

    <section className="jal-bay">
      <div className="jal-bay-head">
        <div className="jal-bay-title">Verification</div>
        <div className="jal-bay-note">Return + confirm</div>
      </div>

      <p className="jal-note">
        After completing payment, this page waits for the redirect signal before
        the next stage opens.
      </p>

      <div className="jal-bay-actions">
        <button type="button" className="button gold" disabled>
          {isCreatorProfile ? "Creator Bypass Active" : "Awaiting Payment Confirmation..."}
        </button>
      </div>
    </section>

    <div className="jal-bay-actions jal-bay-actions-spread">
      <button
        type="button"
        className="button ghost"
        onClick={() => goBackStage("profile")}
        disabled={loading}
      >
        Back To Profile
      </button>
    </div>
  </section>
)}

          {canEnterGate2 && activeModule && (
            <section className="jal-bay jal-bay-wide" aria-label={activeModule.title}>
              <div className="jal-bay-head">
                <div className="jal-bay-title">{activeModule.title}</div>
                <div className="jal-bay-note">{activeModule.note}</div>
              </div>

              <div className="jal-grid">
                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">What This Means</div>
                    <div className="jal-bay-note">Definition</div>
                  </div>

                  {activeModule.meaning.map((line, index) => (
                    <p key={index} className="jal-note">
                      {line}
                    </p>
                  ))}
                </section>

                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">What You Must Do</div>
                    <div className="jal-bay-note">Requirement</div>
                  </div>

                  {activeModule.requirement.map((line, index) => (
                    <p key={index} className="jal-note">
                      {line}
                    </p>
                  ))}
                </section>
              </div>

              <section className="jal-bay jal-bay-wide">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">What Can Go Wrong</div>
                  <div className="jal-bay-note">Risk</div>
                </div>

                {activeModule.risk.map((line, index) => (
                  <p key={index} className="jal-note">
                    {line}
                  </p>
                ))}
              </section>

              <div className="jal-bay-actions jal-bay-actions-center">
  <div className="jal-lock-text">
    Use the sequence controls below to move through the module path.
  </div>
</div>
            </section>
          )}

          {canEnterGate2 && currentStage === "test" && (
            <section className="jal-bay jal-bay-wide" aria-label="Comprehension test">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Comprehension Test</div>
                <div className="jal-bay-note">Pass required</div>
              </div>

              <p className="jal-note">
                This test confirms that the user understands what Gate 02 is preparing them
                to do. It is not optional. Comprehension must be proven before procedural
                readiness can open.
              </p>

              <p className="jal-lock-text">
                Pass requirement: at least 4 correct answers out of {TEST_QUESTIONS.length}.
              </p>

              <div className="jal-grid">
                {TEST_QUESTIONS.map((question, index) => {
                  const selected = progress.test.answers[question.id];
                  const submitted = progress.test.submitted;
                  const isCorrect = selected === question.correctIndex;

                  return (
                    <section key={question.id} className="jal-bay">
                      <div className="jal-bay-head">
                        <div className="jal-bay-title">Question {index + 1}</div>
                        <div className="jal-bay-note">Required</div>
                      </div>

                      <p className="jal-note">{question.prompt}</p>

                      <div className="jal-steps" role="radiogroup" aria-label={question.prompt}>
                        {question.options.map((option, optionIndex) => (
                          <label key={`${question.id}-${optionIndex}`} className="jal-check">
                            <input
                              type="radio"
                              name={question.id}
                              checked={selected === optionIndex}
                              onChange={() => updateTestAnswer(question.id, optionIndex)}
                              disabled={loading}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>

                      {submitted ? (
                        <p className="jal-note">
                          <strong>{isCorrect ? "Correct." : "Review required."}</strong>{" "}
                          {question.explanation}
                        </p>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              {progress.test.submitted && (
                <section className="jal-bay jal-bay-wide">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">
                      {progress.test.passed
                        ? "COMPREHENSION CONFIRMED"
                        : "COMPREHENSION NOT YET CONFIRMED"}
                    </div>
                    <div className="jal-bay-note">
                      Score: {progress.test.score} / {TEST_QUESTIONS.length}
                    </div>
                  </div>
                </section>
              )}

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("module-6-verification")}
                  disabled={loading}
                >
                  Return To Module 6
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={resetComprehensionTest}
                  disabled={loading}
                >
                  Reset Test
                </button>

                {!progress.test.passed ? (
                  <button
                    type="button"
                    className="button gold"
                    onClick={submitComprehensionTest}
                    disabled={loading || !allTestAnswered}
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button gold"
                    onClick={() => goToStage("trial-brief")}
                    disabled={loading}
                  >
                    Proceed To Trial Brief
                  </button>
                )}
              </div>
            </section>
          )}

          {canEnterGate2 && currentStage === "trial-brief" && (
            <section className="jal-bay jal-bay-wide" aria-label="Trial briefing">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Trial Briefing</div>
                <div className="jal-bay-note">Pressure simulation</div>
              </div>

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Minimum Score</div>
                  <div className="jal-bullet-v">20 per successful trial run</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Required Consistency</div>
                  <div className="jal-bullet-v">2 successful trial runs</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Failure Rule</div>
                  <div className="jal-bullet-v">Any failed trial run resets streak to 0</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Endless Unlock</div>
                  <div className="jal-bullet-v">Only after true trial completion</div>
                </article>
              </div>

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("test")}
                  disabled={loading}
                >
                  Return To Test
                </button>

                <button
  type="button"
  className="button gold"
  onClick={() => {
    if (loading) return;

    patchProgress((prev) => ({
      ...prev,
      trial: {
        ...prev.trial,
        unlocked: true,
        acknowledged: true,
        state: prev.trial.passed
          ? "passed"
          : prev.trial.successfulRuns === 1
          ? "one_pass"
          : "available",
      },
      currentStage: "trial",
    }));
  }}
  disabled={loading}
>
  Begin Trial
</button>
              </div>
            </section>
          )}

          {canEnterGate2 && currentStage === "trial" && (
            <section className="jal-bay jal-bay-wide" aria-label="Hard trial">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Gate 02 Token Fit Trial</div>
                <div className="jal-bay-note">Live trial active</div>
              </div>

              <p className="jal-note">
                This is the real Gate 02 pressure test. The user must complete two successful
                trial runs at 20 or higher. Any failed trial run resets the streak to zero.
              </p>

              <div className="jal-bullets jal-bullets-trial-stats">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">State</div>
                  <div className="jal-bullet-v">{progress.trial.state.replace("_", " ")}</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Trial Streak</div>
                  <div className="jal-bullet-v">{progress.trial.successfulRuns} / 2</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Trial High Score</div>
                  <div className="jal-bullet-v">{progress.trial.trialHighScore}</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Best Score</div>
                  <div className="jal-bullet-v">{progress.trial.bestScore}</div>
                </article>
              </div>

              <section className="jal-bay jal-bay-wide jal-trial-live-shell">
                <TokenFitGameV10
                  mode="trial"
                  minScore={20}
                  onRunComplete={handleTrialRunComplete}
                  onLeave={() => goBackStage("trial-brief")}
                />
              </section>

              <section className="jal-bay jal-bay-wide">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Trial Status</div>
                  <div className="jal-bay-note">Gate-owned interpretation</div>
                </div>

                <div className="jal-bullets">
                  <article
                    className={`jal-bullet ${
                      progress.trial.achievements.firstSuccessfulRun
                        ? "jal-cred-ok"
                        : "jal-cred-bad"
                    }`}
                  >
                    <div className="jal-bullet-k">First Successful Run</div>
                    <div className="jal-bullet-v">
                      {progress.trial.achievements.firstSuccessfulRun ? "Yes" : "No"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${
                      progress.trial.achievements.trialComplete
                        ? "jal-cred-ok"
                        : "jal-cred-bad"
                    }`}
                  >
                    <div className="jal-bullet-k">Trial Complete</div>
                    <div className="jal-bullet-v">
                      {progress.trial.achievements.trialComplete ? "Yes" : "No"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${
                      progress.trial.lastRunPassed ? "jal-cred-ok" : "jal-cred-bad"
                    }`}
                  >
                    <div className="jal-bullet-k">Last Run</div>
                    <div className="jal-bullet-v">
                      {progress.trial.lastRunMode
                        ? `${progress.trial.lastRunMode} • ${progress.trial.lastRunScore} ${
                            progress.trial.lastRunPassed ? "(pass)" : "(fail)"
                          }`
                        : "No run yet"}
                    </div>
                  </article>
                </div>
              </section>

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("trial-brief")}
                  disabled={loading}
                >
                  Return To Trial Brief
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={resetTrialProgress}
                  disabled={loading}
                >
                  Reset Trial
                </button>

                {progress.trial.passed ? (
                  <button
                    type="button"
                    className="button gold"
                    onClick={() => goToStage("wallet")}
                    disabled={loading}
                  >
                    Continue To Wallet
                  </button>
                ) : null}
              </div>
            </section>
          )}

          {canEnterGate2 && currentStage === "wallet" && (
            <section className="jal-bay jal-bay-wide" aria-label="Wallet authority">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Wallet Authority</div>
                <div className="jal-bay-note">Connection + message signing required</div>
              </div>

              <p className="jal-note">
  Wallet connection alone is not enough. Gate 02 requires a real wallet
  connection and a real signed message before the transaction phase opens.
  This stage proves authority before any on-chain movement is attempted.
</p>

              <div className="jal-bullets">
  <article className={`jal-bullet ${getStatusTone(Boolean(connected && publicKey))}`}>
    <div className="jal-bullet-k">Browser Wallet</div>
    <div className="jal-bullet-v">
      {connected && publicKey
        ? `Detected • ${shortenAddress(publicKey.toBase58(), 6, 6)}`
        : "No wallet detected"}
    </div>
  </article>

  <article className={`jal-bullet ${getStatusTone(progress.wallet.connected)}`}>
    <div className="jal-bullet-k">Wallet Connected</div>
    <div className="jal-bullet-v">
            {progress.wallet.connected
        ? `${shortenAddress(progress.wallet.address, 6, 6)} (${progress.wallet.connectionSource})`
        : "No"}
    </div>
  </article>

                <article
                  className={`jal-bullet ${getStatusTone(progress.wallet.messageSigned)}`}
                >
                  <div className="jal-bullet-k">Message Signed</div>
                  <div className="jal-bullet-v">
                    {progress.wallet.messageSigned
                      ? `${progress.wallet.signingSource}`
                      : "Not signed"}
                  </div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Next Stage</div>
                  <div className="jal-bullet-v">
                    {hasWalletAuthority ? "Transaction unlocked" : "Sign required"}
                  </div>
                </article>
              </div>

              {progress.wallet.signedMessageText ? (
                <section className="jal-bay jal-bay-wide">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Signed Message Preview</div>
                    <div className="jal-bay-note">Authority intent</div>
                  </div>

                  <pre className="jal-note" style={{ whiteSpace: "pre-wrap" }}>
                    {progress.wallet.signedMessageText}
                  </pre>
                </section>
              ) : null}

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("trial")}
                  disabled={loading}
                >
                  Return To Trial
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={resetWalletState}
                  disabled={loading}
                >
                  Reset Wallet
                </button>

                <div className="jal-wallet-connect-group">
  <div className="jal-wallet-connect-button">
    <WalletMultiButton />
  </div>

  <button
    type="button"
    className="button ghost"
    onClick={syncConnectedWallet}
    disabled={loading || !connected || !publicKey}
  >
    {connected && publicKey
      ? `Use ${shortenAddress(publicKey.toBase58(), 6, 6)}`
      : "Sync Connected Wallet"}
  </button>
</div>

<button
  type="button"
  className="button gold"
  onClick={handleWalletSignReal}
  disabled={loading || !progress.wallet.connected || progress.wallet.messageSigned || !signMessage}
>
  Sign Message
</button>
              </div>
            </section>
          )}

          {canEnterGate2 && currentStage === "transaction" && (
            <section className="jal-bay jal-bay-wide" aria-label="Transaction">
              <div className="jal-bay-head">
                <div className="jal-bay-title">First Controlled Transaction</div>
                <div className="jal-bay-note">Fixed minimal SOL transfer</div>
              </div>

              <p className="jal-note">
                This stage is shaped for the final on-chain transfer. It stores amount,
                source, destination, signature, explorer URL, and confirmation truth
                separately.
              </p>
              {verifyMessage ? <p className="jal-note">{verifyMessage}</p> : null}

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Source Wallet</div>
                  <div className="jal-bullet-v">
  {progress.transaction.sourceWallet
  ? shortenAddress(progress.transaction.sourceWallet, 6, 6)
  : progress.wallet.address
  ? shortenAddress(progress.wallet.address, 6, 6)
  : "Missing"}
</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Destination</div>
                  <div className="jal-bullet-v">{progress.transaction.destination}</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Amount</div>
                  <div className="jal-bullet-v">{progress.transaction.amountSol} SOL</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Signature</div>
                  <div className="jal-bullet-v">
                                        {progress.transaction.signature
                      ? shortenAddress(progress.transaction.signature, 8, 8)
                      : "Not submitted"}
                  </div>
                </article>
              </div>

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("wallet")}
                  disabled={loading}
                >
                  Return To Wallet
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={resetTransactionState}
                  disabled={loading}
                >
                  Reset Transaction
                </button>

                <button
  type="button"
  className="button gold"
  onClick={handleTransactionStartReal}
  disabled={loading || progress.transaction.submitted || !progress.wallet.messageSigned}
>
  Submit Transfer
</button>
              </div>
            </section>
          )}

          {canEnterGate2 && currentStage === "verify" && (
            <section className="jal-bay jal-bay-wide" aria-label="Verification">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Verification Board</div>
                <div className="jal-bay-note">Proof package</div>
              </div>

              <p className="jal-note">
  Gate 02 does not complete on claim. It completes on visible proof.
  Payment truth, wallet authority, transaction proof, and confirmation truth
  are separated here so participant state is granted only from verified movement.
</p>

              <p className="jal-note">
  This stage is shaped for the final on-chain transfer. It stores amount,
  source, destination, signature, explorer URL, and confirmation truth
  separately.
</p>

{verifyMessage ? <p className="jal-note">{verifyMessage}</p> : null}

<div className="jal-bullets">
  {verificationRows.map((row) => (
                  <article
                    key={row.k}
                    className={`jal-bullet ${getStatusTone(
                      row.v !== "Missing" && row.v !== "No" && row.v !== "Not yet"
                    )}`}
                  >
                    <div className="jal-bullet-k">{row.k}</div>
                    <div className="jal-bullet-v">
                      {row.k === "Explorer URL" && progress.transaction.explorerUrl ? (
                        <a
                          href={progress.transaction.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="jal-inline-link"
                        >
                          View On Solana Explorer
                        </a>
                      ) : (
                        row.v
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("transaction")}
                  disabled={loading}
                >
                  Return To Transaction
                </button>

                <button
  type="button"
  className="button gold"
  onClick={handleTransactionConfirmReal}
  disabled={
    loading ||
    !progress.transaction.submitted ||
    progress.transaction.confirmed
  }
>
  Check Confirmation
</button>
              </div>
            </section>
          )}
          
          {canEnterGate2 && currentStage !== "home" && currentStage !== "passed" && (
  <section className="jal-bay jal-bay-wide" aria-label="Gate 02 controls">
    <div className="jal-bay-actions jal-bay-actions-center jal-sequence-controls">
      <button
        type="button"
        className="button ghost"
        onClick={() => goBackStage("home")}
        disabled={loading}
        aria-label="Return to Gate 02 home"
      >
        {"<<"}
      </button>

      <button
        type="button"
        className="button ghost"
        onClick={() => previousStageId && goBackStage(previousStageId)}
        disabled={loading || !previousStageId}
        aria-label="Previous stage"
      >
        {"<"}
      </button>

      <span
        className={`jal-sequence-indicator-dot ${
          isStepCompleted(progress, currentStage) ? "is-complete" : "is-active"
        }`}
        aria-label={
          isStepCompleted(progress, currentStage)
            ? "Current stage complete"
            : "Current stage in progress"
        }
      />

      <button
  type="button"
  className="button ghost"
  onClick={() => {
    if (!nextStageId) return;

    if (activeModule) {
      handleModuleContinue(activeModule);
      return;
    }

    goToStage(nextStageId);
  }}
  disabled={
    loading ||
    !nextStageId ||
    (!activeModule && !canAccessStage(progress, nextStageId))
  }
  aria-label="Next stage"
>
  {">"}
</button>
    </div>
  </section>
)}
        
          {canEnterGate2 && currentStage === "passed" && (
            <section className="jal-bay jal-bay-wide" aria-label="Passed state">
              <div className="jal-bay-head">
                <div className="jal-bay-title">
                  {participantState
                    ? "Participant State Achieved"
                    : "Development Flow Complete"}
                </div>
                <div className="jal-bay-note">
                  {participantState
                    ? "True verified proof achieved"
                    : "Verification remains incomplete"}
                </div>
              </div>

              <p className="jal-note">
  {participantState
    ? `Gate 02 is complete with ${
        creatorBypass ? "creator bypass payment truth" : "verified payment truth"
      }, verified wallet authority, and verified transaction confirmation.${
        isCreatorProfile ? " Creator rights are active." : ""
      }`
    : "Gate 02 sequence completion is recorded, but participant state is not yet granted until every required proof source remains verified and present."}
</p>

              <div className="jal-bullets">
  <article className="jal-bullet">
    <div className="jal-bullet-k">Enter Passed</div>
    <div className="jal-bullet-v">
      {progress.completion.enterPassed ? "Yes" : "No"}
    </div>
  </article>

  <article className="jal-bullet">
    <div className="jal-bullet-k">Participant State</div>
    <div className="jal-bullet-v">
      {progress.completion.participantState ? "Yes" : "Not yet"}
    </div>
  </article>

  <article className="jal-bullet">
    <div className="jal-bullet-k">Build Readiness</div>
    <div className="jal-bullet-v">
      {progress.completion.buildReady ? "Unlocked" : "Locked"}
    </div>
  </article>

  <article className="jal-bullet">
    <div className="jal-bullet-k">Completed At</div>
    <div className="jal-bullet-v">
      {progress.completion.completedAt
        ? new Date(progress.completion.completedAt).toLocaleString()
        : "Unknown"}
    </div>
  </article>
</div>

<section className="jal-bay jal-bay-wide">
  <div className="jal-bay-head">
    <div className="jal-bay-title">Gate 03 Handover Profile</div>
    <div className="jal-bay-note">Participant account state</div>
  </div>

  <div className="jal-bullets">
    <article className="jal-bullet">
      <div className="jal-bullet-k">Signed In As</div>
      <div className="jal-bullet-v">
        {progress.profile.displayName || "Missing"} • {progress.profile.email || "Missing"}
      </div>
    </article>

    <article className={`jal-bullet ${getStatusTone(progress.wallet.connected)}`}>
      <div className="jal-bullet-k">Connected Wallet</div>
      <div className="jal-bullet-v">
  {progress.wallet.address
    ? shortenAddress(progress.wallet.address, 6, 6)
    : "Missing"}
</div>
    </article>

    <article className={`jal-bullet ${getStatusTone(progress.wallet.messageSigned)}`}>
      <div className="jal-bullet-k">Authority Signature</div>
      <div className="jal-bullet-v">
        {progress.wallet.messageSigned ? "Ready" : "Missing"}
      </div>
    </article>

    <article className={`jal-bullet ${getStatusTone(progress.transaction.confirmed)}`}>
  <div className="jal-bullet-k">Explorer Proof</div>
  <div className="jal-bullet-v">
    {progress.transaction.explorerUrl ? "Available" : "Missing"}
  </div>
</article>

    <article className="jal-bullet">
      <div className="jal-bullet-k">Gate 03 Unlock</div>
      <div className="jal-bullet-v">
        {progress.completion.buildReady ? "Ready" : "Locked"}
      </div>
    </article>

    <article className="jal-bullet">
      <div className="jal-bullet-k">What Comes Next</div>
      <div className="jal-bullet-v">
        Token mint • ATA • supply • metadata • vault identity
      </div>
    </article>
  </div>

  <p className="jal-note">
    Gate 02 is complete. Previous Gate 02 stages remain reviewable, and this
    participant profile is handed forward into Build.
  </p>
</section>

<section className="jal-bay jal-bay-wide">
  <div className="jal-bay-head">
    <div className="jal-bay-title">Review Access</div>
    <div className="jal-bay-note">Gate 02 remains visible</div>
  </div>

  <p className="jal-note">
    Completion does not close Gate 02. Previous stages remain available through
    the sequence rail, and you can review wallet authority and proof at any time.
  </p>

  <div className="jal-bay-actions jal-bay-actions-center">
    <button
      type="button"
      className="button ghost"
      onClick={() => goToStage("wallet")}
      disabled={loading}
    >
      Review Wallet + Proof Path
    </button>
  </div>
</section>

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
  type="button"
  className="button gold"
  onClick={() => {
    writeGate3ProfileHandover(progress);
    beginRoute("/app/jal-sol/build");
  }}
  disabled={loading || !progress.completion.buildReady}
>
  Proceed To Build
</button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/jal-sol")}
                  disabled={loading}
                >
                  Return To World Hub
                </button>
              </div>
            </section>
          )}
        </section>
      </div>

      {showPaymentCeremony &&
  createPortal(
    <div
      className="jal-overlay jal-payment-ceremony-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Gate 02 commitment"
    >
      <div
        className="jal-overlay-backdrop"
        onClick={() => {
          setShowPaymentCeremony(false);
          setPaymentCommitChecked(false);
        }}
      />

      <section className="jal-overlay-panel jal-bay jal-bay-wide jal-payment-ceremony-panel">
        <div className="jal-payment-ceremony-glow" />

        <div className="jal-bay-head">
          <div className="jal-bay-title">Gate 02 — Commitment</div>
          <div className="jal-bay-note">Observer becomes participant</div>
        </div>

        <div className="jal-payment-ceremony-center">
          <p className="jal-payment-ceremony-kicker">This is not a purchase.</p>

          <h2 className="jal-payment-ceremony-title">
            This is the threshold
            <br />
            where observation ends.
          </h2>

          <p className="jal-payment-ceremony-copy">
            You are about to enter a controlled participation layer.
            Gate 02 requires real movement, real authority, and real proof.
          </p>
        </div>

        <div className="jal-payment-ceremony-grid">
          <article className="jal-payment-ceremony-card">
            <div className="jal-payment-ceremony-card-k">You will use</div>
            <div className="jal-payment-ceremony-card-v">A real wallet</div>
          </article>

          <article className="jal-payment-ceremony-card">
            <div className="jal-payment-ceremony-card-k">You will prove</div>
            <div className="jal-payment-ceremony-card-v">Real authority</div>
          </article>

          <article className="jal-payment-ceremony-card">
            <div className="jal-payment-ceremony-card-k">You will execute</div>
            <div className="jal-payment-ceremony-card-v">A real transaction</div>
          </article>

          <article className="jal-payment-ceremony-card">
            <div className="jal-payment-ceremony-card-k">You will unlock</div>
            <div className="jal-payment-ceremony-card-v">Participant state</div>
          </article>
        </div>

        <div className="jal-payment-ceremony-statement">
          No simulation. No shortcuts. No false proof.
        </div>

        <label className="jal-check jal-payment-ceremony-check">
          <input
            type="checkbox"
            checked={paymentCommitChecked}
            onChange={(e) => setPaymentCommitChecked(e.target.checked)}
          />
          <span>
            I understand Gate 02 requires real on-chain action and verified movement.
          </span>
        </label>

        <div className="jal-bay-actions jal-bay-actions-center">
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              setShowPaymentCeremony(false);
              setPaymentCommitChecked(false);
            }}
            disabled={loading}
          >
            Return
          </button>

          <button
  type="button"
  className={`button gold ${paymentCommitChecked ? "" : "is-disabled"}`}
  disabled={!paymentCommitChecked}
  onClick={() => {
    setShowPaymentCeremony(false);
    window.location.href = GATE2_PAYMENT_LINK;
  }}
>
  Enter Gate 02 — $5
</button>
        </div>
      </section>
    </div>,
    document.body
  )}

      {loading && (
        <div
          className="loading-screen"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}
