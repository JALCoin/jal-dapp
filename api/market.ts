// /api/market.ts
// Public market snapshot for Home page (no visitor keys).
// Uses CoinSpot public v2 latest prices.
// Returns MarketRow[].

type MarketRow = {
  coin: string;          // "BTC"
  market: string;        // "BTC/AUD"
  bid: number;
  ask: number;
  change24hPct?: number; // optional (not provided by /latest)
  updatedAt?: number;    // epoch ms (server-stamped)
};

const PUB = "https://www.coinspot.com.au/pubapi/v2";

// Curated watchlist for Home (add/remove freely)
const WATCH: Array<{ coin: string; quote: "AUD" }> = [
  { coin: "BONK", quote: "AUD" },
  { coin: "SOL",  quote: "AUD" },
  { coin: "BTC",  quote: "AUD" },
  { coin: "ETH",  quote: "AUD" },
  { coin: "XRP",  quote: "AUD" },
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
    const r = await fetch(`${PUB}/latest`, { method: "GET" });
    if (!r.ok) throw new Error(`CoinSpot latest failed: ${r.status}`);
    const j = await r.json();

    const prices = j?.prices ?? {};
    const now = Date.now();

    const out: MarketRow[] = [];

    for (const w of WATCH) {
      const coin = w.coin.toUpperCase();
      const p = prices?.[coin];
      const bid = toNum(p?.bid);
      const ask = toNum(p?.ask);

      // If no bid/ask, skip (not usable for snapshot)
      if (!Number.isFinite(bid) || !Number.isFinite(ask)) continue;

      out.push({
        coin,
        market: `${coin}/${w.quote}`,
        bid,
        ask,
        updatedAt: now,
      });
    }

    // Light caching: feels live + avoids hammering
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