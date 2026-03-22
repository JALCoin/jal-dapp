import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TokenFitGameProps = {
  minScore: number;
  onPass: (score: number, highScore: number) => void;
  onGameOver?: (score: number, highScore: number) => void;
};

type TokenFitState = "idle" | "countdown" | "playing" | "gameover" | "passed";

type Pipe = {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
};

const STORAGE_KEY = "jal_token_fit_high_score";

const BASE_GAME_WIDTH = 960;
const BASE_GAME_HEIGHT = 540;

const TOKEN_SIZE = 42;
const TOKEN_X = 220;

const GRAVITY = 0.38;
const JUMP_FORCE = -6.2;

const PIPE_WIDTH = 82;
const PIPE_GAP = 170;
const PIPE_SPEED = 2.6;
const PIPE_SPAWN_DISTANCE = 280;

const FLOOR_HEIGHT = 28;
const CEILING_HEIGHT = 20;
const SAFE_MARGIN = 56;

const COUNTDOWN_START = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getStoredHighScore(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function setStoredHighScore(score: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(score));
}

function maskPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function TokenFitGame({
  minScore,
  onPass,
  onGameOver,
}: TokenFitGameProps) {
  const animationRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const stateRef = useRef<TokenFitState>("idle");
  const passTriggeredRef = useRef(false);
  const nextPipeIdRef = useRef(1);

  const tokenRef = useRef<HTMLDivElement | null>(null);
  const pipesLayerRef = useRef<HTMLDivElement | null>(null);

  const velocityRef = useRef(0);
  const tokenYRef = useRef(BASE_GAME_HEIGHT / 2 - TOKEN_SIZE / 2);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const lastSpawnXRef = useRef(BASE_GAME_WIDTH + 120);

  const [gameState, setGameState] = useState<TokenFitState>("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [tokenFitPassed, setTokenFitPassed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const stored = getStoredHighScore();
    setHighScore(stored);
    highScoreRef.current = stored;
  }, []);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const renderToken = useCallback(() => {
    if (!tokenRef.current) return;

    tokenRef.current.style.left = `${TOKEN_X}px`;
    tokenRef.current.style.top = `${tokenYRef.current}px`;
    tokenRef.current.style.transform = `rotate(${clamp(
      velocityRef.current * 4,
      -18,
      22
    )}deg)`;
  }, []);

  const renderPipes = useCallback(() => {
    const layer = pipesLayerRef.current;
    if (!layer) return;

    layer.innerHTML = "";

    for (const pipe of pipesRef.current) {
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;
      const topHeight = Math.max(0, gapTop - CEILING_HEIGHT);
      const bottomHeight = Math.max(0, BASE_GAME_HEIGHT - FLOOR_HEIGHT - gapBottom);

      const topPipe = document.createElement("div");
      topPipe.style.position = "absolute";
      topPipe.style.left = `${pipe.x}px`;
      topPipe.style.top = `${CEILING_HEIGHT}px`;
      topPipe.style.width = `${PIPE_WIDTH}px`;
      topPipe.style.height = `${topHeight}px`;
      topPipe.style.borderRadius = "18px";
      topPipe.style.background =
        "linear-gradient(180deg, rgba(8,18,28,0.95), rgba(0,255,180,0.16))";
      topPipe.style.border = "1px solid rgba(0,255,180,0.18)";
      topPipe.style.boxShadow =
        "inset 0 0 18px rgba(0,255,180,0.08), 0 0 12px rgba(0,255,180,0.08)";

      const bottomPipe = document.createElement("div");
      bottomPipe.style.position = "absolute";
      bottomPipe.style.left = `${pipe.x}px`;
      bottomPipe.style.top = `${gapBottom}px`;
      bottomPipe.style.width = `${PIPE_WIDTH}px`;
      bottomPipe.style.height = `${bottomHeight}px`;
      bottomPipe.style.borderRadius = "18px";
      bottomPipe.style.background =
        "linear-gradient(180deg, rgba(0,255,180,0.16), rgba(8,18,28,0.95))";
      bottomPipe.style.border = "1px solid rgba(0,255,180,0.18)";
      bottomPipe.style.boxShadow =
        "inset 0 0 18px rgba(0,255,180,0.08), 0 0 12px rgba(0,255,180,0.08)";

      layer.appendChild(topPipe);
      layer.appendChild(bottomPipe);
    }
  }, []);

  const resetRunState = useCallback(() => {
    const startY = BASE_GAME_HEIGHT / 2 - TOKEN_SIZE / 2;
    const firstX = BASE_GAME_WIDTH + 120;
    const secondX = firstX + PIPE_SPAWN_DISTANCE;
    const minGapY = CEILING_HEIGHT + SAFE_MARGIN + PIPE_GAP / 2;
    const maxGapY = BASE_GAME_HEIGHT - FLOOR_HEIGHT - SAFE_MARGIN - PIPE_GAP / 2;

    pipesRef.current = [
      {
        id: nextPipeIdRef.current++,
        x: firstX,
        gapY: BASE_GAME_HEIGHT / 2,
        scored: false,
      },
      {
        id: nextPipeIdRef.current++,
        x: secondX,
        gapY: clamp(BASE_GAME_HEIGHT / 2 - 40, minGapY, maxGapY),
        scored: false,
      },
    ];

    velocityRef.current = 0;
    tokenYRef.current = startY;
    scoreRef.current = 0;
    lastSpawnXRef.current = secondX;
    passTriggeredRef.current = false;

    setScore(0);

    renderToken();
    renderPipes();
  }, [renderPipes, renderToken]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const endRun = useCallback(
    (passed: boolean) => {
      stopAnimation();

      const finalScore = scoreRef.current;
      const nextHighScore = Math.max(finalScore, highScoreRef.current);

      if (nextHighScore !== highScoreRef.current) {
        highScoreRef.current = nextHighScore;
        setHighScore(nextHighScore);
        setStoredHighScore(nextHighScore);
      }

      if (passed) {
        setTokenFitPassed(true);
        setGameState("passed");

        if (!passTriggeredRef.current) {
          passTriggeredRef.current = true;
          onPass(finalScore, nextHighScore);
        }
        return;
      }

      setGameState("gameover");
      onGameOver?.(finalScore, nextHighScore);
    },
    [onGameOver, onPass, stopAnimation]
  );

  const spawnPipe = useCallback(() => {
    const minGapY = CEILING_HEIGHT + SAFE_MARGIN + PIPE_GAP / 2;
    const maxGapY = BASE_GAME_HEIGHT - FLOOR_HEIGHT - SAFE_MARGIN - PIPE_GAP / 2;

    const previousGapY =
      pipesRef.current.length > 0
        ? pipesRef.current[pipesRef.current.length - 1].gapY
        : BASE_GAME_HEIGHT / 2;

    const drift = (Math.random() - 0.5) * 120;
    const gapY = clamp(previousGapY + drift, minGapY, maxGapY);

    const newPipe: Pipe = {
      id: nextPipeIdRef.current++,
      x: lastSpawnXRef.current + PIPE_SPAWN_DISTANCE,
      gapY,
      scored: false,
    };

    lastSpawnXRef.current = newPipe.x;
    pipesRef.current = [...pipesRef.current, newPipe];
  }, []);

  const step = useCallback(() => {
    if (stateRef.current !== "playing") return;

    velocityRef.current += GRAVITY;
    tokenYRef.current += velocityRef.current;

    const tokenTop = tokenYRef.current;
    const tokenBottom = tokenTop + TOKEN_SIZE;
    const tokenLeft = TOKEN_X;
    const tokenRight = TOKEN_X + TOKEN_SIZE;

    if (tokenTop <= CEILING_HEIGHT || tokenBottom >= BASE_GAME_HEIGHT - FLOOR_HEIGHT) {
      renderToken();
      endRun(false);
      return;
    }

    let updatedPipes = pipesRef.current.map((pipe) => ({
      ...pipe,
      x: pipe.x - PIPE_SPEED,
    }));

    updatedPipes = updatedPipes.filter((pipe) => pipe.x + PIPE_WIDTH > -40);

    if (updatedPipes.length === 0) {
      pipesRef.current = updatedPipes;
      spawnPipe();
      updatedPipes = pipesRef.current;
    }

    const furthestX = updatedPipes[updatedPipes.length - 1]?.x ?? 0;
    lastSpawnXRef.current = furthestX;

    if (BASE_GAME_WIDTH - furthestX >= PIPE_SPAWN_DISTANCE) {
      pipesRef.current = updatedPipes;
      spawnPipe();
      updatedPipes = pipesRef.current;
    }

    let scoreChanged = false;
    let didCrash = false;

    updatedPipes = updatedPipes.map((pipe) => {
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      const overlapsX = tokenRight > pipeLeft && tokenLeft < pipeRight;
      const hitsTopPipe = tokenTop < gapTop;
      const hitsBottomPipe = tokenBottom > gapBottom;

      if (overlapsX && (hitsTopPipe || hitsBottomPipe)) {
        didCrash = true;
        return pipe;
      }

      if (!pipe.scored && pipeRight < TOKEN_X) {
        scoreRef.current += 1;
        scoreChanged = true;
        return { ...pipe, scored: true };
      }

      return pipe;
    });

    pipesRef.current = updatedPipes;

    renderToken();
    renderPipes();

    if (didCrash) {
      endRun(false);
      return;
    }

    if (scoreChanged) {
      setScore(scoreRef.current);

      if (scoreRef.current >= minScore) {
        endRun(true);
        return;
      }
    }

    animationRef.current = window.requestAnimationFrame(step);
  }, [endRun, minScore, renderPipes, renderToken, spawnPipe]);

  const beginPlaying = useCallback(() => {
    resetRunState();
    setCountdown(COUNTDOWN_START);
    setIsFullscreen(true);
    setGameState("countdown");
  }, [resetRunState]);

  const closeFullscreen = useCallback(() => {
    if (stateRef.current === "playing" || stateRef.current === "countdown") return;
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    if (gameState !== "countdown") {
      stopCountdown();
      return;
    }

    setCountdown(COUNTDOWN_START);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown();
          setGameState("playing");
          return 0;
        }
        return prev - 1;
      });
    }, 700);

    return stopCountdown;
  }, [gameState, stopCountdown]);

  useEffect(() => {
    if (gameState !== "playing") {
      stopAnimation();
      return;
    }

    animationRef.current = window.requestAnimationFrame(step);
    return stopAnimation;
  }, [gameState, step, stopAnimation]);

  const liftToken = useCallback(() => {
    if (stateRef.current === "idle") {
      beginPlaying();
      return;
    }

    if (stateRef.current !== "playing") return;

    velocityRef.current = JUMP_FORCE;
  }, [beginPlaying]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      event.preventDefault();
      liftToken();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [liftToken]);

  useEffect(() => {
    renderToken();
    renderPipes();
  }, [renderPipes, renderToken]);

  useEffect(() => {
    return () => {
      stopAnimation();
      stopCountdown();
      document.body.style.overflow = "";
    };
  }, [stopAnimation, stopCountdown]);

  const statusText = useMemo(() => {
    if (gameState === "idle") return "Trial Available";
    if (gameState === "countdown") return "Stabilising";
    if (gameState === "playing") return "Trial Active";
    if (gameState === "passed") return "Condition Met";
    return "Control Lost";
  }, [gameState]);

  const canContinue = tokenFitPassed || gameState === "passed";

  const shellStyle = isFullscreen
    ? {
        position: "fixed" as const,
        inset: 0,
        zIndex: 9999,
        background: "rgba(2,8,16,0.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }
    : undefined;

  return (
    <div aria-label="JAL's Trials Token Fit" style={shellStyle}>
      <div
        style={{
          width: isFullscreen ? "100%" : undefined,
          maxWidth: isFullscreen ? "1120px" : undefined,
        }}
      >
        <div className="jal-bay-head">
          <div className="jal-bay-title">JAL’s Trials ~ Token Fit</div>
          <div className="jal-bay-note">{statusText}</div>
        </div>

        <p className="jal-note">
          Keep the token stable under movement. Tap the screen or press Space to lift. Reach at
          least <strong>{minScore}</strong> points to unlock the trial.
        </p>

        <div
          role="button"
          tabIndex={0}
          aria-label="Token Fit game area"
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button")) return;
            liftToken();
          }}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              liftToken();
            }
          }}
          style={{
            position: "relative",
            width: "min(100vw - 24px, 960px)",
            height: "min(100vh - 80px, 540px)",
            maxWidth: `${BASE_GAME_WIDTH}px`,
            margin: "1rem auto 0",
            overflow: "hidden",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "radial-gradient(circle at 50% 35%, rgba(0,255,180,0.08), rgba(4,9,18,0.96) 55%, rgba(2,6,14,1) 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(0,255,180,0.06), 0 0 24px rgba(0,255,180,0.10)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              opacity: 0.22,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "18px",
              left: "18px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              zIndex: 5,
            }}
          >
            <div className="button ghost" style={{ pointerEvents: "none" }}>
              Score: {score}
            </div>
            <div className="button ghost" style={{ pointerEvents: "none" }}>
              High Score: {highScore}
            </div>
            <div className="button ghost" style={{ pointerEvents: "none" }}>
              Minimum: {minScore}
            </div>
          </div>

          <div
            ref={pipesLayerRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          />

          <div
            ref={tokenRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: `${TOKEN_SIZE}px`,
              height: `${TOKEN_SIZE}px`,
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#081118",
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,245,180,1), rgba(255,214,92,0.95) 48%, rgba(193,133,20,0.96) 100%)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow:
                "0 0 16px rgba(255,214,92,0.42), inset 0 0 10px rgba(255,255,255,0.26)",
              zIndex: 4,
            }}
          >
            JAL
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              insetInline: 0,
              top: 0,
              height: maskPercent(CEILING_HEIGHT / BASE_GAME_HEIGHT),
              background: "rgba(255,255,255,0.05)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              insetInline: 0,
              bottom: 0,
              height: maskPercent(FLOOR_HEIGHT / BASE_GAME_HEIGHT),
              background:
                "linear-gradient(180deg, rgba(16,22,32,0.7), rgba(0,255,180,0.14))",
              borderTop: "1px solid rgba(0,255,180,0.12)",
            }}
          />

          {(gameState === "idle" ||
            gameState === "countdown" ||
            gameState === "gameover" ||
            gameState === "passed") && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(180deg, rgba(2,8,16,0.30), rgba(2,8,16,0.68))",
                zIndex: 6,
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              {gameState === "idle" && (
                <div style={{ maxWidth: "620px" }}>
                  <div className="jal-kicker">TRIAL READY</div>
                  <h3
                    className="home-title"
                    style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}
                  >
                    Token Fit
                  </h3>
                  <p className="jal-note">
                    Hold the JAL token in controlled motion. Tap or press Space to lift. Pass
                    through the structure and reach the minimum score to complete the Token Fit
                    trial.
                  </p>
                  <div
                    className="jal-bay-actions"
                    style={{ justifyContent: "center", marginTop: "1rem" }}
                  >
                    <button
                      type="button"
                      className="button neon"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginPlaying();
                      }}
                    >
                      Start Trial
                    </button>
                  </div>
                </div>
              )}

              {gameState === "countdown" && (
                <div>
                  <div className="jal-kicker">STABILISE</div>
                  <h3
                    className="home-title"
                    style={{ fontSize: "clamp(2.2rem, 8vw, 5rem)" }}
                  >
                    {countdown > 0 ? countdown : "GO"}
                  </h3>
                </div>
              )}

              {gameState === "gameover" && (
                <div style={{ maxWidth: "620px" }}>
                  <div className="jal-kicker">LOSS OF CONTROL</div>
                  <h3
                    className="home-title"
                    style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}
                  >
                    Game Over
                  </h3>
                  <p className="jal-note">
                    Score: <strong>{score}</strong> · High Score: <strong>{highScore}</strong>
                  </p>
                  <p className="jal-lock-text">Minimum required to pass: {minScore}</p>
                  <div
                    className="jal-bay-actions"
                    style={{ justifyContent: "center", marginTop: "1rem" }}
                  >
                    <button
                      type="button"
                      className="button neon"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginPlaying();
                      }}
                    >
                      Try Again
                    </button>

                    {isFullscreen && (
                      <button
                        type="button"
                        className="button ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          closeFullscreen();
                        }}
                      >
                        Exit Fullscreen
                      </button>
                    )}
                  </div>
                </div>
              )}

              {gameState === "passed" && (
                <div style={{ maxWidth: "620px" }}>
                  <div className="jal-kicker">TRIAL PASSED</div>
                  <h3
                    className="home-title"
                    style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}
                  >
                    Token Fit Complete
                  </h3>
                  <p className="jal-note">
                    Score: <strong>{score}</strong> · High Score: <strong>{highScore}</strong>
                  </p>
                  <p className="jal-lock-text">
                    You reached the minimum score of {minScore}. Token Fit is now complete for this
                    Observe run.
                  </p>
                  <div
                    className="jal-bay-actions"
                    style={{ justifyContent: "center", marginTop: "1rem" }}
                  >
                    <button
                      type="button"
                      className="button ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginPlaying();
                      }}
                    >
                      Play Again
                    </button>

                    {isFullscreen && (
                      <button
                        type="button"
                        className="button gold"
                        onClick={(event) => {
                          event.stopPropagation();
                          closeFullscreen();
                        }}
                      >
                        Return To Gate
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isFullscreen && (
          <div className="jal-bay-actions" style={{ marginTop: "1rem" }}>
            <div className="button ghost" style={{ pointerEvents: "none" }}>
              Current Score: {score}
            </div>
            <div className="button ghost" style={{ pointerEvents: "none" }}>
              High Score: {highScore}
            </div>
            <div className="button ghost" style={{ pointerEvents: "none" }}>
              Trial Pass: {canContinue ? "Unlocked" : "Locked"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}