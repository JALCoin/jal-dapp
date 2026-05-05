import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

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

export type AuthContextValue = {
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

export const AuthContext = createContext<AuthContextValue | null>(null);
