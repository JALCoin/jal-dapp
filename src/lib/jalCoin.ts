const JAL_MINT_ADDRESS = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";

export const JAL_COIN = {
  symbol: "$JAL",
  name: "JAL Coin",
  mintAddress: JAL_MINT_ADDRESS,
  liquiditySupportWallet: "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2",
  mintAuthorityAddress: "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2",
  reserveTokenAccount: "3WfECZgu1tAeaHV3DooaPnR6jdTPzDGaoaP8TBMhmFVV",
  raydiumPoolAddress: "7tKoCSDR2CiQM83bxpSZxJ3f3mrngAsFiSvuafPfPGZK",
  lpMintAddress: "GpTEapMhViu6dd8tXvoSPcab8EXUEZtNMdYM1ay7XAgk",
  freezeAuthorityStatus: "None",
  solscanMintUrl: `https://solscan.io/token/${JAL_MINT_ADDRESS}`,
  solscanAuthorityUrl:
    "https://solscan.io/account/3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2",
  solscanReserveUrl:
    "https://solscan.io/account/3WfECZgu1tAeaHV3DooaPnR6jdTPzDGaoaP8TBMhmFVV",
  solscanPoolUrl: "https://solscan.io/account/7tKoCSDR2CiQM83bxpSZxJ3f3mrngAsFiSvuafPfPGZK",
  raydiumSwapUrl: `https://raydium.io/swap/?outputMint=${JAL_MINT_ADDRESS}`,
  raydiumPoolUrl:
    "https://raydium.io/liquidity-pools/?pool_id=7tKoCSDR2CiQM83bxpSZxJ3f3mrngAsFiSvuafPfPGZK",
};

export function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
