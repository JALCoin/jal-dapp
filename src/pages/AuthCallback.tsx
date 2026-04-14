import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
  return searchParams.get("next") || "/app/home";
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const finishAuth = async () => {
      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });

          if (verifyError) {
            throw verifyError;
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error("No authenticated session was created from the email link.");
        }

        if (!active) return;
        navigate(nextPath, { replace: true });
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to complete JAL/SOL sign-in.";

        if (!active) return;
        setError(message);
      }
    };

    void finishAuth();

    return () => {
      active = false;
    };
  }, [navigate, nextPath, searchParams]);

  return (
    <main className="home-shell" aria-label="Completing JAL/SOL sign-in">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">Synchronizing Access</h1>
          <p className="home-lead">
            Finalizing your Supabase session and loading the next JAL/SOL route.
          </p>

          {error ? <p className="jal-error-text">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
