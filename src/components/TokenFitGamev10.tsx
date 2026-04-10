import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getScopedStorageKey } from "../utils/scopedStorage";

export type TokenFitGameV10Props = {
  mode?: "trial" | "endless";
  minScore?: number;
  storageScope?: string;
  onRunComplete: (payload: { score: number; mode: "trial" | "endless" }) => void;
  onLeave?: () => void;
};

type TokenFitState = "idle" | "countdown" | "playing" | "gameover" | "passed";
type ViewMode = "portrait" | "landscape";

type Pipe = {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
};

const STORAGE_KEY_TRIAL = "jal_gate2_token_fit_v10_high_score_trial";
const STORAGE_KEY_ENDLESS = "jal_gate2_token_fit_v10_high_score_endless";

/* =========================
   WORLD SIZING
========================= */
const LANDSCAPE_WORLD_WIDTH = 960;
const LANDSCAPE_WORLD_HEIGHT = 540;

const PORTRAIT_WORLD_WIDTH = 420;
const PORTRAIT_WORLD_HEIGHT = 820;

const TOKEN_SIZE = 42;

/* =========================
   TUNING
========================= */
const GRAVITY = 0.34;
const JUMP_FORCE = -5.9;
const PIPE_SPAWN_EVERY = 1500;
const COUNTDOWN_SECONDS = 3;

/* =========================
   RENDER / PERF
========================= */
const MAX_DELTA_MS = 32;
const MIN_DELTA_MS = 8;
const RENDER_INTERVAL_MS = 1000 / 30;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getStorageKey(mode: "trial" | "endless", storageScope?: string) {
  return getScopedStorageKey(
    mode === "trial" ? STORAGE_KEY_TRIAL : STORAGE_KEY_ENDLESS,
    storageScope
  );
}

function loadHighScore(mode: "trial" | "endless", storageScope?: string) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(getStorageKey(mode, storageScope));
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function saveHighScore(mode: "trial" | "endless", score: number, storageScope?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(mode, storageScope), String(score));
}

function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: LANDSCAPE_WORLD_WIDTH, height: LANDSCAPE_WORLD_HEIGHT };
  }

  const vv = window.visualViewport;

  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}

export default function TokenFitGameV10({
  mode = "trial",
  minScore = 20,
  storageScope,
  onRunComplete,
  onLeave,
}: TokenFitGameV10Props) {
  const isTrialMode = mode === "trial";

  const [gameState, setGameState] = useState<TokenFitState>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadHighScore(mode, storageScope));

  const [viewMode, setViewMode] = useState<ViewMode>("landscape");
  const [sceneScale, setSceneScale] = useState(1);
  const [sceneWidth, setSceneWidth] = useState(LANDSCAPE_WORLD_WIDTH);
  const [sceneHeight, setSceneHeight] = useState(LANDSCAPE_WORLD_HEIGHT);

  const initialPortraitY = PORTRAIT_WORLD_HEIGHT / 2 - TOKEN_SIZE / 2;
  const [tokenY, setTokenY] = useState(initialPortraitY);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef(0);
  const nextPipeIdRef = useRef(1);
  const lastRenderRef = useRef(0);

  const scoreRef = useRef(0);
  const gameStateRef = useRef<TokenFitState>("idle");
  const tokenYRef = useRef(initialPortraitY);
  const velocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);

  const scrollLockRef = useRef<{
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    bodyWidth: string;
    bodyOverflow: string;
    htmlOverflow: string;
    scrollY: number;
  } | null>(null);

  useEffect(() => {
    setHighScore(loadHighScore(mode, storageScope));
  }, [mode, storageScope]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    tokenYRef.current = tokenY;
  }, [tokenY]);

  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  const isPortrait = viewMode === "portrait";

  const worldWidth = isPortrait ? PORTRAIT_WORLD_WIDTH : LANDSCAPE_WORLD_WIDTH;
  const worldHeight = isPortrait ? PORTRAIT_WORLD_HEIGHT : LANDSCAPE_WORLD_HEIGHT;

  const tokenX = isPortrait ? 104 : 180;
  const pipeWidth = isPortrait ? 78 : 96;
  const pipeGap = isPortrait ? 220 : 190;
  const pipeSpeed = isPortrait ? 2.6 : 2.3;

  const floorHeight = isPortrait ? 110 : 74;
  const ceilingHeight = isPortrait ? 24 : 18;

  const hintBottom = isPortrait ? 140 : 98;
  const liftButtonRight = 20;
  const liftButtonBottom = 148;
  const liftButtonSize = 88;

  const syncVisualState = useCallback(() => {
    setVelocity(velocityRef.current);
    setTokenY(tokenYRef.current);
    setPipes([...pipesRef.current]);
    setScore(scoreRef.current);
  }, []);

  const resetWorld = useCallback(() => {
    const startY = worldHeight / 2 - TOKEN_SIZE / 2;

    scoreRef.current = 0;
    velocityRef.current = 0;
    tokenYRef.current = startY;
    pipesRef.current = [];

    setScore(0);
    setVelocity(0);
    setTokenY(startY);
    setPipes([]);

    setCountdown(COUNTDOWN_SECONDS);

    lastFrameRef.current = null;
    spawnTimerRef.current = 0;
    nextPipeIdRef.current = 1;
    lastRenderRef.current = 0;
  }, [worldHeight]);

  const endGame = useCallback(
    (nextState: "gameover" | "passed") => {
      const current = gameStateRef.current;
      if (current === "gameover" || current === "passed") return;

      const finalScore = scoreRef.current;
      const nextHighScore = Math.max(highScore, finalScore);

      if (nextHighScore !== highScore) {
        setHighScore(nextHighScore);
        saveHighScore(mode, nextHighScore, storageScope);
      }

      setGameState(nextState);
      gameStateRef.current = nextState;

      syncVisualState();

      if (nextState === "passed") {
        onRunComplete({ score: finalScore, mode });
      }
    },
    [highScore, mode, onRunComplete, storageScope, syncVisualState]
  );

  const flap = useCallback(() => {
    const current = gameStateRef.current;

    if (current === "idle" || current === "countdown") return;

    if (current === "gameover" || current === "passed") {
      resetWorld();
      setGameState("countdown");
      gameStateRef.current = "countdown";
      return;
    }

    velocityRef.current = JUMP_FORCE;
    setVelocity(JUMP_FORCE);
  }, [resetWorld]);

  const beginPlaying = useCallback(() => {
    resetWorld();
    setIsFullscreen(true);
    setGameState("countdown");
    gameStateRef.current = "countdown";
  }, [resetWorld]);

  const closeTrial = useCallback(() => {
    setIsFullscreen(false);
    setGameState("idle");
    gameStateRef.current = "idle";
    resetWorld();
  }, [resetWorld]);

  const leaveTrial = useCallback(() => {
    setIsFullscreen(false);
    setGameState("idle");
    gameStateRef.current = "idle";
    resetWorld();
    onLeave?.();
  }, [onLeave, resetWorld]);

  useEffect(() => {
    if (!isFullscreen || typeof document === "undefined" || typeof window === "undefined") return;

    const scrollY = window.scrollY;

    scrollLockRef.current = {
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      scrollY,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      const prev = scrollLockRef.current;
      if (!prev) return;

      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.left = prev.bodyLeft;
      document.body.style.right = prev.bodyRight;
      document.body.style.width = prev.bodyWidth;

      window.scrollTo(0, prev.scrollY);
      scrollLockRef.current = null;
    };
  }, [isFullscreen]);

  useEffect(() => {
    let raf: number | null = null;

    function updateSceneScale() {
      const { width: viewportWidth, height: viewportHeight } = getViewportSize();

      const nextMode: ViewMode = viewportHeight > viewportWidth ? "portrait" : "landscape";
      const nextWorldWidth =
        nextMode === "portrait" ? PORTRAIT_WORLD_WIDTH : LANDSCAPE_WORLD_WIDTH;
      const nextWorldHeight =
        nextMode === "portrait" ? PORTRAIT_WORLD_HEIGHT : LANDSCAPE_WORLD_HEIGHT;

      const availableWidth = Math.max(280, viewportWidth);
      const availableHeight = Math.max(320, viewportHeight);

      const scaleX = availableWidth / nextWorldWidth;
      const scaleY = availableHeight / nextWorldHeight;
      const nextScale = Math.min(scaleX, scaleY);

      setViewMode(nextMode);
      setSceneScale(nextScale);
      setSceneWidth(Math.round(nextWorldWidth * nextScale));
      setSceneHeight(Math.round(nextWorldHeight * nextScale));
    }

    function requestScaleUpdate() {
      if (raf != null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateSceneScale);
    }

    requestScaleUpdate();

    const vv = window.visualViewport;
    window.addEventListener("resize", requestScaleUpdate);
    window.addEventListener("orientationchange", requestScaleUpdate);
    vv?.addEventListener("resize", requestScaleUpdate);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", requestScaleUpdate);
      window.removeEventListener("orientationchange", requestScaleUpdate);
      vv?.removeEventListener("resize", requestScaleUpdate);
    };
  }, []);

  useEffect(() => {
    if (gameState !== "countdown") return;

    if (countdown <= 0) {
      setGameState("playing");
      gameStateRef.current = "playing";
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, gameState]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space") {
        event.preventDefault();
        flap();
      }

      if (event.code === "Escape" && isFullscreen) {
        event.preventDefault();
        closeTrial();
      }
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeTrial, flap, isFullscreen]);

  const showCompactEntry = gameState === "idle";

  useEffect(() => {
    if (gameState !== "playing") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const topBound = ceilingHeight;
    const bottomBound = worldHeight - floorHeight - TOKEN_SIZE;

    const gapPaddingTop = isPortrait ? 110 : 76;
    const gapPaddingBottom = isPortrait ? 150 : 104;
    const minGapY = gapPaddingTop + pipeGap / 2;
    const maxGapY = worldHeight - floorHeight - gapPaddingBottom - pipeGap / 2;

    const tick = (now: number) => {
      if (gameStateRef.current !== "playing") return;

      if (lastFrameRef.current == null) {
        lastFrameRef.current = now;
      }

      const rawDelta = now - lastFrameRef.current;
      const deltaMs = clamp(rawDelta, MIN_DELTA_MS, MAX_DELTA_MS);
      lastFrameRef.current = now;

      const frameScale = deltaMs / 16.6667;

      const nextVelocity = velocityRef.current + GRAVITY * frameScale;
      let nextY = tokenYRef.current + nextVelocity * frameScale;

      if (nextY <= topBound) {
        nextY = topBound;
        velocityRef.current = nextVelocity;
        tokenYRef.current = nextY;
        endGame("gameover");
        return;
      }

      if (nextY >= bottomBound) {
        nextY = bottomBound;
        velocityRef.current = nextVelocity;
        tokenYRef.current = nextY;
        endGame("gameover");
        return;
      }

      velocityRef.current = nextVelocity;
      tokenYRef.current = nextY;

      spawnTimerRef.current += deltaMs;

      while (spawnTimerRef.current >= PIPE_SPAWN_EVERY) {
        spawnTimerRef.current -= PIPE_SPAWN_EVERY;

        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

        pipesRef.current.push({
          id: nextPipeIdRef.current++,
          x: worldWidth + 40,
          gapY,
          scored: false,
        });
      }

      const tokenLeft = tokenX;
      const tokenRight = tokenX + TOKEN_SIZE;
      const tokenTop = tokenYRef.current;
      const tokenBottom = tokenYRef.current + TOKEN_SIZE;

      const nextPipes: Pipe[] = [];

      for (const pipe of pipesRef.current) {
        const nextX = pipe.x - pipeSpeed * frameScale;

        if (nextX + pipeWidth <= -60) continue;

        let nextPipe = pipe;
        if (nextX !== pipe.x) {
          nextPipe = { ...nextPipe, x: nextX };
        }

        if (!nextPipe.scored && nextX + pipeWidth < tokenX) {
          nextPipe = { ...nextPipe, scored: true };
          scoreRef.current += 1;

          if (isTrialMode && scoreRef.current >= minScore) {
            nextPipes.push(nextPipe);
            pipesRef.current = nextPipes;
            endGame("passed");
            return;
          }
        }

        const pipeLeft = nextX;
        const pipeRight = nextX + pipeWidth;
        const withinX = tokenRight > pipeLeft && tokenLeft < pipeRight;

        if (withinX) {
          const gapTop = nextPipe.gapY - pipeGap / 2;
          const gapBottom = nextPipe.gapY + pipeGap / 2;

          if (tokenTop < gapTop || tokenBottom > gapBottom) {
            nextPipes.push(nextPipe);
            pipesRef.current = nextPipes;
            endGame("gameover");
            return;
          }
        }

        nextPipes.push(nextPipe);
      }

      pipesRef.current = nextPipes;

      const nowRender = performance.now();
      if (nowRender - lastRenderRef.current >= RENDER_INTERVAL_MS) {
        lastRenderRef.current = nowRender;
        syncVisualState();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    ceilingHeight,
    endGame,
    floorHeight,
    gameState,
    isPortrait,
    isTrialMode,
    minScore,
    pipeGap,
    pipeSpeed,
    pipeWidth,
    syncVisualState,
    tokenX,
    worldHeight,
    worldWidth,
  ]);

  const statusText = useMemo(() => {
    if (gameState === "passed") {
      return isTrialMode ? "Trial Complete" : "Run Complete";
    }
    if (gameState === "gameover") return "Trial Failed";
    if (gameState === "countdown") return "Prepare";
    if (gameState === "playing") return "In Motion";
    return isTrialMode ? "Trial Available" : "Endless Available";
  }, [gameState, isTrialMode]);

  const tokenRotation = clamp(velocity * 4.5, -28, 60);

  const isSmallViewport = sceneScale < 0.72;
  const hudTop = isSmallViewport ? 12 : 22;
  const hudSide = isSmallViewport ? 12 : 24;
  const hudGap = isSmallViewport ? 6 : 10;
  const hudPad = isSmallViewport ? "7px 9px" : "10px 14px";
  const hudFont = isSmallViewport ? 11 : 14;
  const hudStatWidth = isSmallViewport ? 70 : 102;
  const hudStatValue = isSmallViewport ? 16 : 24;
  const overlayCardWidth = isSmallViewport ? "92%" : 420;

  const scenePress = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) return;

    event.preventDefault();
    event.stopPropagation();
    flap();
  };

  const gameView = (
    <div className="jal-tokenfit-shell" aria-label="JAL/SOL onboarding readiness trial">
      {!isFullscreen && (
        <div className="jal-tokenfit-inline-head">
          <div className="jal-bay-head">
            <div className="jal-bay-title">
              {isTrialMode ? "Onboarding Readiness Trial" : "Onboarding Readiness Endless"}
            </div>
            <div className="jal-bay-note">{statusText}</div>
          </div>

          <p className="jal-note">
            Keep the token stable under movement. Tap the screen or press Space to lift.
            {isTrialMode ? (
              <>
                {" "}
                Reach at least <strong>{minScore}</strong> points to complete this trial run.
              </>
            ) : (
              <> Endless mode has no pass threshold. Push for a higher score.</>
            )}
          </p>
        </div>
      )}

      <div className={isFullscreen ? "jal-tokenfit-fullscreen" : "jal-tokenfit-stage-wrap"}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Token Fit play area"
          onPointerDown={scenePress}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              flap();
            }
          }}
          className="jal-tokenfit-scene-frame"
          style={
            isFullscreen
              ? {
                  width: "100vw",
                  height: "100dvh",
                }
              : {
                  width: `${sceneWidth}px`,
                  height: `${sceneHeight}px`,
                }
          }
        >
          <div
            style={{
              position: "absolute",
              left: isFullscreen ? "50%" : 0,
              top: isFullscreen ? "50%" : 0,
              width: `${worldWidth}px`,
              height: `${worldHeight}px`,
              transform: isFullscreen
                ? `translate(-50%, -50%) scale(${sceneScale})`
                : `scale(${sceneScale})`,
              transformOrigin: isFullscreen ? "center center" : "top left",
              overflow: "hidden",
              borderRadius: isFullscreen ? "0px" : "28px",
              border: isFullscreen ? "none" : "1px solid rgba(255,255,255,0.12)",
              background:
                "radial-gradient(circle at 50% 35%, rgba(0,255,180,0.08), rgba(4,9,18,0.96) 55%, rgba(2,6,14,1) 100%)",
              boxShadow: isFullscreen
                ? "none"
                : "inset 0 0 0 1px rgba(0,255,180,0.06), 0 0 24px rgba(0,255,180,0.10)",
              willChange: "transform",
              contain: "layout paint style",
              backfaceVisibility: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 22%, rgba(0,255,180,0.03) 70%, rgba(0,0,0,0.18) 100%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: hudSide,
                top: hudTop,
                display: "flex",
                gap: hudGap,
                alignItems: "center",
                zIndex: 5,
                maxWidth: `calc(100% - ${hudSide * 2}px - ${hudStatWidth * 2 + hudGap * 3}px)`,
              }}
            >
              <div
                style={{
                  padding: hudPad,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(5,14,22,0.72)",
                  color: "#f6fffb",
                  fontSize: hudFont,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                JAL/SOL Onboarding
              </div>

              {!isSmallViewport && (
                <div
                  style={{
                    padding: hudPad,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(5,14,22,0.72)",
                    color: "#c7fce8",
                    fontSize: hudFont,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isTrialMode ? "Token Fit Trial" : "Token Fit Endless"}
                </div>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                right: hudSide,
                top: hudTop,
                display: "flex",
                gap: hudGap,
                alignItems: "stretch",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  minWidth: hudStatWidth,
                  padding: hudPad,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(5,14,22,0.72)",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.7,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Score
                </div>
                <div style={{ fontSize: hudStatValue, fontWeight: 700 }}>{score}</div>
              </div>

              <div
                style={{
                  minWidth: hudStatWidth,
                  padding: hudPad,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(5,14,22,0.72)",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.7,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Best
                </div>
                <div style={{ fontSize: hudStatValue, fontWeight: 700 }}>{highScore}</div>
              </div>

              {isFullscreen && (
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    closeTrial();
                  }}
                  style={{
                    padding: hudPad,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(8,18,28,0.82)",
                    color: "#ffffff",
                    fontSize: hudFont,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Exit
                </button>
              )}
            </div>

            {pipes.map((pipe) => {
              const topPipeHeight = pipe.gapY - pipeGap / 2;
              const bottomPipeY = pipe.gapY + pipeGap / 2;
              const bottomPipeHeight = worldHeight - floorHeight - bottomPipeY;

              return (
                <div key={pipe.id}>
                  <div
                    style={{
                      position: "absolute",
                      left: pipe.x,
                      top: 0,
                      width: pipeWidth,
                      height: topPipeHeight,
                      borderRadius: "0 0 20px 20px",
                      background:
                        "linear-gradient(180deg, rgba(0,255,180,0.16), rgba(0,255,180,0.08) 20%, rgba(10,24,24,0.92) 100%)",
                      border: "1px solid rgba(0,255,180,0.22)",
                      boxShadow: "0 0 18px rgba(0,255,180,0.09)",
                      willChange: "transform",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: pipe.x - 8,
                      top: topPipeHeight - 20,
                      width: pipeWidth + 16,
                      height: 20,
                      borderRadius: 12,
                      background: "rgba(0,255,180,0.16)",
                      border: "1px solid rgba(0,255,180,0.2)",
                      willChange: "transform",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: pipe.x,
                      top: bottomPipeY,
                      width: pipeWidth,
                      height: bottomPipeHeight,
                      borderRadius: "20px 20px 0 0",
                      background:
                        "linear-gradient(180deg, rgba(10,24,24,0.92), rgba(0,255,180,0.08) 80%, rgba(0,255,180,0.16) 100%)",
                      border: "1px solid rgba(0,255,180,0.22)",
                      boxShadow: "0 0 18px rgba(0,255,180,0.09)",
                      willChange: "transform",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: pipe.x - 8,
                      top: bottomPipeY,
                      width: pipeWidth + 16,
                      height: 20,
                      borderRadius: 12,
                      background: "rgba(0,255,180,0.16)",
                      border: "1px solid rgba(0,255,180,0.2)",
                      willChange: "transform",
                    }}
                  />
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: tokenX,
                top: tokenY,
                width: TOKEN_SIZE,
                height: TOKEN_SIZE,
                transform: `rotate(${tokenRotation}deg)`,
                transformOrigin: "center center",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.92), rgba(227,205,112,0.95) 20%, rgba(170,120,32,0.96) 58%, rgba(70,40,8,1) 100%)",
                boxShadow:
                  "0 0 22px rgba(255,208,92,0.45), inset 0 1px 5px rgba(255,255,255,0.42), inset 0 -4px 10px rgba(30,16,2,0.5)",
                zIndex: 4,
                willChange: "transform, top",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 7,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: floorHeight,
                height: 1,
                background: "rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: floorHeight,
                background:
                  "linear-gradient(180deg, rgba(13,22,18,0.96), rgba(7,13,10,1) 65%, rgba(3,6,5,1) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: ceilingHeight,
                background: "rgba(255,255,255,0.05)",
              }}
            />

            {gameState === "countdown" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(2,8,16,0.34)",
                  zIndex: 6,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: isSmallViewport ? "18px 22px" : "22px 30px",
                    borderRadius: 24,
                    background: "rgba(4,12,18,0.88)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 0 22px rgba(0,255,180,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      opacity: 0.72,
                      marginBottom: 10,
                      color: "#c7fce8",
                    }}
                  >
                    Prepare
                  </div>
                  <div
                    style={{
                      fontSize: isSmallViewport ? 56 : 72,
                      lineHeight: 1,
                      fontWeight: 800,
                      color: "#ffffff",
                    }}
                  >
                    {countdown}
                  </div>
                </div>
              </div>
            )}

            {(gameState === "gameover" || gameState === "passed") && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(2,8,16,0.44)",
                  zIndex: 6,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    width: overlayCardWidth,
                    maxWidth: "100%",
                    textAlign: "center",
                    padding: isSmallViewport ? "22px 18px" : "28px 26px",
                    borderRadius: 24,
                    background: "rgba(4,12,18,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 0 24px rgba(0,255,180,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      opacity: 0.72,
                      marginBottom: 10,
                      color: gameState === "passed" ? "#c7fce8" : "#ffd8d8",
                    }}
                  >
                    {gameState === "passed"
                      ? isTrialMode
                        ? "Trial Complete"
                        : "Run Complete"
                      : "Trial Failed"}
                  </div>

                  <div
                    style={{
                      fontSize: isSmallViewport ? 26 : 34,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: "#ffffff",
                      marginBottom: 12,
                    }}
                  >
                    {gameState === "passed"
                      ? isTrialMode
                        ? "Alignment confirmed."
                        : "Endless score recorded."
                      : "The token fell out of fit."}
                  </div>

                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    Score: <strong>{score}</strong>
                    {isTrialMode ? (
                      <>
                        {" "}
                        · Required: <strong>{minScore}</strong>
                      </>
                    ) : null}{" "}
                    · Best: <strong>{highScore}</strong>
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        resetWorld();
                        setGameState("countdown");
                        gameStateRef.current = "countdown";
                      }}
                      style={{
                        minWidth: isSmallViewport ? 120 : 140,
                        padding: "12px 18px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Retry
                    </button>

                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        leaveTrial();
                      }}
                      style={{
                        minWidth: isSmallViewport ? 120 : 140,
                        padding: "12px 18px",
                        borderRadius: 14,
                        border: "1px solid rgba(0,255,180,0.22)",
                        background: "rgba(0,255,180,0.08)",
                        color: "#d9fff1",
                        fontWeight: 700,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Leave Trial
                    </button>
                  </div>
                </div>
              </div>
            )}

            {gameState === "playing" && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: hintBottom,
                  transform: "translateX(-50%)",
                  padding: isSmallViewport ? "8px 12px" : "10px 16px",
                  borderRadius: 999,
                  background: "rgba(4,12,18,0.66)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: isSmallViewport ? 11 : 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  zIndex: 5,
                  whiteSpace: "nowrap",
                }}
              >
                {isPortrait ? "Tap screen or Lift button" : "Tap screen or press space"}
              </div>
            )}

            {gameState === "playing" && isPortrait && (
              <button
                type="button"
                onPointerDown={(event) => {
                  if (!event.isPrimary) return;
                  event.preventDefault();
                  event.stopPropagation();
                  flap();
                }}
                style={{
                  position: "absolute",
                  right: liftButtonRight,
                  bottom: liftButtonBottom,
                  width: liftButtonSize,
                  height: liftButtonSize,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,255,180,0.28)",
                  background: "rgba(0,255,180,0.10)",
                  color: "#d9fff1",
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  boxShadow: "0 0 24px rgba(0,255,180,0.12)",
                  zIndex: 7,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Lift
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (showCompactEntry) {
    return (
      <div className="jal-trial-entry" aria-label="JAL/SOL onboarding readiness trial">
        <div className="jal-bay-head">
          <div className="jal-bay-title">
            {isTrialMode ? "Onboarding Readiness Trial" : "Onboarding Readiness Endless"}
          </div>
          <div className="jal-bay-note">{isTrialMode ? "Trial Available" : "Endless Available"}</div>
        </div>

        <p className="jal-trial-note">
          Keep the token stable under movement.
          {isTrialMode ? (
            <>
              {" "}
              Reach at least <strong>{minScore}</strong> points to complete the run.
            </>
          ) : (
            <> Endless mode has no pass threshold. Keep climbing.</>
          )}
        </p>

        <div className="jal-trial-preview">
          <div className="jal-trial-preview-badge">
            {isTrialMode ? "Trial Mode" : "Endless Mode"}
          </div>
          <div className="jal-trial-preview-title">Hold alignment under pressure.</div>
          <div className="jal-trial-preview-line">
            Your token stays in motion. Your job is not panic. Your job is fit.
          </div>
        </div>

        <div className="jal-trial-grid">
          <article className="jal-trial-card">
            <div className="jal-trial-k">Control</div>
            <div className="jal-trial-v">Tap screen to lift. Desktop also supports Space.</div>
          </article>

          <article className="jal-trial-card">
            <div className="jal-trial-k">{isTrialMode ? "Threshold" : "Objective"}</div>
            <div className="jal-trial-v">
              {isTrialMode ? `Minimum required score: ${minScore}` : "Push your score as high as possible"}
            </div>
          </article>

          <article className="jal-trial-card">
            <div className="jal-trial-k">Best</div>
            <div className="jal-trial-v">High Score: {highScore}</div>
          </article>
        </div>

        <div className="jal-trial-actions">
          <button
            type="button"
            className="button neon"
            onClick={(event) => {
              event.stopPropagation();
              beginPlaying();
            }}
          >
            {isTrialMode ? "Start Trial" : "Start Endless"}
          </button>
        </div>
      </div>
    );
  }

  if (isFullscreen && typeof document !== "undefined" && document.body) {
    return createPortal(gameView, document.body);
  }

  return gameView;
}
