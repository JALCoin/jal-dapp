function isLikelyEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type IdentityLookupSuccess = {
  email: string;
  displayName: string | null;
};

type IdentityLookupError = {
  error?: string;
};

export async function resolveMagicLinkEmail(identity: string) {
  const cleanIdentity = identity.trim();

  if (!cleanIdentity) {
    throw new Error("Email or handle is required.");
  }

  if (isLikelyEmailAddress(cleanIdentity)) {
    return cleanIdentity.toLowerCase();
  }

  const response = await fetch(
    `/api/auth-identity?identity=${encodeURIComponent(cleanIdentity)}`,
    {
      method: "GET",
      headers: { accept: "application/json" },
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | IdentityLookupSuccess
    | IdentityLookupError
    | null;

  const errorMessage =
    payload && "error" in payload
      ? payload.error
      : undefined;

  if (!response.ok || !payload || !("email" in payload)) {
    throw new Error(
      errorMessage ?? "No account was found for that handle. Use the email instead."
    );
  }

  return payload.email.trim().toLowerCase();
}

export { isLikelyEmailAddress };
