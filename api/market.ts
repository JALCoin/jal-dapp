// /api/market.ts (Vercel / serverless)
// Curated watchlist for Home page (small + fast).
import type { VercelRequest, VercelResponse } from "@vercel/node";

type MarketRow = {
  coin: string;
  market: string;
  bid: number;
  ask: number;
  updatedAt?: number;
};

type CoinSpotLatestResponse = {
  prices?: Record<string, { bid?: number | string; ask?: number | string }>;
};

const PUB = "https://www.coinspot.com.au/pubapi/v2";

const WATCH: Array<{ coin: string; quote: "AUD" }> = [
  { coin: "BONK", quote: "AUD" },
  { coin: "SOL", quote: "AUD" },
  { coin: "BTC", quote: "AUD" },
  { coin: "ETH", quote: "AUD" },
  { coin: "XRP", quote: "AUD" },
  { coin: "USDT", quote: "AUD" },
];

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "market endpoint error";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  try {
    const r = await fetch(`${PUB}/latest`, {
      method: "GET",
      headers: { accept: "application/json", "cache-control": "no-cache" },
    });

    if (!r.ok) throw new Error(`CoinSpot latest failed: ${r.status}`);
    const j = (await r.json()) as CoinSpotLatestResponse;

    // IMPORTANT: CoinSpot keys are lowercase (btc, sol, xrp...)
    const prices = j?.prices ?? {};
    const now = Date.now();

    const out: MarketRow[] = [];

    for (const w of WATCH) {
      const coin = w.coin.toUpperCase();
      const key = coin.toLowerCase();
      const p = prices?.[key];

      const bid = toNum(p?.bid);
      const ask = toNum(p?.ask);

      if (!Number.isFinite(bid) || !Number.isFinite(ask)) continue;

      out.push({
        coin,
        market: `${coin}/${w.quote}`,
        bid,
        ask,
        updatedAt: now,
      });
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3, stale-while-revalidate=10");
    res.end(JSON.stringify(out));
  } catch (e: unknown) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: errorMessage(e) }));
  }
}
