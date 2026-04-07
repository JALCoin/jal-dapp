import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthProvider";

function buildRedirectUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, session, profile, isEngineer, signOut } = useAuth();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("next") || "/app/jal-sol";
  }, [location.search]);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && session) {
      navigate(nextPath, { replace: true });
    }
  }, [loading, navigate, nextPath, session]);

  async function sendMagicLink(shouldCreateUser: boolean) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (!cleanEmail) {
      setError("Email is required.");
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
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
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
            Sign in before entering gated progression. Members move through the gate ladder.
            Engineers enter with unrestricted system access.
          </p>

          <div className="home-links" style={{ justifyContent: "center" }}>
            <span className="chip">Initiate</span>
            <span className="chip">Observer</span>
            <span className="chip">Participant</span>
            <span className="chip">Builder</span>
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
                  placeholder="Initiate handle"
                  autoComplete="nickname"
                />
              </label>

              <label className="jal-field">
                <span className="jal-field-label">Email</span>
                <input
                  className="jal-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </label>

              {notice ? <p className="jal-note">{notice}</p> : null}
              {error ? <p className="jal-error-text">{error}</p> : null}

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

              <div className="jal-bullets">
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
                  <div className="jal-bullet-k">Progression</div>
                  <div className="jal-bullet-v">
                    {profile?.progression_title ?? "initiate"}
                  </div>
                </article>
              </div>

              {session ? (
                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => navigate(nextPath)}
                  >
                    Continue
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => void signOut()}
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
