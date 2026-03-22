export const MIN_TOKEN_FIT_SCORE = 12;
export const TOKEN_FIT_HIGH_SCORE_KEY = "jal_token_fit_high_score";
export const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";

export function getStoredHighScore(): number {
  const raw = localStorage.getItem(TOKEN_FIT_HIGH_SCORE_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function setStoredHighScore(score: number) {
  localStorage.setItem(TOKEN_FIT_HIGH_SCORE_KEY, String(score));
}