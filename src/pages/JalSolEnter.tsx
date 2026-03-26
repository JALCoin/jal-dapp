import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TokenFitGameV10 from "../components/TokenFitGamev1.0";

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

const MINT_AUTHORITY = "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2";
const MIN_TRANSFER_SOL = 0.001;
const GATE2_PAYMENT_LINK = "https://buy.stripe.com/eVq3cu9xmesz6Kr7ww0x20a";

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

const PRIVATE_RULES: string[] = [
  "Complete every stage in order.",
  "No wallet connection before the trial phase.",
  "No transaction before wallet connection and message signing.",
  "No completion without visible proof.",
  "Mocked development actions do not count as true participant state.",
];

const PRIVATE_OUTCOMES: GatePoint[] = [
  {
    k: "Profile Shell",
    v: "A persistent Gate 02 package identity is created before deeper progression.",
  },
  {
    k: "Payment Truth",
    v: "Gate access packaging is tied to a recorded payment state rather than a vague return URL.",
  },
  {
    k: "Wallet Authority",
    v: "Connection alone is not enough. A signed message must prove control before execution.",
  },
  {
    k: "Build Readiness",
    v: "Build only opens from completed Gate 02 sequencing and visible proof conditions.",
  },
];

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

function createMockWalletAddress() {
  return "9vKfWc7fZ3aWfXyQe7vY6xK3v4Pm8rL2nT5hQ9JAL02";
}

function createMockSignature() {
  return `GATE2-${Date.now().toString(36).toUpperCase()}-SIG`;
}

function createMockExplorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`;
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

function getHasWalletAuthority(progress: Gate2ProgressState) {
  return progress.wallet.connected && progress.wallet.messageSigned;
}

function getDevelopmentFlowComplete(progress: Gate2ProgressState) {
  return Boolean(
    progress.profile.created &&
      progress.profile.acceptedTerms &&
      getPaymentComplete(progress) &&
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
  return Boolean(
    getDevelopmentFlowComplete(progress) &&
      progress.package.paymentSource === "verified" &&
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
      return getPaymentComplete(progress);
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
      return getPaymentComplete(progress);
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

export default function JalSolEnter() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [observePassed, setObservePassed] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const [progress, setProgress] =
    useState<Gate2ProgressState>(DEFAULT_GATE2_PROGRESS);

  const [profileDraft, setProfileDraft] = useState(DEFAULT_GATE2_PROGRESS.profile);
  const [profileError, setProfileError] = useState("");

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
          buildReady: complete,
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
    setProfileDraft(saved.profile);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");

    if (paid !== "true") return;
    if (!progress.profile.created) return;
    if (progress.package.paymentStatus === "paid" && progress.package.paymentSource === "verified") {
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    patchProgress((prev) => ({
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
    }));

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [
    progress.profile.created,
    progress.package.paymentStatus,
    progress.package.paymentSource,
  ]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

  const canEnterGate2 = adminBypass || observePassed;
  const currentStage = progress.currentStage;
  const activeModule = currentStage.startsWith("module-")
    ? MODULE_CONTENT.find((module) => module.stage === currentStage) ?? null
    : null;

  const currentStageLabel =
    ENTRY_RAIL.find((step) => step.id === currentStage)?.title || currentStage;

  const shouldShowFullHero = currentStage === "home" || !canEnterGate2;

  const allTestAnswered = useMemo(
    () =>
      TEST_QUESTIONS.every(
        (question) => typeof progress.test.answers[question.id] === "number"
      ),
    [progress.test.answers]
  );

  const paymentComplete = getPaymentComplete(progress);
  const hasWalletAuthority = getHasWalletAuthority(progress);
  const developmentFlowComplete = getDevelopmentFlowComplete(progress);
  const participantState = getTrueParticipantState(progress);

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
    patchProgress((prev) => {
      if (!canAccessStage(prev, stage) && stage !== "home" && stage !== "profile") {
        return prev;
      }

      return {
        ...prev,
        currentStage: stage,
      };
    });
  }

  function goBackStage(stage: Gate2Stage) {
    patchProgress((prev) => ({
      ...prev,
      currentStage: stage,
    }));
  }

  function getPreviousModuleStage(
    stage: ModuleContent["stage"]
  ): ModuleContent["stage"] | null {
    const index = MODULE_CONTENT.findIndex((module) => module.stage === stage);
    if (index <= 0) return null;
    return MODULE_CONTENT[index - 1].stage;
  }

  function handleBeginSequence() {
    if (loading || !canEnterGate2) return;

    patchProgress((prev) => {
      const hasStarted =
        prev.profile.created ||
        prev.package.checkoutStarted ||
        prev.modulesCompleted.length > 0 ||
        prev.test.submitted ||
        prev.trial.acknowledged ||
        prev.wallet.connected ||
        prev.transaction.initiated;

      const nextStage =
        hasStarted &&
        prev.currentStage !== "home" &&
        canAccessStage(prev, prev.currentStage)
          ? prev.currentStage
          : "profile";

      return {
        ...prev,
        privateHomeSeen: true,
        currentStage: nextStage,
      };
    });
  }

  function handleProfileSave() {
    if (loading) return;

    const cleanDisplayName = profileDraft.displayName.trim();
    const cleanEmail = profileDraft.email.trim();

    if (!cleanDisplayName || !cleanEmail || !profileDraft.acceptedTerms) {
      setProfileError("Display name, email, and terms acceptance are required.");
      return;
    }

    patchProgress((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        created: true,
        displayName: cleanDisplayName,
        email: cleanEmail,
        acceptedTerms: true,
        createdAt: prev.profile.createdAt ?? Date.now(),
      },
      currentStage: "payment",
    }));

    setProfileDraft((prev) => ({
      ...prev,
      created: true,
      displayName: cleanDisplayName,
      email: cleanEmail,
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

  function setTrialAcknowledged(value: boolean) {
    patchProgress((prev) => ({
      ...prev,
      trial: {
        ...prev.trial,
        state: value ? "available" : "locked",
        unlocked: value,
        acknowledged: value,
      },
    }));
  }

  function beginTrial() {
    if (loading || !progress.trial.acknowledged) return;

    patchProgress((prev) => ({
      ...prev,
      trial: {
        ...prev.trial,
        state: prev.trial.passed
          ? "passed"
          : prev.trial.successfulRuns === 1
          ? "one_pass"
          : "in_run",
      },
      currentStage: "trial",
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

  function simulateWalletConnect() {
    if (loading || !progress.trial.passed) return;

    patchProgress((prev) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        connected: true,
        address: createMockWalletAddress(),
        connectionSource: "dev",
      },
    }));
  }

  function simulateWalletSign() {
    if (loading || !progress.wallet.connected) return;

    patchProgress((prev) => {
      const message = buildSigningMessage(prev.profile.displayName);

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          messageSigned: true,
          signedMessageText: message,
          signedMessageSignature: createMockSignature(),
          signingSource: "dev",
        },
        currentStage: "transaction",
      };
    });
  }

  function resetWalletState() {
    patchProgress((prev) => ({
      ...prev,
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
      currentStage: "wallet",
    }));
  }

  function simulateTransactionStart() {
    if (loading || !hasWalletAuthority) return;

    const signature = createMockSignature();

    patchProgress((prev) => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        initiated: true,
        submitted: true,
        signature,
        explorerUrl: createMockExplorerUrl(signature),
        sourceWallet: prev.wallet.address,
        submittedAt: Date.now(),
      },
      currentStage: "verify",
    }));
  }

  function simulateTransactionConfirm() {
    if (loading || !progress.transaction.submitted) return;

    patchProgress((prev) => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        confirmed: true,
        confirmedAt: Date.now(),
        confirmationSource: "dev",
      },
      currentStage: "passed",
    }));
  }

  function resetTransactionState() {
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
      v:
        progress.package.paymentStatus === "paid"
          ? `PAID (${progress.package.paymentSource})`
          : progress.package.paymentStatus.toUpperCase(),
    },
    { k: "Stripe Checkout Session ID", v: progress.package.stripeSessionId || "Missing" },
    { k: "Wallet Public Key", v: progress.wallet.address || "Missing" },
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
    { k: "Mint Authority Wallet", v: MINT_AUTHORITY },
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
            <section className="jal-hero jal-world-hero" aria-label="Enter gate hero">
              <div className="jal-hero-top">
                <div className="jal-kicker">JAL/SOL • GATE 02</div>

                <div className="jal-status" aria-label="Gate 02 state">
                  <span className="jal-status-dot" />
                  <span className="jal-status-text">{accessLabel}</span>
                </div>
              </div>

              <div className="jal-hero-center">
                <p className="jal-world-pretitle">Participation gate</p>

                <h1 className="home-title">
                  You are now
                  <br />
                  entering movement.
                </h1>

                <p className="home-lead">
                  Gate 02 is the threshold where understanding must become correct action.
                  This is the first irreversible layer in JAL/SOL. The user stops observing
                  from a safe distance and begins preparing for real participation.
                </p>

                <p className="jal-sublead">
                  This gate is about sequence, payment truth, identity packaging, authority
                  proof, and visible verification. Mocked development movement may help
                  scaffold the route, but it is not the same as true participant state.
                </p>
              </div>

              <div className="jal-arrival-note" aria-label="Enter principles">
                <span>CONTROLLED ENTRY</span>
                <span>PROFILE → PAYMENT → AUTHORITY → EXECUTION → VERIFICATION</span>
                <span>PARTICIPATION BEGINS WITH PROVEN MOVEMENT</span>
              </div>

              <div className="jal-links">
                {!canEnterGate2 ? (
                  <button
                    type="button"
                    className="button gold"
                    onClick={() => beginRoute("/app/jal-sol/observe")}
                    disabled={loading}
                  >
                    Go To Observe
                  </button>
                ) : currentStage === "home" ? (
                  <button
                    type="button"
                    className="button gold"
                    onClick={handleBeginSequence}
                    disabled={loading}
                  >
                    Enter Gate 02
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button gold"
                    onClick={() => goBackStage("home")}
                    disabled={loading}
                  >
                    Return To Gate 02 Home
                  </button>
                )}

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/jal-sol/observe")}
                  disabled={loading}
                >
                  Return To Observe
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

          {canEnterGate2 && currentStage !== "home" && (
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

              <section className="jal-progress-rail" aria-label="Gate 02 progression rail">
                {ENTRY_RAIL.map((step) => {
                  const completed = isStepCompleted(progress, step.id);
                  const active = step.id === currentStage;

                  return (
                    <div
                      key={step.id}
                      className={`jal-progress-node ${
                        active ? "active" : completed ? "done" : "locked"
                      }`}
                      aria-current={active ? "step" : undefined}
                    >
                      <span>{step.title}</span>
                    </div>
                  );
                })}
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

          {canEnterGate2 && currentStage === "home" && (
            <>
              <section className="jal-bay jal-bay-wide" aria-label="Private Gate 02 home">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Gate 02 Private Workspace</div>
                  <div className="jal-bay-note">
                    {adminBypass ? "Private bypass active" : "Controlled progression environment"}
                  </div>
                </div>

                <p className="jal-note">
                  Gate 02 access is active. This is the internal progression environment.
                  The user is no longer being sold the gate. They are being processed through it.
                </p>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Identity</div>
                    <div className="jal-bullet-v">
                      {progress.profile.displayName || "Profile not created yet"}
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Package</div>
                    <div className="jal-bullet-v">
                      {paymentComplete
                        ? `Payment recorded (${progress.package.paymentSource})`
                        : "Payment not yet completed"}
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Stage</div>
                    <div className="jal-bullet-v">Home</div>
                  </article>
                </div>
              </section>

              <section className="jal-grid" aria-label="Private rules and outcomes">
                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Rules And Requirements</div>
                    <div className="jal-bay-note">Strict path enforcement</div>
                  </div>

                  <div className="jal-steps">
                    {PRIVATE_RULES.map((rule, index) => (
                      <div key={`${rule}-${index}`}>
                        <strong>{index + 1}.</strong>
                        <span className="jal-step-sub">{rule}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">What Unlocks After Pass</div>
                    <div className="jal-bay-note">Outcome integrity</div>
                  </div>

                  <div className="jal-bullets">
                    {PRIVATE_OUTCOMES.map((point) => (
                      <article key={point.k} className="jal-bullet">
                        <div className="jal-bullet-k">{point.k}</div>
                        <div className="jal-bullet-v">{point.v}</div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <section className="jal-bay jal-bay-wide" aria-label="Credential board preview">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Gate 02 Credential Board</div>
                  <div className="jal-bay-note">Live package dashboard</div>
                </div>

                <div className="jal-bullets">
                  <article className={`jal-bullet ${getStatusTone(progress.profile.created)}`}>
                    <div className="jal-bullet-k">Profile</div>
                    <div className="jal-bullet-v">
                      {progress.profile.created ? "Complete" : "Missing"}
                    </div>
                  </article>

                  <article className={`jal-bullet ${getStatusTone(paymentComplete)}`}>
                    <div className="jal-bullet-k">Payment</div>
                    <div className="jal-bullet-v">
                      {paymentComplete ? `Paid (${progress.package.paymentSource})` : "Missing"}
                    </div>
                  </article>

                  <article className={`jal-bullet ${getStatusTone(progress.trial.passed)}`}>
                    <div className="jal-bullet-k">Trial</div>
                    <div className="jal-bullet-v">
                      {progress.trial.passed ? "Passed" : "Pending"}
                    </div>
                  </article>

                  <article className={`jal-bullet ${getStatusTone(hasWalletAuthority)}`}>
                    <div className="jal-bullet-k">Wallet Authority</div>
                    <div className="jal-bullet-v">
                      {hasWalletAuthority ? "Connected + Signed" : "Pending"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${getStatusTone(progress.transaction.confirmed)}`}
                  >
                    <div className="jal-bullet-k">Transaction Proof</div>
                    <div className="jal-bullet-v">
                      {progress.transaction.confirmed ? "Confirmed" : "Pending"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${getStatusTone(progress.completion.buildReady)}`}
                  >
                    <div className="jal-bullet-k">Build Readiness</div>
                    <div className="jal-bullet-v">
                      {progress.completion.buildReady ? "Unlocked" : "Locked"}
                    </div>
                  </article>
                </div>

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className="button gold"
                    onClick={handleBeginSequence}
                    disabled={loading}
                  >
                    Begin Sequence
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
            </>
          )}

          {canEnterGate2 && currentStage === "profile" && (
            <section className="jal-bay jal-bay-wide" aria-label="Gate 02 profile creation">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Gate 02 Profile Creation</div>
                <div className="jal-bay-note">Participant shell required</div>
              </div>

              <p className="jal-note">
                This stage creates the participant shell for Gate 02. Only the identity
                required to begin is recorded now. The rest of the package forms
                progressively through verified movement across Gate 02 and into Build.
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
                    These parts of the package are not missing. They are future identity
                    points that become real only after the required actions have been taken
                    and confirmed.
                  </p>

                  <div className="jal-emerging-stack">
                    <article className="jal-emerging-row">
                      <div>
                        <div className="jal-emerging-label">Proof of Payment</div>
                        <div className="jal-emerging-note">
                          Captured in the next stage before deeper access opens.
                        </div>
                      </div>
                      <span className="jal-emerging-chip">NEXT</span>
                    </article>

                    <article className="jal-emerging-row">
                      <div>
                        <div className="jal-emerging-label">Project Name</div>
                        <div className="jal-emerging-note">
                          Held pending until Build begins to define the asset properly.
                        </div>
                      </div>
                      <span className="jal-emerging-chip">PENDING</span>
                    </article>

                    <article className="jal-emerging-row">
                      <div>
                        <div className="jal-emerging-label">Token Symbol</div>
                        <div className="jal-emerging-note">
                          Becomes valid only when token creation has actually occurred.
                        </div>
                      </div>
                      <span className="jal-emerging-chip">PENDING</span>
                    </article>

                    <article className="jal-emerging-row">
                      <div>
                        <div className="jal-emerging-label">DEX Domain</div>
                        <div className="jal-emerging-note">
                          Opens later once deployment structure and route identity exist.
                        </div>
                      </div>
                      <span className="jal-emerging-chip">PENDING</span>
                    </article>

                    <article className="jal-emerging-row">
                      <div>
                        <div className="jal-emerging-label">Brand Assets</div>
                        <div className="jal-emerging-note">
                          Header and button identity are completed after the package matures.
                        </div>
                      </div>
                      <span className="jal-emerging-chip">PENDING</span>
                    </article>
                  </div>
                </section>
              </div>

              {profileError ? <p className="jal-error-text">{profileError}</p> : null}

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goBackStage("home")}
                  disabled={loading}
                >
                  Return To Home
                </button>

                <button
                  type="button"
                  className="button gold"
                  onClick={handleProfileSave}
                  disabled={loading}
                >
                  Save Participant Shell
                </button>
              </div>
            </section>
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

                    <div className="jal-emerging-row">
                      <div>
                        <div className="jal-emerging-label">Requirement</div>
                        <div className="jal-emerging-note">
                          Verified payment tied to your participant shell.
                        </div>
                      </div>
                      <span className="jal-emerging-chip">REQUIRED</span>
                    </div>
                  </div>
                </section>

                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Payment</div>
                    <div className="jal-bay-note">External verification</div>
                  </div>

                  <p className="jal-note">
                    Complete the payment externally. Return here to confirm and unlock the
                    next stage.
                  </p>

                  <div className="jal-bay-actions">
                    <a
                      href={GATE2_PAYMENT_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button gold"
                    >
                      Open Gate 02
                    </a>
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
                    Awaiting Payment Confirmation...
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

              <div className="jal-bay-actions jal-bay-actions-spread">
                {getPreviousModuleStage(activeModule.stage) ? (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => goBackStage(getPreviousModuleStage(activeModule.stage)!)}
                    disabled={loading}
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => goBackStage("payment")}
                    disabled={loading}
                  >
                    Back
                  </button>
                )}

                <button
                  type="button"
                  className="button gold"
                  onClick={() => handleModuleContinue(activeModule)}
                  disabled={loading}
                >
                  Continue To Next Module
                </button>
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
                    setTrialAcknowledged(true);
                    beginTrial();
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
                Wallet connection alone is not enough. Gate 02 requires message signing
                before the transaction phase opens. Final implementation should replace the
                DEV actions below with real Solana wallet adapter integration.
              </p>

              <div className="jal-bullets">
                <article className={`jal-bullet ${getStatusTone(progress.wallet.connected)}`}>
                  <div className="jal-bullet-k">Wallet Connected</div>
                  <div className="jal-bullet-v">
                    {progress.wallet.connected
                      ? `${progress.wallet.address} (${progress.wallet.connectionSource})`
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

                <button
                  type="button"
                  className="button ghost"
                  onClick={simulateWalletConnect}
                  disabled={loading || progress.wallet.connected}
                >
                  Connect Wallet (DEV)
                </button>

                <button
                  type="button"
                  className="button gold"
                  onClick={simulateWalletSign}
                  disabled={loading || !progress.wallet.connected || progress.wallet.messageSigned}
                >
                  Sign Message (DEV)
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

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Source Wallet</div>
                  <div className="jal-bullet-v">{progress.wallet.address || "Missing"}</div>
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
                    {progress.transaction.signature || "Not submitted"}
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
                  onClick={simulateTransactionStart}
                  disabled={loading || progress.transaction.submitted}
                >
                  Submit Transfer (DEV)
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
                Development truth and verified truth are separated here so mock scaffolding
                cannot pretend to be final participant state.
              </p>

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
                  onClick={simulateTransactionConfirm}
                  disabled={
                    loading ||
                    !progress.transaction.submitted ||
                    progress.transaction.confirmed
                  }
                >
                  Confirm Proof (DEV)
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
                    : "Mock scaffolding does not equal true participant state"}
                </div>
              </div>

              <p className="jal-note">
                {participantState
                  ? "Gate 02 is complete with verified payment truth, verified wallet authority, and verified transaction confirmation."
                  : "Gate 02 development sequencing is complete, but the current proof sources remain marked as development truth. Final integration is still required before this becomes true participant state."}
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

              <div className="jal-bay-actions jal-bay-actions-spread">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol/build")}
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