const JAL_MINT_ADDRESS = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";
const LIQUIDITY_SUPPORT_WALLET = "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2";
const RESERVE_TOKEN_ACCOUNT = "3WfECZgu1tAeaHV3DooaPnR6jdTPzDGaoaP8TBMhmFVV";
const RAYDIUM_POOL_ADDRESS = "7tKoCSDR2CiQM83bxpSZxJ3f3mrngAsFiSvuafPfPGZK";
const LP_MINT_ADDRESS = "GpTEapMhViu6dd8tXvoSPcab8EXUEZtNMdYM1ay7XAgk";

export type JalCoinVerificationItem = {
  id: string;
  label: string;
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

const solscanMintUrl = `https://solscan.io/token/${JAL_MINT_ADDRESS}`;
const solscanAuthorityUrl = `https://solscan.io/account/${LIQUIDITY_SUPPORT_WALLET}`;
const solscanReserveUrl = `https://solscan.io/account/${RESERVE_TOKEN_ACCOUNT}`;
const solscanPoolUrl = `https://solscan.io/account/${RAYDIUM_POOL_ADDRESS}`;
const raydiumSwapUrl = `https://raydium.io/swap/?outputMint=${JAL_MINT_ADDRESS}`;

const verificationItems: JalCoinVerificationItem[] = [
  {
    id: "mint",
    label: "Official Mint",
    value: JAL_MINT_ADDRESS,
    note: "The public SPL token mint for JAL Coin.",
    href: solscanMintUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "green",
  },
  {
    id: "pool",
    label: "Raydium Pool",
    value: RAYDIUM_POOL_ADDRESS,
    note: "The public JAL / SOL pool account.",
    href: solscanPoolUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "gold",
  },
  {
    id: "liquidity-wallet",
    label: "Liquidity Wallet",
    value: LIQUIDITY_SUPPORT_WALLET,
    note: "Official public wallet for voluntary JAL liquidity support.",
    href: solscanAuthorityUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "green",
  },
  {
    id: "reserve",
    label: "Reserve Account",
    value: RESERVE_TOKEN_ACCOUNT,
    note: "Token account owned by the public wallet.",
    href: solscanReserveUrl,
    hrefLabel: "Solscan",
    copyable: true,
    tone: "cyan",
  },
  {
    id: "freeze-authority",
    label: "Freeze Authority",
    value: "None",
    note: "No freeze authority is shown for the JAL mint.",
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
    body: "On Raydium, pick SOL as the token you want to use.",
  },
  {
    id: "check-mint",
    title: "Check JAL Mint",
    body: `Compare the mint with ${shortAddress(JAL_MINT_ADDRESS)} before you continue.`,
  },
  {
    id: "review-raydium",
    title: "Review Raydium",
    body: "Check the route, amount, network fees, and slippage inside Raydium.",
  },
  {
    id: "open-raydium",
    title: "Open Raydium",
    body: "Use the official button when you are ready to leave JALSOL.",
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
  supportBoundaryCopy: {
    title: "Support is voluntary.",
    lead: "Copy the official wallet only if you choose to support the build.",
    bullets: [
      "Support is voluntary.",
      "Funds sent to the wallet are controlled by the operator.",
      "No ownership, LP-token claim, repayment, or future benefit is created.",
    ],
  },
};

export function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
