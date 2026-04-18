import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthProvider";
import { isLikelyEmailAddress, resolveMagicLinkEmail } from "../lib/authIdentity";
import { usePageMeta } from "../hooks/usePageMeta";

function buildRedirectUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export default function Auth() {
  usePageMeta(
    "Site Access",
    "Access your JALSOL site account for order-related information, member access, and authenticated routes tied to the public Jeremy Aaron Lugg domain."
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { loading, session, profile, isEngineer } = useAuth();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("next") || "/app/home";
  }, [location.search]);
  const isEngineerAccessRequest = nextPath.startsWith("/app/engine");

  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signInIdentity, setSignInIdentity] = useState("");
  const [busyMode, setBusyMode] = useState<"signup" | "signin" | null>(null);
  const [signUpNotice, setSignUpNotice] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signInNotice, setSignInNotice] = useState("");
  const [signInError, setSignInError] = useState("");

  useEffect(() => {
    if (!loading && session) {
      if (isEngineerAccessRequest && !isEngineer) {
        navigate("/app/compliance", { replace: true });
        return;
      }

      navigate(nextPath, { replace: true });
    }
  }, [isEngineer, isEngineerAccessRequest, loading, navigate, nextPath, session]);

  function clearFeedback(mode: "signup" | "signin") {
    if (mode === "signup") {
      setSignUpNotice("");
      setSignUpError("");
      return;
    }

    setSignInNotice("");
    setSignInError("");
  }

  function setModeError(mode: "signup" | "signin", message: string) {
    if (mode === "signup") {
      setSignUpError(message);
      return;
    }

    setSignInError(message);
  }

  function setModeNotice(mode: "signup" | "signin", message: string) {
    if (mode === "signup") {
      setSignUpNotice(message);
      return;
    }

    setSignInNotice(message);
  }

  async function sendMagicLink(mode: "signup" | "signin") {
    const shouldCreateUser = mode === "signup";
    const cleanIdentity = shouldCreateUser ? signUpEmail.trim() : signInIdentity.trim();
    const cleanDisplayName = signUpDisplayName.trim();

    if (!cleanIdentity) {
      setModeError(mode, shouldCreateUser ? "Email is required to create an account." : "Email or handle is required.");
      return;
    }

    if (shouldCreateUser && !cleanDisplayName) {
      setModeError(mode, "Display name is required when creating an account.");
      return;
    }

    setBusyMode(mode);
    clearFeedback(mode);

    try {
      const resolvedEmail = shouldCreateUser
        ? cleanIdentity.toLowerCase()
        : await resolveMagicLinkEmail(cleanIdentity);

      if (shouldCreateUser && !isLikelyEmailAddress(resolvedEmail)) {
        setModeError(mode, "Use a real email when creating an account.");
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

      setModeNotice(
        mode,
        shouldCreateUser
          ? "Access link sent. Confirm the email to create your site account."
          : "Sign-in link sent. Open the email on this device to continue."
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to send access email.";
      setModeError(mode, message);
    } finally {
      setBusyMode(null);
    }
  }

  const signUpBusy = busyMode === "signup";
  const signInBusy = busyMode === "signin";

  return (
    <main className="home-shell" aria-label="Jeremy Aaron Lugg site access">
      <div className="home-wrap" style={{ display: "grid", gap: 24 }}>
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">
            {isEngineerAccessRequest ? "JAL Engine Access" : "Jeremy Aaron Lugg Site Access"}
          </h1>
          <p className="home-lead">
            {isEngineerAccessRequest
              ? "JAL Engine is a private operator surface. Sign in with your existing engineer account to continue."
              : "Sign in to access your site account, order-related information, and authenticated routes connected to the public Jeremy Aaron Lugg domain."}
          </p>

          <div className="home-links" style={{ justifyContent: "center" }}>
            <span className="chip">Access</span>
            <span className="chip">Sign In</span>
            <span className="chip">{isEngineerAccessRequest ? "Private Operator" : "Engineer"}</span>
            {!isEngineerAccessRequest ? <span className="chip">Sign Up</span> : null}
          </div>
        </section>

        <section className="jal-bay jal-bay-wide">
          <div className="jal-bay-head">
            <div className="jal-bay-title">Identity Link</div>
            <div className="jal-bay-note">Magic-link access</div>
          </div>

          <div className="jal-auth-grid">
            {!isEngineerAccessRequest ? (
              <section className="jal-bay jal-auth-card jal-auth-card--signup">
                <div className="jal-bay-head">
                  <div>
                    <div className="jal-bay-title">Create Account</div>
                    <p className="jal-auth-card-copy">
                      For new members. Use a real email and the display name you want attached to
                      your site profile.
                    </p>
                  </div>
                  <div className="jal-bay-note">New account</div>
                </div>

                <label className="jal-field">
                  <span className="jal-field-label">Display Name</span>
                  <input
                    className="jal-input"
                    type="text"
                    value={signUpDisplayName}
                    onChange={(event) => setSignUpDisplayName(event.target.value)}
                    placeholder="Your display name"
                    autoComplete="nickname"
                  />
                </label>

                <label className="jal-field">
                  <span className="jal-field-label">Email</span>
                  <input
                    className="jal-input"
                    type="email"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                  />
                  <span className="jal-auth-input-note">
                    New account creation uses email only so the access link can create and verify
                    your site profile correctly.
                  </span>
                </label>

                {signUpNotice ? <p className="jal-note">{signUpNotice}</p> : null}
                {signUpError ? <p className="jal-error-text">{signUpError}</p> : null}

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className="button gold"
                    onClick={() => void sendMagicLink("signup")}
                    disabled={busyMode !== null}
                  >
                    {signUpBusy ? "Sending..." : "Create Account"}
                  </button>
                </div>
              </section>
            ) : (
              <section className="jal-bay jal-auth-card jal-auth-card--signup">
                <div className="jal-bay-head">
                  <div>
                    <div className="jal-bay-title">Private Operator Notice</div>
                    <p className="jal-auth-card-copy">
                      New account creation does not grant JAL Engine access. This route is reserved
                      for Jeremy Aaron Lugg&apos;s existing engineer account only.
                    </p>
                  </div>
                  <div className="jal-bay-note">Engineer only</div>
                </div>

                <p className="jal-note">
                  If you are signing in as the engineer account, use the returning-account sign-in
                  panel. Other authenticated accounts will be sent back to the compliance notice.
                </p>
              </section>
            )}

            <section className="jal-bay jal-auth-card jal-auth-card--signin">
              <div className="jal-bay-head">
                <div>
                  <div className="jal-bay-title">Sign In</div>
                  <p className="jal-auth-card-copy">
                    {isEngineerAccessRequest
                      ? "Use the email already tied to your engineer profile, or the handle already linked to that account."
                      : "For returning members. Use the email already tied to your profile, or your chosen handle if it has already been set up."}
                  </p>
                </div>
                <div className="jal-bay-note">{isEngineerAccessRequest ? "Engineer sign-in" : "Returning account"}</div>
              </div>

              <label className="jal-field">
                <span className="jal-field-label">Email Or Handle</span>
                <input
                  className="jal-input"
                  type="text"
                  value={signInIdentity}
                  onChange={(event) => setSignInIdentity(event.target.value)}
                  placeholder="you@domain.com or your chosen handle"
                  autoComplete="username"
                />
                <span className="jal-auth-input-note">
                  Sign-in can use either your email or a previously saved handle linked to that
                  profile.
                </span>
              </label>

              {signInNotice ? <p className="jal-note">{signInNotice}</p> : null}
              {signInError ? <p className="jal-error-text">{signInError}</p> : null}

              <aside className="jal-auth-delivery-note" aria-label="Email delivery guidance">
                <div className="jal-auth-delivery-title">
                  Haven&apos;t received your sign-in email?
                </div>
                <p className="jal-auth-delivery-copy">
                  If the link doesn&apos;t appear in your inbox, check Junk first. If it still
                  hasn&apos;t arrived, send the sign-in link again. If delivery keeps failing,
                  contact us and we&apos;ll sort it out.
                </p>
              </aside>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => void sendMagicLink("signin")}
                  disabled={busyMode !== null}
                >
                  {signInBusy ? "Sending..." : isEngineerAccessRequest ? "Send Engineer Sign-In Link" : "Send Sign-In Link"}
                </button>
              </div>
            </section>

            <section className="jal-bay jal-auth-status">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Access Rules</div>
                <div className="jal-bay-note">Current target route</div>
              </div>

              <p className="jal-note jal-auth-status-copy">
                After sign-in, this terminal will route you to <strong>{nextPath}</strong>.
              </p>

                <p className="jal-auth-input-note">
                  {isEngineerAccessRequest
                    ? "JAL Engine access requires an existing engineer account. Signing in as a standard member will not unlock the private operator surface."
                    : "Create account and sign-in are separated here so first-time users don't get mixed into the returning-member flow."}
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
                  <div className="jal-bullet-k">Create Account</div>
                  <div className="jal-bullet-v">Display name plus verified email.</div>
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
