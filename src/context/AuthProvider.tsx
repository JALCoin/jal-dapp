import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type AccountType = "engineer" | "member";
export type ProgressionTitle =
  | "initiate"
  | "observer"
  | "participant"
  | "builder_candidate"
  | "builder";

export type AuthProfile = {
  id: string;
  email: string;
  display_name: string;
  account_type: AccountType;
  progression_title: ProgressionTitle;
  active_gate: string;
  member_mode_override: boolean;
  created_at: string;
  updated_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  isEngineer: boolean;
  isEngineerAccount: boolean;
  isTestingAsMember: boolean;
  setTestingAsMember: (next: boolean) => Promise<void>;
  refreshProfile: () => Promise<AuthProfile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_COLUMNS = `
  id,
  email,
  display_name,
  account_type,
  progression_title,
  active_gate,
  member_mode_override,
  created_at,
  updated_at
`;

function getDisplayName(user: User) {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";

  if (metadataName) return metadataName;
  if (user.email) return user.email.split("@")[0] ?? "Initiate";
  return "Initiate";
}

async function ensureProfile(user: User) {
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as AuthProfile;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        display_name: getDisplayName(user),
      },
      { onConflict: "id" }
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted as AuthProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return null;
    }

    const nextProfile = await ensureProfile(user);
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      clearAuthState();
      return null;
    }

    setLoading(true);

    try {
      return await loadProfile(user);
    } finally {
      setLoading(false);
    }
  }, [clearAuthState, loadProfile, user]);

  const setTestingAsMember = useCallback(
    async (next: boolean) => {
      if (!profile?.id || profile.account_type !== "engineer") {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          member_mode_override: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select(PROFILE_COLUMNS)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as AuthProfile);
    },
    [profile]
  );

  useEffect(() => {
    let active = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!active) return;

      if (!nextSession?.user) {
        clearAuthState();
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const {
          data: { user: liveUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!liveUser) {
          await supabase.auth.signOut({ scope: "local" });

          if (!active) return;
          clearAuthState();
          return;
        }

        const nextProfile = await ensureProfile(liveUser);

        if (!active) return;
        setSession(nextSession);
        setUser(liveUser);
        setProfile(nextProfile);
      } catch (error) {
        console.error("Failed to load Supabase profile", error);

        if (!active) return;

        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch (signOutError) {
          console.error("Failed to clear invalid Supabase session", signOutError);
        }

        clearAuthState();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        return syncSession(data.session);
      })
      .catch((error) => {
        console.error("Failed to get Supabase session", error);

        if (!active) return;
        clearAuthState();
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isEngineerAccount = profile?.account_type === "engineer";
    const isTestingAsMember = Boolean(profile?.member_mode_override);
    const isEngineer = isEngineerAccount && !isTestingAsMember;

    return {
      session,
      user,
      profile,
      loading,
      isEngineer,
      isEngineerAccount,
      isTestingAsMember,
      setTestingAsMember,
      refreshProfile,
      signOut,
    };
  }, [
    loading,
    profile,
    refreshProfile,
    session,
    setTestingAsMember,
    signOut,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
