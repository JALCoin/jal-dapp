import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  readGate3ProfileHandover,
  type Gate3ProfileHandover,
} from "../utils/gate3Profile";
import { useAuth } from "../context/AuthProvider";
import { getScopedStorageKey } from "../utils/scopedStorage";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/token"
  | "/app/engine";

type Gate3Path = "jal-sol" | "solana";
type Gate3Theme = "default" | "emerald" | "violet" | "gold";
type Gate3Stage = "landing" | "hub";

type Gate3NavId =
  | "initialise"
  | "profile"
  | "dashboard"
  | "token-forge"
  | "domain-setup"
  | "trials"
  | "inventory"
  | "theme-identity"
  | "market-path"
  | "vault";

type Gate3BuilderState = {
  initialised: boolean;
  stage: Gate3Stage;
  slotLabel: string;
  projectName: string;
  tokenSymbol: string;
  builderName: string;
  email: string;
  selectedPath: Gate3Path | "";
  selectedTheme: Gate3Theme | "";
  responsibilityAccepted: boolean;
  navUnlocked: boolean;
  completedAt: number | null;
};

type Gate3NavCard = {
  id: Gate3NavId;
  title: string;
  note: string;
  requirement: string;
};

const GATE3_STATE_KEY = "gate3_builder_state_v1";

const DEFAULT_GATE3_STATE: Gate3BuilderState = {
  initialised: false,
  stage: "landing",
  slotLabel: "JAL/SOL",
  projectName: "",
  tokenSymbol: "",
  builderName: "",
  email: "",
  selectedPath: "",
  selectedTheme: "",
  responsibilityAccepted: false,
  navUnlocked: false,
  completedAt: null,
};

const GATE3_NAV: Gate3NavCard[] = [
  {
    id: "initialise",
    title: "Initialise",
    note: "Assign the empty builder slot and activate your Gate 03 shell.",
    requirement: "Available now",
  },
  {
    id: "profile",
    title: "Profile",
    note: "View the builder identity inherited from Gate 02 and Gate 03 choices.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "dashboard",
    title: "Builder Dashboard",
    note: "Track launch readiness, build milestones, and authorship progress.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "token-forge",
    title: "Token Forge",
    note: "Move into mint creation, ATA flow, supply, and metadata structure.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "domain-setup",
    title: "Domain Setup",
    note: "Shape naming, routes, and custom system identity around the build.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "trials",
    title: "JAL's Trials",
    note: "Earn achievements, unlocks, and later custom game direction.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "inventory",
    title: "Inventory",
    note: "Store earned parts, themes, achievements, and future assets.",
    requirement: "Unlocks after first builder shell activation",
  },
  {
    id: "theme-identity",
    title: "Theme / Identity",
    note: "Later customise colour, story tone, and presentation layer.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "market-path",
    title: "Market Path",
    note: "Choose strategic direction for what this authored system becomes.",
    requirement: "Unlocks after initialisation",
  },
  {
    id: "vault",
    title: "Vault / Publish",
    note: "Assemble readiness for final output, release, and expansion.",
    requirement: "Unlocks later",
  },
];

function readGate3State(storageScope?: string | null): Gate3BuilderState {
  try {
    const raw = localStorage.getItem(
      getScopedStorageKey(GATE3_STATE_KEY, storageScope)
    );
    if (!raw) return DEFAULT_GATE3_STATE;

    const parsed = JSON.parse(raw) as Partial<Gate3BuilderState>;

    return {
      initialised: Boolean(parsed.initialised),
      stage: parsed.stage === "hub" ? "hub" : "landing",
      slotLabel:
        typeof parsed.slotLabel === "string" && parsed.slotLabel.trim()
          ? parsed.slotLabel
          : "JAL/SOL",
      projectName:
        typeof parsed.projectName === "string" ? parsed.projectName : "",
      tokenSymbol:
        typeof parsed.tokenSymbol === "string" ? parsed.tokenSymbol : "",
      builderName:
        typeof parsed.builderName === "string" ? parsed.builderName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      selectedPath:
        parsed.selectedPath === "jal-sol" || parsed.selectedPath === "solana"
          ? parsed.selectedPath
          : "",
      selectedTheme:
        parsed.selectedTheme === "default" ||
        parsed.selectedTheme === "emerald" ||
        parsed.selectedTheme === "violet" ||
        parsed.selectedTheme === "gold"
          ? parsed.selectedTheme
          : "",
      responsibilityAccepted: Boolean(parsed.responsibilityAccepted),
      navUnlocked: Boolean(parsed.navUnlocked),
      completedAt:
        typeof parsed.completedAt === "number" ? parsed.completedAt : null,
    };
  } catch {
    return DEFAULT_GATE3_STATE;
  }
}

function writeGate3State(state: Gate3BuilderState, storageScope?: string | null) {
  localStorage.setItem(
    getScopedStorageKey(GATE3_STATE_KEY, storageScope),
    JSON.stringify(state)
  );
}

function sanitizeTokenSymbol(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function getCardTone(unlocked: boolean) {
  return unlocked ? "jal-cred-ok" : "jal-cred-bad";
}

function shortenAddress(value: string, left = 6, right = 6) {
  if (!value || value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function getNavUnlocked(state: Gate3BuilderState, id: Gate3NavId) {
  if (id === "initialise") return true;
  if (!state.navUnlocked) return false;
  if (id === "vault") return false;
  return true;
}

export default function JalSolBuild() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const { isEngineer, profile } = useAuth();
  const storageScope = profile?.id;

  const [loading, setLoading] = useState(false);
  const [handover, setHandover] = useState<Gate3ProfileHandover | null>(null);
  const [builderState, setBuilderState] =
    useState<Gate3BuilderState>(DEFAULT_GATE3_STATE);
  const [showInitOverlay, setShowInitOverlay] = useState(false);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    const saved = readGate3State(storageScope);
    const handoverRaw = readGate3ProfileHandover(storageScope);

    setBuilderState(saved);
    setHandover(handoverRaw);
  }, [storageScope]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

  function patchBuilderState(
    recipe: (prev: Gate3BuilderState) => Gate3BuilderState
  ) {
    setBuilderState((prev) => {
      const next = recipe(prev);
      writeGate3State(next, storageScope);
      return next;
    });
  }

  useEffect(() => {
    if (!handover) return;

    patchBuilderState((prev) => {
      const derivedTokenSymbol =
        prev.tokenSymbol || handover.identity.tokenSymbol || "";
      const derivedProjectName =
        prev.projectName || handover.identity.projectName || "";
      const derivedBuilderName =
        prev.builderName || handover.identity.displayName || "";
      const derivedEmail = prev.email || handover.identity.email || "";
      const derivedSlotLabel =
        prev.slotLabel !== "JAL/SOL"
          ? prev.slotLabel
          : derivedTokenSymbol || "JAL/SOL";

      return {
        ...prev,
        tokenSymbol: derivedTokenSymbol,
        projectName: derivedProjectName,
        builderName: derivedBuilderName,
        email: derivedEmail,
        slotLabel: derivedSlotLabel,
      };
    });
  }, [handover]);

  useEffect(() => {
    if (!profile) return;

    patchBuilderState((prev) => ({
      ...prev,
      builderName: prev.builderName || profile.display_name || "",
      email: prev.email || profile.email || "",
    }));
  }, [profile]);

  function beginRoute(to: RouteTo) {
    if (loading) return;

    setLoading(true);
    document.body.style.pointerEvents = "none";

    timerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(to);
      document.body.style.pointerEvents = "";
    }, 1200);
  }

  function openBuilderHub() {
    patchBuilderState((prev) => ({
      ...prev,
      stage: "hub",
    }));
  }

  function initialiseGate3() {
    if (!isEngineer && !handover?.completion?.buildReady) {
      setInitError("Gate 03 requires verified Gate 02 completion first.");
      return;
    }

    if (!builderState.builderName.trim()) {
      setInitError("Builder name is required.");
      return;
    }

    if (!builderState.email.trim()) {
      setInitError("Email is required.");
      return;
    }

    if (!builderState.projectName.trim()) {
      setInitError("Project name is required.");
      return;
    }

    if (!builderState.tokenSymbol.trim()) {
      setInitError("Token symbol is required.");
      return;
    }

    if (!builderState.selectedPath) {
      setInitError("Select a creation path.");
      return;
    }

    if (!builderState.selectedTheme) {
      setInitError("Select a theme starter.");
      return;
    }

    if (!builderState.responsibilityAccepted) {
      setInitError("You must accept builder responsibility.");
      return;
    }

    patchBuilderState((prev) => ({
      ...prev,
      initialised: true,
      navUnlocked: true,
      stage: "hub",
      slotLabel: prev.tokenSymbol.trim() || "JAL/SOL",
      completedAt: prev.completedAt ?? Date.now(),
    }));

    setInitError("");
    setShowInitOverlay(false);
  }

  const builderReadyFromGate2 = isEngineer || Boolean(handover?.completion?.buildReady);
  const participantName =
    builderState.builderName || handover?.identity.displayName || profile?.display_name || "Participant";
  const participantEmail =
    builderState.email || handover?.identity.email || profile?.email || "Missing";
  const participantWallet = handover?.wallet.address || "";
  const participantProjectName =
    builderState.projectName || handover?.identity.projectName || "Missing";
  const participantSymbol =
    builderState.tokenSymbol || handover?.identity.tokenSymbol || "JAL/SOL";

  const statusLabel = builderState.initialised
    ? "Builder Hub Active"
    : "Empty Slot";
  const slotDisplay = builderState.initialised
    ? builderState.slotLabel
    : "JAL/SOL";

  const unlockedCount = useMemo(() => {
    return GATE3_NAV.filter((item) => getNavUnlocked(builderState, item.id))
      .length;
  }, [builderState]);

  const totalNavCount = GATE3_NAV.length;

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${
        loading ? "is-fading" : ""
      }`}
      aria-label="JAL/SOL Build Gate"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          {builderState.stage === "landing" && (
            <section
              className="jal-hero jal-world-hero"
              aria-label="Gate 03 landing"
            >
              <div className="jal-hero-top">
                <div className="jal-kicker">JAL/SOL • GATE 03</div>

                <div className="jal-status" aria-label="Gate 03 state">
                  <span className="jal-status-dot" />
                  <span className="jal-status-text">
                    {builderReadyFromGate2
                      ? statusLabel
                      : "Entry Verification Required"}
                  </span>
                </div>
              </div>

              <div className="jal-hero-center">
                <p className="jal-world-pretitle">Builder chamber</p>

                <h1 className="home-title">
                  Enter the empty slot.
                  <br />
                  Assign authorship.
                </h1>

                <p className="home-lead">
                  Gate 03 is no longer about proving that you can participate.
                  It is where participation turns into ownership, identity, and
                  authored direction.
                </p>

                <p className="jal-sublead">
                  The slot begins as JAL/SOL. After initialisation, this slot
                  takes the chosen builder symbol and becomes the beginning of a
                  custom system shell.
                </p>

                <div className="jal-bay jal-bay-wide" aria-label="Builder slot">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Builder Slot</div>
                    <div className="jal-bay-note">
                      {builderState.initialised ? "Assigned" : "Unassigned"}
                    </div>
                  </div>

                  <div className="jal-bay-actions jal-bay-actions-center">
                    <button
                      type="button"
                      className="button gold"
                      onClick={() => {
                        if (!builderReadyFromGate2) return;
                        if (builderState.initialised) {
                          openBuilderHub();
                          return;
                        }
                        setShowInitOverlay(true);
                        setInitError("");
                      }}
                      disabled={!builderReadyFromGate2 || loading}
                      style={{
                        minWidth: 320,
                        minHeight: 112,
                        fontSize: "2rem",
                        letterSpacing: "0.14em",
                      }}
                    >
                      {slotDisplay}
                    </button>
                  </div>

                  <p className="jal-note jal-center-text">
                    {builderReadyFromGate2
                      ? builderState.initialised
                        ? "Builder slot assigned. Enter Gate 03 nav."
                        : "This slot is waiting for builder initialisation."
                      : "Gate 03 remains locked until Gate 02 participant proof is complete."}
                  </p>
                </div>
              </div>

              <div className="jal-arrival-note" aria-label="Build principles">
                <span>EMPTY SLOT → ASSIGNED SYMBOL</span>
                <span>PARTICIPATION → AUTHORSHIP</span>
                <span>OWNERSHIP BEFORE EXECUTION</span>
              </div>

              <div className="jal-links">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => {
                    if (!builderReadyFromGate2) {
                      beginRoute("/app/jal-sol/enter");
                      return;
                    }

                    if (builderState.initialised) {
                      openBuilderHub();
                      return;
                    }

                    setShowInitOverlay(true);
                    setInitError("");
                  }}
                  disabled={loading}
                >
                  {builderReadyFromGate2
                    ? builderState.initialised
                      ? "Open Gate 03 Nav"
                      : "Initialise Gate 03"
                    : "Return To Enter"}
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/engine")}
                  disabled={loading}
                >
                  View Engine Layer
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/jal-sol")}
                  disabled={loading}
                >
                  Return To World Hub
                </button>
              </div>
            </section>
          )}

          {builderState.stage === "hub" && (
            <>
              <section
                className="jal-stage-bar"
                aria-label="Gate 03 current state"
              >
                <div className="jal-stage-bar-left">
                  <span>JAL/SOL • Gate 03</span>
                  <strong>
                    {builderState.initialised ? "Builder Hub" : "Initialise"}
                  </strong>
                </div>

                <div className="jal-stage-bar-right">
                  <span className="jal-status-dot" />
                  <span>
                    {builderState.initialised
                      ? "Builder State Active"
                      : "Locked"}
                  </span>
                </div>
              </section>

              <section
                className="jal-bay jal-bay-wide"
                aria-label="Gate 03 hub summary"
              >
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Gate 03 Nav</div>
                  <div className="jal-bay-note">
                    {unlockedCount} / {totalNavCount} visible builder systems
                  </div>
                </div>

                <div className="jal-bullets">
                  <article
                    className={`jal-bullet ${getCardTone(
                      builderState.initialised
                    )}`}
                  >
                    <div className="jal-bullet-k">Slot</div>
                    <div className="jal-bullet-v">{slotDisplay}</div>
                  </article>

                  <article
                    className={`jal-bullet ${getCardTone(
                      builderReadyFromGate2
                    )}`}
                  >
                    <div className="jal-bullet-k">Gate 02 Handover</div>
                    <div className="jal-bullet-v">
                      {builderReadyFromGate2
                        ? isEngineer && !handover?.completion?.buildReady
                          ? "Engineer Access"
                          : "Verified"
                        : "Missing"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${getCardTone(
                      builderState.navUnlocked
                    )}`}
                  >
                    <div className="jal-bullet-k">Builder Nav</div>
                    <div className="jal-bullet-v">
                      {builderState.navUnlocked ? "Unlocked" : "Locked"}
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Current Builder</div>
                    <div className="jal-bullet-v">{participantName}</div>
                  </article>
                </div>
              </section>

              <section className="jal-grid" aria-label="Gate 03 nav cards">
                {GATE3_NAV.map((item) => {
                  const unlocked = getNavUnlocked(builderState, item.id);

                  return (
                    <section
                      key={item.id}
                      className={`jal-bay ${getCardTone(unlocked)}`}
                      aria-label={item.title}
                    >
                      <div className="jal-bay-head">
                        <div className="jal-bay-title">{item.title}</div>
                        <div className="jal-bay-note">
                          {unlocked ? "Unlocked" : "Locked"}
                        </div>
                      </div>

                      <p className="jal-note">{item.note}</p>
                      <p className="jal-lock-text">{item.requirement}</p>

                      <div className="jal-bay-actions">
                        {item.id === "initialise" ? (
                          <button
                            type="button"
                            className="button gold"
                            onClick={() => {
                              if (builderState.initialised) return;
                              setShowInitOverlay(true);
                              setInitError("");
                            }}
                            disabled={
                              builderState.initialised ||
                              !builderReadyFromGate2 ||
                              loading
                            }
                          >
                            {builderState.initialised
                              ? "Initialised"
                              : "Open Initialisation"}
                          </button>
                        ) : item.id === "token-forge" ? (
                          <button
                            type="button"
                            className="button gold"
                            onClick={() => beginRoute("/app/token")}
                            disabled={!unlocked || loading}
                          >
                            Open Token Forge
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button ghost"
                            disabled
                          >
                            Locked
                          </button>
                        )}
                      </div>
                    </section>
                  );
                })}
              </section>

              <section className="jal-grid" aria-label="Gate 03 live detail">
                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Profile</div>
                    <div className="jal-bay-note">Inherited + assigned</div>
                  </div>

                  <div className="jal-bullets">
                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Builder Name</div>
                      <div className="jal-bullet-v">{participantName}</div>
                    </article>

                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Email</div>
                      <div className="jal-bullet-v">{participantEmail}</div>
                    </article>

                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Project Name</div>
                      <div className="jal-bullet-v">{participantProjectName}</div>
                    </article>

                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Token Symbol</div>
                      <div className="jal-bullet-v">{participantSymbol}</div>
                    </article>
                  </div>
                </section>

                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Builder Dashboard</div>
                    <div className="jal-bay-note">Immediate output</div>
                  </div>

                  <div className="jal-bullets">
                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Wallet</div>
                      <div className="jal-bullet-v">
                        {participantWallet
                          ? shortenAddress(participantWallet)
                          : "Missing"}
                      </div>
                    </article>

                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Path</div>
                      <div className="jal-bullet-v">
                        {builderState.selectedPath || "Unchosen"}
                      </div>
                    </article>

                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Theme</div>
                      <div className="jal-bullet-v">
                        {builderState.selectedTheme || "Unchosen"}
                      </div>
                    </article>

                    <article className="jal-bullet">
                      <div className="jal-bullet-k">Publish Readiness</div>
                      <div className="jal-bullet-v">
                        {builderState.initialised
                          ? "Builder shell active"
                          : "Not ready"}
                      </div>
                    </article>
                  </div>
                </section>
              </section>

              <section
                className="jal-bay jal-bay-wide"
                aria-label="Gate 03 actions"
              >
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Builder Actions</div>
                  <div className="jal-bay-note">Current working routes</div>
                </div>

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className="button gold"
                    onClick={() => beginRoute("/app/token")}
                    disabled={!builderState.initialised || loading}
                  >
                    Open Token Forge
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={() =>
                      patchBuilderState((prev) => ({
                        ...prev,
                        stage: "landing",
                      }))
                    }
                    disabled={loading}
                  >
                    Return To Gate 03 Landing
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => beginRoute("/app/jal-sol/enter")}
                    disabled={loading}
                  >
                    Return To Enter
                  </button>
                </div>
              </section>
            </>
          )}
        </section>
      </div>

      {showInitOverlay && (
        <div
          className="jal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Gate 03 initialise"
        >
          <div
            className="jal-overlay-backdrop"
            onClick={() => {
              setShowInitOverlay(false);
              setInitError("");
            }}
          />

          <section className="jal-overlay-panel jal-bay jal-bay-wide">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Gate 03 Initialisation</div>
              <div className="jal-bay-note">Assign the empty slot</div>
            </div>

            <p className="jal-note jal-center-text">
              This is the first builder action. The slot begins as JAL/SOL and
              becomes yours only after project identity, path, and
              responsibility are assigned.
            </p>

            <div className="jal-grid">
              <section className="jal-bay">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Builder Shell</div>
                  <div className="jal-bay-note">Required now</div>
                </div>

                <label className="jal-field">
                  <span className="jal-field-label">Builder name</span>
                  <input
                    className="jal-input"
                    type="text"
                    value={builderState.builderName}
                    onChange={(e) =>
                      patchBuilderState((prev) => ({
                        ...prev,
                        builderName: e.target.value,
                      }))
                    }
                    placeholder="Builder name"
                  />
                </label>

                <label className="jal-field">
                  <span className="jal-field-label">Email</span>
                  <input
                    className="jal-input"
                    type="email"
                    value={builderState.email}
                    onChange={(e) =>
                      patchBuilderState((prev) => ({
                        ...prev,
                        email: e.target.value.trim(),
                      }))
                    }
                    placeholder="builder@email.com"
                  />
                </label>

                <label className="jal-field">
                  <span className="jal-field-label">Project name</span>
                  <input
                    className="jal-input"
                    type="text"
                    value={builderState.projectName}
                    onChange={(e) =>
                      patchBuilderState((prev) => ({
                        ...prev,
                        projectName: e.target.value,
                      }))
                    }
                    placeholder="Your authored system name"
                  />
                </label>

                <label className="jal-field">
                  <span className="jal-field-label">Token symbol</span>
                  <input
                    className="jal-input"
                    type="text"
                    value={builderState.tokenSymbol}
                    onChange={(e) =>
                      patchBuilderState((prev) => {
                        const nextSymbol = sanitizeTokenSymbol(e.target.value);

                        return {
                          ...prev,
                          tokenSymbol: nextSymbol,
                          slotLabel: nextSymbol || "JAL/SOL",
                        };
                      })
                    }
                    placeholder="JAL"
                  />
                </label>

                <div className="jal-field">
                  <span className="jal-field-label">Creation path</span>
                  <div className="jal-bay-actions">
                    <button
                      type="button"
                      className={`button ${
                        builderState.selectedPath === "jal-sol"
                          ? "gold"
                          : "ghost"
                      }`}
                      onClick={() =>
                        patchBuilderState((prev) => ({
                          ...prev,
                          selectedPath: "jal-sol",
                        }))
                      }
                    >
                      JAL/SOL Path
                    </button>

                    <button
                      type="button"
                      className={`button ${
                        builderState.selectedPath === "solana"
                          ? "gold"
                          : "ghost"
                      }`}
                      onClick={() =>
                        patchBuilderState((prev) => ({
                          ...prev,
                          selectedPath: "solana",
                        }))
                      }
                    >
                      Solana Path
                    </button>
                  </div>
                </div>

                <div className="jal-field">
                  <span className="jal-field-label">Theme starter</span>
                  <div className="jal-bay-actions">
                    {(
                      ["default", "emerald", "violet", "gold"] as Gate3Theme[]
                    ).map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        className={`button ${
                          builderState.selectedTheme === theme
                            ? "gold"
                            : "ghost"
                        }`}
                        onClick={() =>
                          patchBuilderState((prev) => ({
                            ...prev,
                            selectedTheme: theme,
                          }))
                        }
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="jal-check">
                  <input
                    type="checkbox"
                    checked={builderState.responsibilityAccepted}
                    onChange={(e) =>
                      patchBuilderState((prev) => ({
                        ...prev,
                        responsibilityAccepted: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    I understand Gate 03 shifts me from participant into
                    builder, and this slot now carries authored direction and
                    responsibility.
                  </span>
                </label>
              </section>

              <section className="jal-bay">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Incoming Gate 02 Proof</div>
                  <div className="jal-bay-note">Inherited foundation</div>
                </div>

                <div className="jal-bullets">
                  <article
                    className={`jal-bullet ${getCardTone(
                      builderReadyFromGate2
                    )}`}
                  >
                    <div className="jal-bullet-k">Gate 02 Build Ready</div>
                    <div className="jal-bullet-v">
                      {builderReadyFromGate2
                        ? isEngineer && !handover?.completion?.buildReady
                          ? "Engineer Access"
                          : "Verified"
                        : "Locked"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${getCardTone(
                      Boolean(handover?.wallet.address)
                    )}`}
                  >
                    <div className="jal-bullet-k">Wallet</div>
                    <div className="jal-bullet-v">
                      {handover?.wallet.address
                        ? shortenAddress(handover.wallet.address)
                        : "Missing"}
                    </div>
                  </article>

                  <article
                    className={`jal-bullet ${getCardTone(
                      Boolean(handover?.transaction.confirmed)
                    )}`}
                  >
                    <div className="jal-bullet-k">Explorer Proof</div>
                    <div className="jal-bullet-v">
                      {handover?.transaction.confirmed ? "Confirmed" : "Missing"}
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Assigned Slot Preview</div>
                    <div className="jal-bullet-v">
                      {builderState.tokenSymbol || "JAL/SOL"}
                    </div>
                  </article>
                </div>
              </section>
            </div>

            {initError ? <p className="jal-error-text">{initError}</p> : null}

            <div className="jal-bay-actions jal-bay-actions-center">
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setShowInitOverlay(false);
                  setInitError("");
                }}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button gold"
                onClick={initialiseGate3}
                disabled={loading}
              >
                Assign Builder Slot
              </button>
            </div>
          </section>
        </div>
      )}

      {loading && (
        <div
          className="loading-screen"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}
