import { supabase } from "./supabase";

const LEVEL_1_PRODUCT_ID = "jal-sol-level-1";
const LEVEL_1_STORAGE_KEY = "jal_sol_level_1_access";

type StoredLevel1Access = {
  sessionId: string;
  email: string | null;
  grantedAt: string;
};

export async function hasLevel1Access(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  if (!clean) return false;

  const { data, error } = await supabase
    .from("orders")
    .select("stripe_session_id")
    .eq("customer_email", clean)
    .eq("product_id", LEVEL_1_PRODUCT_ID)
    .eq("status", "paid")
    .limit(1);

  if (error) {
    console.error("hasLevel1Access error:", error.message);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

export async function getLevel1AccessBySessionId(sessionId: string): Promise<{
  ok: boolean;
  email: string | null;
}> {
  const clean = sessionId.trim();
  if (!clean) {
    return { ok: false, email: null };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("stripe_session_id, customer_email, product_id, status")
    .eq("stripe_session_id", clean)
    .eq("product_id", LEVEL_1_PRODUCT_ID)
    .eq("status", "paid")
    .limit(1);

  if (error) {
    console.error("getLevel1AccessBySessionId error:", error.message);
    return { ok: false, email: null };
  }

  const row = Array.isArray(data) ? data[0] : null;

  return {
    ok: Boolean(row),
    email: row?.customer_email ?? null,
  };
}

export function persistLevel1Access(sessionId: string, email: string | null) {
  const payload: StoredLevel1Access = {
    sessionId,
    email,
    grantedAt: new Date().toISOString(),
  };

  localStorage.setItem(LEVEL_1_STORAGE_KEY, JSON.stringify(payload));
}

export function readLevel1Access(): StoredLevel1Access | null {
  try {
    const raw = localStorage.getItem(LEVEL_1_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLevel1Access;
  } catch {
    return null;
  }
}

export function clearLevel1Access() {
  localStorage.removeItem(LEVEL_1_STORAGE_KEY);
}