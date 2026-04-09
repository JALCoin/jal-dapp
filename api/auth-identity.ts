import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

type ProfileIdentity = {
  email: string | null;
  display_name: string | null;
};

function getIdentity(queryValue: string | string[] | undefined) {
  if (Array.isArray(queryValue)) return queryValue[0]?.trim() ?? "";
  return queryValue?.trim() ?? "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const identity = getIdentity(req.query.identity);

  if (!identity) {
    res.status(400).json({ error: "Identity is required." });
    return;
  }

  if (identity.includes("%") || identity.includes("*")) {
    res.status(400).json({ error: "Use the exact handle or email." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "Auth identity lookup is not configured." });
    return;
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await admin
      .from("profiles")
      .select("email, display_name")
      .ilike("display_name", identity)
      .limit(2);

    if (error) {
      throw error;
    }

    const matches = ((data ?? []) as ProfileIdentity[]).filter(
      (entry) => entry.email && entry.display_name
    );

    if (matches.length === 0) {
      res.status(404).json({
        error: "No account was found for that handle. Use the email instead.",
      });
      return;
    }

    if (matches.length > 1) {
      res.status(409).json({
        error: "That handle matches multiple accounts. Use the email instead.",
      });
      return;
    }

    const [match] = matches;

    res.status(200).json({
      email: match.email,
      displayName: match.display_name,
    });
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : "Identity lookup failed.";

    res.status(500).json({ error: message });
  }
}
