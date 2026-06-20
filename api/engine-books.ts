import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_ENGINE_SERVICE = "https://jal-engine-service-production.up.railway.app";

type BooksAction =
  | "summary"
  | "trades"
  | "export"
  | "lender-report"
  | "lender-report-csv"
  | "evidence"
  | "import"
  | "sync"
  | "entry";

const VALID_BOOKS_ACTIONS: BooksAction[] = [
  "summary",
  "trades",
  "export",
  "lender-report",
  "lender-report-csv",
  "evidence",
  "import",
  "sync",
  "entry",
];

const LENDER_QUERY_KEYS = [
  "loanAmountAud",
  "annualRatePct",
  "termMonths",
  "operatingExpensesAud",
  "taxReservePct",
  "baseRevenueAud",
  "adverseRevenueAud",
  "negativeMonthAud",
  "openingCashAud",
];

function env(name: string) {
  return String(process.env[name] || "").trim();
}

function bearerToken(req: VercelRequest) {
  const raw = String(req.headers.authorization || "").trim();
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function json(res: VercelResponse, code: number, body: unknown) {
  res.status(code).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req: VercelRequest) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return {};
}

async function requireEngineer(req: VercelRequest) {
  const token = bearerToken(req);
  if (!token) return { ok: false, code: 401, error: "AUTH_REQUIRED" };

  const supabaseUrl = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
  const publishable = env("SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY") || env("VITE_SUPABASE_PUBLISHABLE_KEY");
  const apiKey = serviceRole || publishable;

  if (!supabaseUrl || !apiKey) return { ok: false, code: 500, error: "SUPABASE_SERVER_ENV_MISSING" };

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: apiKey,
      authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) return { ok: false, code: 401, error: "AUTH_INVALID" };
  const userJson = (await userRes.json()) as { id?: string };
  const userId = String(userJson?.id || "").trim();
  if (!userId) return { ok: false, code: 401, error: "AUTH_INVALID" };

  const profileAuth = serviceRole ? `Bearer ${serviceRole}` : `Bearer ${token}`;
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=account_type&limit=1`,
    {
      headers: {
        apikey: apiKey,
        authorization: profileAuth,
        accept: "application/json",
      },
    }
  );

  if (!profileRes.ok) return { ok: false, code: 403, error: "PROFILE_READ_FAILED" };
  const profiles = (await profileRes.json()) as Array<{ account_type?: string }>;
  if (profiles?.[0]?.account_type !== "engineer") return { ok: false, code: 403, error: "ENGINEER_REQUIRED" };

  return { ok: true, code: 200, error: null };
}

function targetFor(action: BooksAction, fy: string, req: VercelRequest) {
  const params = new URLSearchParams();
  if (fy) params.set("fy", fy);
  if (action === "lender-report" || action === "lender-report-csv") {
    for (const key of LENDER_QUERY_KEYS) {
      const raw = req.query[key];
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (value != null && String(value).trim()) params.set(key, String(value));
    }
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  if (action === "summary") return { method: "GET", path: `/api/operator/books/summary${query}` };
  if (action === "trades") return { method: "GET", path: `/api/operator/books/trades${query}` };
  if (action === "export") return { method: "GET", path: `/api/operator/books/export.csv${query}` };
  if (action === "lender-report") return { method: "GET", path: `/api/operator/books/lender-report${query}` };
  if (action === "lender-report-csv") return { method: "GET", path: `/api/operator/books/lender-report.csv${query}` };
  if (action === "evidence") return { method: req.method === "POST" ? "POST" : "GET", path: `/api/operator/books/evidence${query}` };
  if (action === "import") return { method: "POST", path: "/api/operator/books/import/coinspot-history" };
  if (action === "sync") return { method: "POST", path: "/api/operator/books/sync/coinspot-readonly" };
  return { method: "POST", path: "/api/operator/books/entry" };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST");
    res.end("Method Not Allowed");
    return;
  }

  const auth = await requireEngineer(req);
  if (!auth.ok) return json(res, auth.code, { ok: false, error: auth.error });

  const operatorToken = env("ENGINE_OPERATOR_TOKEN");
  if (!operatorToken) return json(res, 500, { ok: false, error: "ENGINE_OPERATOR_TOKEN_MISSING" });

  const action = String(req.query.action || "summary") as BooksAction;
  if (!VALID_BOOKS_ACTIONS.includes(action)) {
    return json(res, 400, { ok: false, error: "INVALID_BOOKS_ACTION" });
  }

  const fy = String(req.query.fy || "").trim();
  const target = targetFor(action, fy, req);
  if (req.method === "GET" && target.method !== "GET") return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  if (req.method === "POST" && target.method !== "POST") return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });

  const base = (env("ENGINE_SERVICE_URL") || DEFAULT_ENGINE_SERVICE).replace(/\/+$/, "");
  const body = target.method === "POST" ? JSON.stringify(await readJson(req)) : undefined;
  const csvAction = action === "export" || action === "lender-report-csv";
  const upstream = await fetch(`${base}${target.path}`, {
    method: target.method,
    headers: {
      accept: csvAction ? "text/csv" : "application/json",
      "content-type": "application/json",
      "x-operator-token": operatorToken,
    },
    body,
  });

  const text = await upstream.text();
  res.statusCode = upstream.status;

  if (csvAction && upstream.ok) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    const filename =
      action === "lender-report-csv"
        ? `jeremy-aaron-lugg-lender-report-${fy || "current"}.csv`
        : `jalsol-books-${fy || "current"}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(text);
    return;
  }

  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
  res.end(text);
}
