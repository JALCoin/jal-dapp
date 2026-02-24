// /api/market.ts (Vercel / serverless)
// Curated watchlist for Home page (small + fast).
type MarketRow = {
  coin: string;
  market: string;
  bid: number;
  ask: number;
  updatedAt?: number;
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

function toNum(v: any): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default async function handler(req: any, res: any) {
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
    const j = await r.json();

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
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: e?.message ?? "market endpoint error" }));
  }
}