export function getScopedStorageKey(baseKey: string, scope?: string | null) {
  const cleanScope = typeof scope === "string" ? scope.trim() : "";
  return cleanScope ? `${baseKey}:${cleanScope}` : baseKey;
}
