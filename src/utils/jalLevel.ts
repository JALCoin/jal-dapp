export type JALLevel = 0 | 1 | 2 | 3 | 4;

const KEY = "jal_level";

export function getLevel(): JALLevel {
  const raw = localStorage.getItem(KEY);
  if (!raw) return 0;
  return Math.min(4, Math.max(0, Number(raw))) as JALLevel;
}

export function setLevel(level: JALLevel) {
  localStorage.setItem(KEY, String(level));
}

export function unlockLevel(level: JALLevel) {
  const current = getLevel();
  if (level > current) {
    setLevel(level);
  }
}