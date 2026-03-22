import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
const TOKEN_X = 180;

const GRAVITY = 0.34;
const JUMP_FORCE = -5.9;

const PIPE_WIDTH = 96;
const PIPE_GAP = 190;
const PIPE_SPEED = 2.3;
const PIPE_SPAWN_EVERY = 1500;

const FLOOR_HEIGHT = 74;
const CEILING_HEIGHT = 18;

const COUNTDOWN_SECONDS = 3;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadHighScore() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function saveHighScore(score: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(score));
}

export default function TokenFitGame({
  minScore,
  onPass,
  onGameOver,
}: TokenFitGameProps) {
  const [gameState, setGameState] = useState<TokenFitState>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadHighScore());

  const [tokenY, setTokenY] = useState(BASE_GAME_HEIGHT / 2 - TOKEN_SIZE / 2);
  const [velocity, setVelocity] = useState(0);

  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const [sceneScale, setSceneScale] = useState(1);
  const [sceneWidth, setSceneWidth] = useState(BASE_GAME_WIDTH);
  const [sceneHeight, setSceneHeight] = useState(BASE_GAME_HEIGHT);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number>(0);
  const nextPipeIdRef = useRef(1);

  const scoreRef = useRef(0);
  const gameStateRef = useRef<TokenFitState>("idle");

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const resetWorld = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setVelocity(0);
    setTokenY(BASE_GAME_HEIGHT / 2 - TOKEN_SIZE / 2);
    setPipes([]);
    setCountdown(COUNTDOWN_SECONDS);
    lastFrameRef.current = null;
    spawnTimerRef.current = 0;
    nextPipeIdRef.current = 1;
  }, []);

  const endGame = useCallback(
    (nextState: "gameover" | "passed") => {
      if (gameStateRef.current === "gameover" || gameStateRef.current === "passed") {
        return;
      }

      const finalScore = scoreRef.current;
      const nextHighScore = Math.max(highScore, finalScore);

      if (nextHighScore !== highScore) {
        setHighScore(nextHighScore);
        saveHighScore(nextHighScore);
      }

      setGameState(nextState);

      if (nextState === "passed") {
        onPass(finalScore, nextHighScore);
      } else {
        onGameOver?.(finalScore, nextHighScore);
      }
    },
    [highScore, onGameOver, onPass]
  );

  const flap = useCallback(() => {
    if (gameStateRef.current === "countdown") return;

    if (gameStateRef.current === "idle") return;

    if (gameStateRef.current === "gameover" || gameStateRef.current === "passed") {
      resetWorld();
      setGameState("countdown");
      return;
    }

    if (gameStateRef.current === "playing") {
      setVelocity(JUMP_FORCE);
    }
  }, [resetWorld]);

  const beginPlaying = useCallback(() => {
    resetWorld();
    setIsFullscreen(true);
    setGameState("countdown");
  }, [resetWorld]);

  useEffect(() => {
    if (!isFullscreen) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    function updateSceneScale() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const horizontalPadding = isFullscreen ? 12 : 32;
      const verticalPadding = isFullscreen ? 12 : 32;

      const availableWidth = Math.max(260, viewportWidth - horizontalPadding);
      const availableHeight = isFullscreen
        ? Math.max(260, viewportHeight - verticalPadding)
        : Math.min(420, viewportHeight * 0.5);

      const scaleX = availableWidth / BASE_GAME_WIDTH;
      const scaleY = availableHeight / BASE_GAME_HEIGHT;
      const nextScale = Math.min(scaleX, scaleY, 1);

      setSceneScale(nextScale);
      setSceneWidth(BASE_GAME_WIDTH * nextScale);
      setSceneHeight(BASE_GAME_HEIGHT * nextScale);
    }

    updateSceneScale();
    window.addEventListener("resize", updateSceneScale);
    return () => window.removeEventListener("resize", updateSceneScale);
  }, [isFullscreen]);

  useEffect(() => {
    if (gameState !== "countdown") return;

    if (countdown <= 0) {
      setGameState("playing");
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
        setIsFullscreen(false);
        if (gameStateRef.current === "playing" || gameStateRef.current === "countdown") {
          setGameState("idle");
          resetWorld();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flap, isFullscreen, resetWorld]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const topBound = CEILING_HEIGHT;
    const bottomBound = BASE_GAME_HEIGHT - FLOOR_HEIGHT - TOKEN_SIZE;

    const tick = (now: number) => {
      if (lastFrameRef.current == null) {
        lastFrameRef.current = now;
      }

      const deltaMs = now - lastFrameRef.current;
      lastFrameRef.current = now;

      const frameScale = deltaMs / 16.6667;

      setVelocity((prevVelocity) => {
        const nextVelocity = prevVelocity + GRAVITY * frameScale;

        setTokenY((prevY) => {
          const nextY = prevY + nextVelocity * frameScale;

          if (nextY <= topBound) {
            endGame("gameover");
            return topBound;
          }

          if (nextY >= bottomBound) {
            endGame("gameover");
            return bottomBound;
          }

          return nextY;
        });

        return nextVelocity;
      });

      spawnTimerRef.current += deltaMs;

      if (spawnTimerRef.current >= PIPE_SPAWN_EVERY) {
        spawnTimerRef.current = 0;

        const gapPaddingTop = 80;
        const gapPaddingBottom = 110;
        const minGapY = gapPaddingTop + PIPE_GAP / 2;
        const maxGapY = BASE_GAME_HEIGHT - FLOOR_HEIGHT - gapPaddingBottom - PIPE_GAP / 2;
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

        setPipes((prev) => [
          ...prev,
          {
            id: nextPipeIdRef.current++,
            x: BASE_GAME_WIDTH + 40,
            gapY,
            scored: false,
          },
        ]);
      }

      setPipes((prevPipes) => {
        const nextPipes = prevPipes
          .map((pipe) => {
            const nextX = pipe.x - PIPE_SPEED * frameScale;
            let nextPipe = { ...pipe, x: nextX };

            if (!pipe.scored && nextX + PIPE_WIDTH < TOKEN_X) {
              nextPipe = { ...nextPipe, scored: true };
              const nextScore = scoreRef.current + 1;
              scoreRef.current = nextScore;
              setScore(nextScore);

              if (nextScore >= minScore) {
                endGame("passed");
              }
            }

            return nextPipe;
          })
          .filter((pipe) => pipe.x + PIPE_WIDTH > -40);

        return nextPipes;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [endGame, gameState, minScore]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const tokenLeft = TOKEN_X;
    const tokenRight = TOKEN_X + TOKEN_SIZE;
    const tokenTop = tokenY;
    const tokenBottom = tokenY + TOKEN_SIZE;

    for (const pipe of pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      const withinX = tokenRight > pipeLeft && tokenLeft < pipeRight;
      if (!withinX) continue;

      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;

      const hitsTop = tokenTop < gapTop;
      const hitsBottom = tokenBottom > gapBottom;

      if (hitsTop || hitsBottom) {
        endGame("gameover");
        return;
      }
    }
  }, [endGame, gameState, pipes, tokenY]);

  const statusText = useMemo(() => {
    if (gameState === "passed") return "Trial Complete";
    if (gameState === "gameover") return "Trial Failed";
    if (gameState === "countdown") return "Prepare";
    if (gameState === "playing") return "In Motion";
    return "Trial Available";
  }, [gameState]);

  const showCompactEntry = !isFullscreen && gameState === "idle";

  const shellStyle = isFullscreen
    ? {
        position: "fixed" as const,
        inset: 0,
        zIndex: 9999,
        background: "rgba(2,8,16,0.985)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
      }
    : {
        position: "relative" as const,
        width: "100%",
      };

  const tokenRotation = clamp(velocity * 4.5, -28, 60);

  const handleScenePress = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    flap();
  };

  const closeTrial = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setIsFullscreen(false);
    setGameState("idle");
    resetWorld();
  };

  const gameView = (
    <div style={shellStyle} aria-label="JAL's Trials Token Fit">
      {!isFullscreen && (
        <>
          <div className="jal-bay-head">
            <div className="jal-bay-title">JAL’s Trials ~ Token Fit</div>
            <div className="jal-bay-note">{statusText}</div>
          </div>

          <p className="jal-note">
            Keep the token stable under movement. Tap the screen or press Space to lift. Reach at
            least <strong>{minScore}</strong> points to unlock the trial.
          </p>
        </>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={handleScenePress}
        onTouchStart={handleScenePress}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            flap();
          }
        }}
        style={{
          position: "relative",
          width: `${sceneWidth}px`,
          height: `${sceneHeight}px`,
          margin: "0 auto",
          cursor: "pointer",
          userSelect: "none",
          touchAction: "manipulation",
          outline: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${BASE_GAME_WIDTH}px`,
            height: `${BASE_GAME_HEIGHT}px`,
            transform: `scale(${sceneScale})`,
            transformOrigin: "top left",
            overflow: "hidden",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "radial-gradient(circle at 50% 35%, rgba(0,255,180,0.08), rgba(4,9,18,0.96) 55%, rgba(2,6,14,1) 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(0,255,180,0.06), 0 0 24px rgba(0,255,180,0.10)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 22%, rgba(0,255,180,0.03) 70%, rgba(0,0,0,0.18) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 36,
              top: 26,
              display: "flex",
              gap: 12,
              alignItems: "center",
              zIndex: 5,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(5, 14, 22, 0.72)",
                color: "#f6fffb",
                fontSize: 15,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              JAL’s Trials
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(5, 14, 22, 0.72)",
                color: "#c7fce8",
                fontSize: 15,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Token Fit
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 36,
              top: 26,
              display: "flex",
              gap: 12,
              zIndex: 5,
            }}
          >
            <div
              style={{
                minWidth: 108,
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(5, 14, 22, 0.72)",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Score
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{score}</div>
            </div>

            <div
              style={{
                minWidth: 108,
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(5, 14, 22, 0.72)",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Best
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{highScore}</div>
            </div>

            {isFullscreen && (
              <button
                type="button"
                onClick={closeTrial}
                style={{
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(8, 18, 28, 0.82)",
                  color: "#ffffff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Exit
              </button>
            )}
          </div>

          {pipes.map((pipe) => {
            const topPipeHeight = pipe.gapY - PIPE_GAP / 2;
            const bottomPipeY = pipe.gapY + PIPE_GAP / 2;
            const bottomPipeHeight = BASE_GAME_HEIGHT - FLOOR_HEIGHT - bottomPipeY;

            return (
              <div key={pipe.id}>
                <div
                  style={{
                    position: "absolute",
                    left: pipe.x,
                    top: 0,
                    width: PIPE_WIDTH,
                    height: topPipeHeight,
                    borderRadius: "0 0 20px 20px",
                    background:
                      "linear-gradient(180deg, rgba(0,255,180,0.16), rgba(0,255,180,0.08) 20%, rgba(10,24,24,0.92) 100%)",
                    border: "1px solid rgba(0,255,180,0.22)",
                    boxShadow: "0 0 18px rgba(0,255,180,0.09)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: pipe.x - 8,
                    top: topPipeHeight - 20,
                    width: PIPE_WIDTH + 16,
                    height: 20,
                    borderRadius: 12,
                    background: "rgba(0,255,180,0.16)",
                    border: "1px solid rgba(0,255,180,0.2)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: pipe.x,
                    top: bottomPipeY,
                    width: PIPE_WIDTH,
                    height: bottomPipeHeight,
                    borderRadius: "20px 20px 0 0",
                    background:
                      "linear-gradient(180deg, rgba(10,24,24,0.92), rgba(0,255,180,0.08) 80%, rgba(0,255,180,0.16) 100%)",
                    border: "1px solid rgba(0,255,180,0.22)",
                    boxShadow: "0 0 18px rgba(0,255,180,0.09)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: pipe.x - 8,
                    top: bottomPipeY,
                    width: PIPE_WIDTH + 16,
                    height: 20,
                    borderRadius: 12,
                    background: "rgba(0,255,180,0.16)",
                    border: "1px solid rgba(0,255,180,0.2)",
                  }}
                />
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: TOKEN_X,
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
              bottom: FLOOR_HEIGHT,
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
              height: FLOOR_HEIGHT,
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
              height: CEILING_HEIGHT,
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
                background: "rgba(2, 8, 16, 0.34)",
                zIndex: 6,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "22px 30px",
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
                    fontSize: 72,
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
                background: "rgba(2, 8, 16, 0.44)",
                zIndex: 6,
              }}
            >
              <div
                style={{
                  width: 420,
                  maxWidth: "90%",
                  textAlign: "center",
                  padding: "28px 26px",
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
                  {gameState === "passed" ? "Trial Complete" : "Trial Failed"}
                </div>

                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: "#ffffff",
                    marginBottom: 12,
                  }}
                >
                  {gameState === "passed"
                    ? "Alignment confirmed."
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
                  Score: <strong>{score}</strong> · Required: <strong>{minScore}</strong> · Best:{" "}
                  <strong>{highScore}</strong>
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
                    onClick={(event) => {
                      event.stopPropagation();
                      resetWorld();
                      setGameState("countdown");
                    }}
                    style={{
                      minWidth: 140,
                      padding: "12px 18px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>

                  <button
                    type="button"
                    onClick={closeTrial}
                    style={{
                      minWidth: 140,
                      padding: "12px 18px",
                      borderRadius: 14,
                      border: "1px solid rgba(0,255,180,0.22)",
                      background: "rgba(0,255,180,0.08)",
                      color: "#d9fff1",
                      fontWeight: 700,
                      cursor: "pointer",
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
                bottom: 98,
                transform: "translateX(-50%)",
                padding: "10px 16px",
                borderRadius: 999,
                background: "rgba(4,12,18,0.66)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                zIndex: 5,
              }}
            >
              Tap or press space to lift
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (showCompactEntry) {
    return (
      <div aria-label="JAL's Trials Token Fit">
        <div className="jal-bay-head">
          <div className="jal-bay-title">JAL’s Trials ~ Token Fit</div>
          <div className="jal-bay-note">Trial Available</div>
        </div>

        <p className="jal-note">
          Keep the token stable under movement. Reach at least <strong>{minScore}</strong> points to
          complete the trial.
        </p>

        <div className="jal-bullets">
          <article className="jal-bullet">
            <div className="jal-bullet-k">Control</div>
            <div className="jal-bullet-v">Tap screen or press Space to lift.</div>
          </article>

          <article className="jal-bullet">
            <div className="jal-bullet-k">Threshold</div>
            <div className="jal-bullet-v">Minimum required score: {minScore}</div>
          </article>

          <article className="jal-bullet">
            <div className="jal-bullet-k">Best</div>
            <div className="jal-bullet-v">High Score: {highScore}</div>
          </article>
        </div>

        <div className="jal-bay-actions" style={{ marginTop: "1rem" }}>
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
    );
  }

  if (isFullscreen && typeof document !== "undefined") {
    return createPortal(gameView, document.body);
  }

  return gameView;
}