import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthProvider";
import { isLikelyEmailAddress, resolveMagicLinkEmail } from "../lib/authIdentity";

function buildRedirectUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, session, profile, isEngineer } = useAuth();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("next") || "/app/jal-sol";
  }, [location.search]);

  const [displayName, setDisplayName] = useState("");
  const [identity, setIdentity] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && session) {
      navigate(nextPath, { replace: true });
    }
  }, [loading, navigate, nextPath, session]);

  async function sendMagicLink(shouldCreateUser: boolean) {
    const cleanIdentity = identity.trim();
    const cleanDisplayName = displayName.trim();

    if (!cleanIdentity) {
      setError("Email or handle is required.");
      return;
    }

    if (shouldCreateUser && !cleanDisplayName) {
      setError("Display name is required when creating an account.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const resolvedEmail = shouldCreateUser
        ? cleanIdentity.toLowerCase()
        : await resolveMagicLinkEmail(cleanIdentity);

      if (shouldCreateUser && !isLikelyEmailAddress(resolvedEmail)) {
        setError("Use a real email when creating an account.");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          shouldCreateUser,
          emailRedirectTo: buildRedirectUrl(nextPath),
          data: shouldCreateUser ? { display_name: cleanDisplayName } : undefined,
        },
      });

      if (authError) {
        throw authError;
      }

      setNotice(
        shouldCreateUser
          ? "Access link sent. Confirm the email to create your JAL/SOL account."
          : "Sign-in link sent. Open the email on this device to continue."
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to send access email.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="home-shell" aria-label="JAL/SOL access terminal">
      <div className="home-wrap" style={{ display: "grid", gap: 24 }}>
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">JAL/SOL Access Terminal</h1>
          <p className="home-lead">
            Sign in before entering the onboarding flow. Members move through the learning and
            builder modules. Internal engineer accounts can access development tools.
          </p>

          <div className="home-links" style={{ justifyContent: "center" }}>
            <span className="chip">Access</span>
            <span className="chip">Observe</span>
            <span className="chip">Member</span>
            <span className="chip">Build</span>
            <span className="chip">Engineer</span>
          </div>
        </section>

        <section className="jal-bay jal-bay-wide">
          <div className="jal-bay-head">
            <div className="jal-bay-title">Identity Link</div>
            <div className="jal-bay-note">Magic-link access</div>
          </div>

          <div className="jal-grid">
            <section className="jal-bay">
              <label className="jal-field">
                <span className="jal-field-label">Display Name</span>
                <input
                  className="jal-input"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your display name"
                  autoComplete="nickname"
                />
              </label>

              <label className="jal-field">
                <span className="jal-field-label">Email Or Handle</span>
                <input
                  className="jal-input"
                  type="text"
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  placeholder="you@domain.com or your chosen handle"
                  autoComplete="username"
                />
                <span className="jal-auth-input-note">
                  Use your email to create an account. For sign-in, you can use either your email
                  or your chosen handle.
                </span>
              </label>

              {notice ? <p className="jal-note">{notice}</p> : null}
              {error ? <p className="jal-error-text">{error}</p> : null}

              <aside className="jal-auth-delivery-note" aria-label="Email delivery guidance">
                <div className="jal-auth-delivery-title">
                  Haven&apos;t received your access email in your inbox?
                </div>
                <p className="jal-auth-delivery-copy">
                  JAL/SOL&apos;s emailing system is new and still building reputation. If you
                  don&apos;t see your access link in your inbox, it will most likely be in Junk. If
                  it still hasn&apos;t arrived, use <strong>Send Sign-In Link</strong> again. If
                  you&apos;re having any issues, contact us and we&apos;ll fix them as fast as
                  possible.
                </p>
              </aside>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => void sendMagicLink(true)}
                  disabled={busy}
                >
                  Create Account
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => void sendMagicLink(false)}
                  disabled={busy}
                >
                  Send Sign-In Link
                </button>
              </div>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Access Rules</div>
                <div className="jal-bay-note">Current target route</div>
              </div>

              <p className="jal-note">
                After sign-in, this terminal will route you to <strong>{nextPath}</strong>.
              </p>

              <div className="jal-bullets jal-bullets-auth">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Signed In</div>
                  <div className="jal-bullet-v">{session ? "Yes" : "No"}</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Role</div>
                  <div className="jal-bullet-v">
                    {profile ? (isEngineer ? "Engineer" : "Member") : "Pending"}
                  </div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Sign-In Method</div>
                  <div className="jal-bullet-v">Magic link only. No password required.</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Progression</div>
                  <div className="jal-bullet-v">
                    {profile?.progression_title ?? "starting"}
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
