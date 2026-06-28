const JAL_MINT_ADDRESS = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";
const LIQUIDITY_SUPPORT_WALLET = "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2";
const RESERVE_TOKEN_ACCOUNT = "3WfECZgu1tAeaHV3DooaPnR6jdTPzDGaoaP8TBMhmFVV";
const RAYDIUM_POOL_ADDRESS = "7tKoCSDR2CiQM83bxpSZxJ3f3mrngAsFiSvuafPfPGZK";
const LP_MINT_ADDRESS = "GpTEapMhViu6dd8tXvoSPcab8EXUEZtNMdYM1ay7XAgk";

export type JalCoinVerificationItem = {
  id: string;
  label: string;
  technicalLabel: string;
  value: string;
  note: string;
  href: string;
  hrefLabel: string;
  copyable: boolean;
  tone: "green" | "gold" | "cyan";
};

export type JalCoinPracticeStep = {
  id: string;
  title: string;
  body: string;
};

export type JalSignalLogItem = {
  id: string;
  title: string;
  status: "Live" | "Planned";
  summary: string;
};

const solscanMintUrl = `https://solscan.io/token/${JAL_MINT_ADDRESS}`;
const solscanAuthorityUrl = `https://solscan.io/account/${LIQUIDITY_SUPPORT_WALLET}`;
const solscanReserveUrl = `https://solscan.io/account/${RESERVE_TOKEN_ACCOUNT}`;
const solscanPoolUrl = `https://solscan.io/account/${RAYDIUM_POOL_ADDRESS}`;
const raydiumSwapUrl = `https://raydium.io/swap/?outputMint=${JAL_MINT_ADDRESS}`;

const verificationItems: JalCoinVerificationItem[] = [
  {
    id: "mint",
    label: "Official Coin Address",
    technicalLabel: "Mint",
    value: JAL_MINT_ADDRESS,
    note: "The main address to check before you leave JALSOL.",
    href: solscanMintUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "green",
  },
  {
    id: "pool",
    label: "Trading Pool",
    technicalLabel: "Raydium pool",
    value: RAYDIUM_POOL_ADDRESS,
    note: "The public JAL / SOL place to compare on Raydium and Solscan.",
    href: solscanPoolUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "gold",
  },
  {
    id: "liquidity-wallet",
    label: "Support Address",
    technicalLabel: "Liquidity wallet",
    value: LIQUIDITY_SUPPORT_WALLET,
    note: "The official address for optional support.",
    href: solscanAuthorityUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "green",
  },
  {
    id: "reserve",
    label: "Public Record",
    technicalLabel: "Reserve account",
    value: RESERVE_TOKEN_ACCOUNT,
    note: "A public account connected to the support address.",
    href: solscanReserveUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "cyan",
  },
  {
    id: "freeze-authority",
    label: "Freeze Status",
    technicalLabel: "Freeze authority",
    value: "None",
    note: "Shows whether token accounts can be frozen.",
    href: solscanMintUrl,
    hrefLabel: "Mint",
    copyable: false,
    tone: "gold",
  },
];

const swapPracticeSteps: JalCoinPracticeStep[] = [
  {
    id: "choose-sol",
    title: "Choose SOL",
    body: "Start with SOL as the coin you want to use.",
  },
  {
    id: "check-mint",
    title: "Check The Link",
    body: `Make sure the JAL address matches ${shortAddress(JAL_MINT_ADDRESS)}.`,
  },
  {
    id: "review-raydium",
    title: "Review The Screen",
    body: "Check the amount, route, fees, and settings before doing anything.",
  },
  {
    id: "open-raydium",
    title: "Open Raydium",
    body: "Leave JALSOL only when you are ready.",
  },
];

const signalLogItems: JalSignalLogItem[] = [
  {
    id: "Signal 001",
    title: "Official Links Live",
    status: "Live",
    summary: "The main JAL/SOL page now gives visitors one place to check the official links.",
  },
  {
    id: "Signal 002",
    title: "Raydium Path Added",
    status: "Live",
    summary: "A simple path explains what to check before opening Raydium.",
  },
  {
    id: "Signal 003",
    title: "Support Address Published",
    status: "Live",
    summary: "The official support address is visible and easy to copy.",
  },
  {
    id: "Signal 004",
    title: "Legal Details Linked",
    status: "Live",
    summary: "Plain notes stay here, while detailed context remains in the Legal pages.",
  },
  {
    id: "Signal 005",
    title: "Explorer Layout Released",
    status: "Live",
    summary: "JAL/SOL now has a clearer public layout for new visitors.",
  },
  {
    id: "Signal 006",
    title: "Arcade Coming Soon",
    status: "Planned",
    summary: "Simple practice games can come later after the public page is steady.",
  },
];

export const JAL_COIN = {
  symbol: "$JAL",
  name: "JAL Coin",
  mintAddress: JAL_MINT_ADDRESS,
  liquiditySupportWallet: LIQUIDITY_SUPPORT_WALLET,
  mintAuthorityAddress: LIQUIDITY_SUPPORT_WALLET,
  reserveTokenAccount: RESERVE_TOKEN_ACCOUNT,
  raydiumPoolAddress: RAYDIUM_POOL_ADDRESS,
  lpMintAddress: LP_MINT_ADDRESS,
  freezeAuthorityStatus: "None",
  lastVerifiedOn: "June 24, 2026",
  solscanMintUrl,
  solscanAuthorityUrl,
  solscanReserveUrl,
  solscanPoolUrl,
  raydiumSwapUrl,
  raydiumPoolUrl: `https://raydium.io/liquidity-pools/?pool_id=${RAYDIUM_POOL_ADDRESS}`,
  verificationItems,
  swapPracticeSteps,
  signalLogItems,
  supportBoundaryCopy: {
    title: "Support is optional.",
    lead: "Use the official support address only if you choose to help the build.",
    bullets: [
      "Support is voluntary.",
      "Use the official support address only if you choose to help the build.",
      "No ownership, repayment, or future claim is created.",
    ],
  },
};

export function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
