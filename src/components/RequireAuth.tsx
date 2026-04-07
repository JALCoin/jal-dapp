import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { loading, profile, session, user } = useAuth();

  if (loading) {
    return (
      <main className="home-shell" aria-label="Authorizing access">
        <div className="home-wrap">
          <section className="card machine-surface panel-frame">
            <h1 className="home-title">Authorizing Access</h1>
            <p className="home-lead">
              Verifying your JAL/SOL account and gate permissions.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!session || !user || !profile) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}
