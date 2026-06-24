const FALLBACK_DONATE_URL = "https://buy.stripe.com/bJe28qdNCfwD3yf1880x20d";

export const DONATE_URL =
  import.meta.env.VITE_DONATE_URL?.trim() || FALLBACK_DONATE_URL;
