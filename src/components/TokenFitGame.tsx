import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

export type TokenFitGameProps = {
  minScore: number;
  username: string;
  endlessMode?: boolean;
  onPass: (score: number, highScore: number) => void;
  onGameOver?: (score: number, highScore: number) => void;
  onLeaveAfterPass?: () => void;
};

type TokenFitState = "idle" | "countdown" | "playing" | "gameover" | "passed";
type ViewMode = "portrait" | "landscape";

type Pipe = {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
};

type LeaderboardEntry = {
  id: string;
  username: string;
  score: number;
  achievedAt: number;
};

const STORAGE_KEY = "jal_observe_token_fit_high_score_v2";

const LANDSCAPE_WORLD_WIDTH = 800;
const LANDSCAPE_WORLD_HEIGHT = 450;

const PORTRAIT_WORLD_WIDTH = 320;
const PORTRAIT_WORLD_HEIGHT = 620;

const TOKEN_SIZE = 42;

const BASE_GRAVITY = 0.34;
const BASE_JUMP_FORCE = -5.9;
const BASE_PIPE_SPAWN_EVERY = 1500;
const COUNTDOWN_SECONDS = 3;
const LEADERBOARD_LIMIT = 10;

const MAX_DELTA_MS = 32;
const MIN_DELTA_MS = 14;
const HUD_SYNC_INTERVAL_MS = 1000 / 2;
const DPR_CAP = 1.25;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeUsername(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 24);
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

function getViewportSize() {
  if (typeof window === "undefined") {
    return {
      width: LANDSCAPE_WORLD_WIDTH,
      height: LANDSCAPE_WORLD_HEIGHT,
    };
  }

  const vv = window.visualViewport;

  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  worldWidth: number,
  worldHeight: number,
  ceilingHeight: number,
  floorHeight: number,
  difficultyPipeGap: number,
  pipeWidth: number,
  tokenSize: number,
  tokenX: number,
  tokenY: number,
  velocity: number,
  pipes: Pipe[],
  isMobileLite: boolean
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, worldWidth, worldHeight);

  ctx.fillStyle = "#02060e";
  ctx.fillRect(0, 0, worldWidth, worldHeight);

  const decorativeWorld = !isMobileLite;

  if (decorativeWorld) {
    ctx.fillStyle = "rgba(0,255,180,0.035)";
    ctx.fillRect(0, 0, worldWidth, worldHeight * 0.55);
  }

  for (const pipe of pipes) {
    const topPipeHeight = pipe.gapY - difficultyPipeGap / 2;
    const bottomPipeY = pipe.gapY + difficultyPipeGap / 2;
    const bottomPipeHeight = worldHeight - floorHeight - bottomPipeY;

    if (isMobileLite) {
      ctx.fillStyle = "rgba(8,40,34,0.96)";
      ctx.fillRect(pipe.x, 0, pipeWidth, topPipeHeight);
    } else {
      ctx.fillStyle = "rgba(8,40,34,0.96)";
      ctx.strokeStyle = "rgba(0,255,180,0.22)";
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, pipe.x, 0, pipeWidth, topPipeHeight, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(0,255,180,0.16)";
      ctx.strokeStyle = "rgba(0,255,180,0.2)";
      drawRoundedRect(ctx, pipe.x - 8, topPipeHeight - 20, pipeWidth + 16, 20, 12);
      ctx.fill();
      ctx.stroke();
    }

    if (isMobileLite) {
      ctx.fillStyle = "rgba(8,40,34,0.96)";
      ctx.fillRect(pipe.x, bottomPipeY, pipeWidth, bottomPipeHeight);
    } else {
      ctx.fillStyle = "rgba(8,40,34,0.96)";
      ctx.strokeStyle = "rgba(0,255,180,0.22)";
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, pipe.x, bottomPipeY, pipeWidth, bottomPipeHeight, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(0,255,180,0.16)";
      ctx.strokeStyle = "rgba(0,255,180,0.2)";
      drawRoundedRect(ctx, pipe.x - 8, bottomPipeY, pipeWidth + 16, 20, 12);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (decorativeWorld) {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, 0, worldWidth, ceilingHeight);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, worldHeight - floorHeight, worldWidth, 1);
  }

  ctx.fillStyle = "#07110d";
  ctx.fillRect(0, worldHeight - floorHeight, worldWidth, floorHeight);

  const centerX = tokenX + tokenSize / 2;
  const centerY = tokenY + tokenSize / 2;

  ctx.save();
  ctx.translate(centerX, centerY);

  if (isMobileLite) {
    ctx.fillStyle = "#c8922c";
    ctx.beginPath();
    ctx.arc(0, 0, tokenSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, tokenSize / 2 - Math.max(4, tokenSize * 0.14), 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const rotationDeg = clamp(velocity * 4.5, -28, 60);
    const rotationRad = (rotationDeg * Math.PI) / 180;
    ctx.rotate(rotationRad);

    const tokenGrad = ctx.createRadialGradient(
      -tokenSize * 0.15,
      -tokenSize * 0.18,
      2,
      0,
      0,
      tokenSize * 0.56
    );
    tokenGrad.addColorStop(0, "rgba(255,255,255,0.92)");
    tokenGrad.addColorStop(0.2, "rgba(227,205,112,0.95)");
    tokenGrad.addColorStop(0.58, "rgba(170,120,32,0.96)");
    tokenGrad.addColorStop(1, "rgba(70,40,8,1)");

    ctx.fillStyle = tokenGrad;
    ctx.beginPath();
    ctx.arc(0, 0, tokenSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, tokenSize / 2 - 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export default function TokenFitGame({
  minScore,
  username,
  endlessMode = false,
  onPass,
  onGameOver,
  onLeaveAfterPass,
}: TokenFitGameProps) {
  const mobileLiteMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  }, []);

  const [gameState, setGameState] = useState<TokenFitState>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("landscape");
  const [sceneScale, setSceneScale] = useState(1);
  const [sceneWidth, setSceneWidth] = useState(LANDSCAPE_WORLD_WIDTH);
  const [sceneHeight, setSceneHeight] = useState(LANDSCAPE_WORLD_HEIGHT);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef(0);
  const nextPipeIdRef = useRef(1);
  const lastDisplayedScoreRef = useRef(0);
  const lastHudSyncRef = useRef(0);
  const thresholdReachedRef = useRef(false);
  const passNotifiedRef = useRef(false);

  const scoreRef = useRef(0);
  const gameStateRef = useRef<TokenFitState>("idle");
  const tokenYRef = useRef(PORTRAIT_WORLD_HEIGHT / 2 - TOKEN_SIZE / 2);
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
    gameStateRef.current = gameState;
  }, [gameState]);

  const isPortrait = viewMode === "portrait";

  const worldWidth = mobileLiteMode
    ? sceneWidth
    : isPortrait
      ? PORTRAIT_WORLD_WIDTH
      : LANDSCAPE_WORLD_WIDTH;

  const worldHeight = mobileLiteMode
    ? sceneHeight
    : isPortrait
      ? PORTRAIT_WORLD_HEIGHT
      : LANDSCAPE_WORLD_HEIGHT;

  const tokenSize = mobileLiteMode
    ? clamp(Math.round(worldWidth * 0.11), 34, 48)
    : TOKEN_SIZE;

  const tokenX = mobileLiteMode
    ? Math.round(worldWidth * 0.22)
    : isPortrait
      ? 90
      : 180;

  const pipeWidth = mobileLiteMode
    ? clamp(Math.round(worldWidth * 0.18), 62, 92)
    : isPortrait
      ? 74
      : 96;

  const basePipeGap = mobileLiteMode
    ? clamp(Math.round(worldHeight * 0.3), 180, 250)
    : isPortrait
      ? 210
      : 190;

  const basePipeSpeed = mobileLiteMode ? 2.1 : isPortrait ? 2.35 : 2.2;

  const floorHeight = mobileLiteMode
    ? clamp(Math.round(worldHeight * 0.12), 72, 110)
    : isPortrait
      ? 96
      : 70;

  const ceilingHeight = mobileLiteMode
    ? clamp(Math.round(worldHeight * 0.025), 12, 22)
    : isPortrait
      ? 18
      : 16;

  const hintBottom = mobileLiteMode
    ? Math.max(floorHeight + 18, 92)
    : isPortrait
      ? 126
      : 92;

  const liftButtonRight = 18;
  const liftButtonBottom = Math.max(floorHeight + 18, 90);
  const liftButtonSize = mobileLiteMode ? 76 : 82;

  const safeUsername = sanitizeUsername(username);
  const canStart = safeUsername.length >= 3;
  const isSmallViewport = mobileLiteMode ? sceneWidth < 420 : sceneScale < 0.72;

  const difficulty = useMemo(() => {
    const progress = Math.max(0, highScore - minScore);
    const steps = Math.floor(progress / 10);

    return {
      gravity: mobileLiteMode
        ? BASE_GRAVITY + steps * 0.01
        : BASE_GRAVITY + steps * 0.012,
      jumpForce: mobileLiteMode
        ? BASE_JUMP_FORCE + 0.2 - steps * 0.05
        : BASE_JUMP_FORCE - steps * 0.06,
      pipeSpawnEvery: Math.max(
        mobileLiteMode ? 1180 : 940,
        BASE_PIPE_SPAWN_EVERY - steps * 65
      ),
      pipeGap: Math.max(
        mobileLiteMode ? Math.round(worldHeight * 0.23) : isPortrait ? 145 : 130,
        basePipeGap - steps * (mobileLiteMode ? 6 : 8)
      ),
      pipeSpeed: basePipeSpeed + steps * (mobileLiteMode ? 0.09 : 0.11),
    };
  }, [
    basePipeGap,
    basePipeSpeed,
    highScore,
    isPortrait,
    minScore,
    mobileLiteMode,
    worldHeight,
  ]);

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase
      .from("gate1_leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(LEADERBOARD_LIMIT);

    if (!error && data) {
      setLeaderboard(
        data.map((entry) => ({
          id: entry.username,
          username: entry.username,
          score: entry.score,
          achievedAt: Date.now(),
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const syncHudState = useCallback(() => {
    setScore(scoreRef.current);
  }, []);

  const resetWorld = useCallback(() => {
    const startY = worldHeight / 2 - tokenSize / 2;

    scoreRef.current = 0;
    velocityRef.current = 0;
    tokenYRef.current = startY;
    pipesRef.current = [];
    thresholdReachedRef.current = false;
    passNotifiedRef.current = false;

    setScore(0);
    setCountdown(COUNTDOWN_SECONDS);

    lastFrameRef.current = null;
    spawnTimerRef.current = 0;
    nextPipeIdRef.current = 1;
    lastHudSyncRef.current = 0;
    lastDisplayedScoreRef.current = 0;
  }, [tokenSize, worldHeight]);

  const finalizeRun = useCallback(
    (finalScore: number) => {
      const nextHighScore = Math.max(highScore, finalScore);

      if (nextHighScore !== highScore) {
        setHighScore(nextHighScore);
        saveHighScore(nextHighScore);
      }

      if (safeUsername && finalScore > 0) {
        void (async () => {
          const { data: existing } = await supabase
            .from("gate1_leaderboard")
            .select("score")
            .eq("username", safeUsername)
            .maybeSingle();

          if (!existing) {
            await supabase.from("gate1_leaderboard").insert({
              username: safeUsername,
              score: finalScore,
            });
          } else if (finalScore > existing.score) {
            await supabase
              .from("gate1_leaderboard")
              .update({
                score: finalScore,
                updated_at: new Date().toISOString(),
              })
              .eq("username", safeUsername);
          }

          fetchLeaderboard();
        })();
      }

      return { nextHighScore };
    },
    [fetchLeaderboard, highScore, safeUsername]
  );

  const endGame = useCallback(
    (nextState: "gameover" | "passed") => {
      const current = gameStateRef.current;
      if (current === "gameover" || current === "passed") return;

      const finalScore = scoreRef.current;
      const { nextHighScore } = finalizeRun(finalScore);

      setGameState(nextState);
      gameStateRef.current = nextState;
      syncHudState();

      if (nextState === "passed") {
        if (!passNotifiedRef.current) {
          passNotifiedRef.current = true;
          onPass(finalScore, nextHighScore);
        }
      } else {
        onGameOver?.(finalScore, nextHighScore);
      }
    },
    [finalizeRun, onGameOver, onPass, syncHudState]
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

    velocityRef.current = difficulty.jumpForce;
  }, [difficulty.jumpForce, resetWorld]);

  const beginPlaying = useCallback(() => {
    if (!canStart) return;
    resetWorld();
    setIsFullscreen(true);
    setGameState("countdown");
    gameStateRef.current = "countdown";
  }, [canStart, resetWorld]);

  const closeTrial = useCallback(() => {
    setIsFullscreen(false);
    setGameState("idle");
    gameStateRef.current = "idle";
    resetWorld();
  }, [resetWorld]);

  const leaveTrial = useCallback(() => {
    const wasPlaying = gameStateRef.current === "playing";
    const passed =
      thresholdReachedRef.current || gameStateRef.current === "passed";

    if (wasPlaying && scoreRef.current > 0) {
      const finalScore = scoreRef.current;
      const { nextHighScore } = finalizeRun(finalScore);
      onGameOver?.(finalScore, nextHighScore);

      if ((nextHighScore >= minScore || finalScore >= minScore) && !passNotifiedRef.current) {
        passNotifiedRef.current = true;
        onPass(finalScore, nextHighScore);
      }
    }

    setIsFullscreen(false);
    setGameState("idle");
    gameStateRef.current = "idle";
    resetWorld();

    if (passed) {
      onLeaveAfterPass?.();
    }
  }, [finalizeRun, minScore, onGameOver, onLeaveAfterPass, onPass, resetWorld]);

  useEffect(() => {
    if (
      !isFullscreen ||
      typeof document === "undefined" ||
      typeof window === "undefined"
    ) {
      return;
    }

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

    if (!mobileLiteMode) {
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    }

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
  }, [isFullscreen, mobileLiteMode]);

  useEffect(() => {
    let raf: number | null = null;

    function updateSceneMetrics() {
      const { width: viewportWidth, height: viewportHeight } = getViewportSize();

      const nextMode: ViewMode =
        viewportHeight > viewportWidth ? "portrait" : "landscape";

      setViewMode(nextMode);

      if (mobileLiteMode) {
        const nextWidth = Math.max(280, viewportWidth);
        const nextHeight = Math.max(360, viewportHeight);

        setSceneScale(1);
        setSceneWidth(nextWidth);
        setSceneHeight(nextHeight);
        return;
      }

      const nextWorldWidth =
        nextMode === "portrait" ? PORTRAIT_WORLD_WIDTH : LANDSCAPE_WORLD_WIDTH;
      const nextWorldHeight =
        nextMode === "portrait" ? PORTRAIT_WORLD_HEIGHT : LANDSCAPE_WORLD_HEIGHT;

      const availableWidth = Math.max(280, viewportWidth);
      const availableHeight = Math.max(320, viewportHeight);

      const scaleX = availableWidth / nextWorldWidth;
      const scaleY = availableHeight / nextWorldHeight;
      const nextScale = Math.min(scaleX, scaleY);

      setSceneScale(nextScale);
      setSceneWidth(Math.round(nextWorldWidth * nextScale));
      setSceneHeight(Math.round(nextWorldHeight * nextScale));
    }

    function requestMetricsUpdate() {
      if (raf != null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateSceneMetrics);
    }

    requestMetricsUpdate();

    const vv = window.visualViewport;
    window.addEventListener("resize", requestMetricsUpdate);
    window.addEventListener("orientationchange", requestMetricsUpdate);
    vv?.addEventListener("resize", requestMetricsUpdate);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", requestMetricsUpdate);
      window.removeEventListener("orientationchange", requestMetricsUpdate);
      vv?.removeEventListener("resize", requestMetricsUpdate);
    };
  }, [mobileLiteMode]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    const dpr = clamp(window.devicePixelRatio || 1, 1, DPR_CAP);

    canvas.width = Math.round(worldWidth * dpr);
    canvas.height = Math.round(worldHeight * dpr);
    canvas.style.width = `${worldWidth}px`;
    canvas.style.height = `${worldHeight}px`;

    drawScene(
      ctx,
      dpr,
      worldWidth,
      worldHeight,
      ceilingHeight,
      floorHeight,
      difficulty.pipeGap,
      pipeWidth,
      tokenSize,
      tokenX,
      tokenYRef.current,
      velocityRef.current,
      pipesRef.current,
      mobileLiteMode
    );
  }, [
    ceilingHeight,
    difficulty.pipeGap,
    floorHeight,
    mobileLiteMode,
    pipeWidth,
    tokenSize,
    tokenX,
    worldHeight,
    worldWidth,
    gameState,
  ]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const topBound = ceilingHeight;
    const bottomBound = worldHeight - floorHeight - tokenSize;

    const gapPaddingTop = mobileLiteMode
      ? clamp(Math.round(worldHeight * 0.12), 78, 120)
      : isPortrait
        ? 98
        : 72;

    const gapPaddingBottom = mobileLiteMode
      ? clamp(Math.round(worldHeight * 0.17), 102, 150)
      : isPortrait
        ? 126
        : 98;

    const minGapY = gapPaddingTop + difficulty.pipeGap / 2;
    const maxGapY =
      worldHeight - floorHeight - gapPaddingBottom - difficulty.pipeGap / 2;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    const tick = (now: number) => {
      if (gameStateRef.current !== "playing") return;

      if (lastFrameRef.current == null) {
        lastFrameRef.current = now;
      }

      const rawDelta = now - lastFrameRef.current;
      const deltaMs = clamp(rawDelta, MIN_DELTA_MS, MAX_DELTA_MS);
      lastFrameRef.current = now;

      const frameScale = deltaMs / 16.6667;

      const nextVelocity = velocityRef.current + difficulty.gravity * frameScale;
      const nextY = tokenYRef.current + nextVelocity * frameScale;

      if (nextY <= topBound) {
        tokenYRef.current = topBound;
        velocityRef.current = nextVelocity;
        endGame("gameover");
        return;
      }

      if (nextY >= bottomBound) {
        tokenYRef.current = bottomBound;
        velocityRef.current = nextVelocity;
        endGame("gameover");
        return;
      }

      velocityRef.current = nextVelocity;
      tokenYRef.current = nextY;

      spawnTimerRef.current += deltaMs;

      while (spawnTimerRef.current >= difficulty.pipeSpawnEvery) {
        spawnTimerRef.current -= difficulty.pipeSpawnEvery;

        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

        pipesRef.current.push({
          id: nextPipeIdRef.current++,
          x: worldWidth + pipeWidth + 40,
          gapY,
          scored: false,
        });
      }

      const tokenLeft = tokenX;
      const tokenRight = tokenX + tokenSize;
      const tokenTop = tokenYRef.current;
      const tokenBottom = tokenYRef.current + tokenSize;

      const nextPipes: Pipe[] = [];

      for (const pipe of pipesRef.current) {
        const nextX = pipe.x - difficulty.pipeSpeed * frameScale;

        if (nextX + pipeWidth <= -60) continue;

        pipe.x = nextX;
        const nextPipe = pipe;

        if (!nextPipe.scored && nextX + pipeWidth < tokenX) {
          nextPipe.scored = true;
          scoreRef.current += 1;

          const nextHighScore =
            scoreRef.current > highScore ? scoreRef.current : highScore;

          if (!thresholdReachedRef.current && nextHighScore >= minScore) {
            thresholdReachedRef.current = true;

            if (!passNotifiedRef.current) {
              passNotifiedRef.current = true;
              requestAnimationFrame(() => {
                onPass(scoreRef.current, nextHighScore);
              });
            }

            if (!endlessMode) {
              nextPipes.push(nextPipe);
              pipesRef.current = nextPipes;
              endGame("passed");
              return;
            }
          }
        }

        const pipeLeft = nextX;
        const pipeRight = nextX + pipeWidth;
        const withinX = tokenRight > pipeLeft && tokenLeft < pipeRight;

        if (withinX) {
          const gapTop = nextPipe.gapY - difficulty.pipeGap / 2;
          const gapBottom = nextPipe.gapY + difficulty.pipeGap / 2;

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

      const hudInterval = mobileLiteMode ? 900 : HUD_SYNC_INTERVAL_MS;

      if (scoreRef.current !== lastDisplayedScoreRef.current) {
        lastDisplayedScoreRef.current = scoreRef.current;
        syncHudState();
        lastHudSyncRef.current = now;
      } else if (now - lastHudSyncRef.current >= hudInterval) {
        lastHudSyncRef.current = now;
        syncHudState();
      }

      const dpr = clamp(window.devicePixelRatio || 1, 1, DPR_CAP);

      drawScene(
        ctx,
        dpr,
        worldWidth,
        worldHeight,
        ceilingHeight,
        floorHeight,
        difficulty.pipeGap,
        pipeWidth,
        tokenSize,
        tokenX,
        tokenYRef.current,
        velocityRef.current,
        pipesRef.current,
        mobileLiteMode
      );

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
    difficulty.gravity,
    difficulty.pipeGap,
    difficulty.pipeSpawnEvery,
    difficulty.pipeSpeed,
    endGame,
    endlessMode,
    floorHeight,
    gameState,
    highScore,
    isPortrait,
    minScore,
    mobileLiteMode,
    onPass,
    pipeWidth,
    syncHudState,
    tokenSize,
    tokenX,
    worldHeight,
    worldWidth,
  ]);

  const statusText = useMemo(() => {
    if (gameState === "passed") return "Trial Complete";
    if (gameState === "gameover") return "Trial Failed";
    if (gameState === "countdown") return "Prepare";
    if (gameState === "playing") {
      return endlessMode ? "Endless In Motion" : "In Motion";
    }
    return "Trial Available";
  }, [endlessMode, gameState]);

  const hudTop = isSmallViewport ? 10 : 20;
  const hudSide = isSmallViewport ? 10 : 22;
  const hudGap = isSmallViewport ? 6 : 10;
  const hudPad = isSmallViewport ? "7px 9px" : "10px 14px";
  const hudFont = isSmallViewport ? 11 : 14;
  const hudStatWidth = isSmallViewport ? 66 : 102;
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

  const scoreDisplay = score;
  const showCompactEntry = gameState === "idle";
  const hideLeftPillsOnMobile = mobileLiteMode && gameState === "playing";

  const hudCardStyle = {
    borderRadius: 14,
    background: mobileLiteMode
      ? "rgba(5,14,22,0.92)"
      : "rgba(5,14,22,0.72)",
    border: mobileLiteMode
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(255,255,255,0.1)",
  } as const;

  const frameSizeStyle = isFullscreen
    ? { width: "100vw", height: "100dvh" }
    : mobileLiteMode
      ? {
          width: "100%",
          height: "min(78vh, 680px)",
          minHeight: "480px",
        }
      : { width: `${sceneWidth}px`, height: `${sceneHeight}px` };

  const worldStyle = mobileLiteMode
    ? {
        position: "absolute" as const,
        inset: 0,
        width: `${worldWidth}px`,
        height: `${worldHeight}px`,
        background: "#02060e",
        overflow: "hidden",
        borderRadius: isFullscreen ? "0px" : "20px",
        border: "none",
        boxShadow: "none",
      }
    : {
        position: "absolute" as const,
        left: isFullscreen ? "50%" : 0,
        top: isFullscreen ? "50%" : 0,
        width: `${worldWidth}px`,
        height: `${worldHeight}px`,
        background: "#02060e",
        transform: isFullscreen
          ? `translate(-50%, -50%) scale(${sceneScale})`
          : `scale(${sceneScale})`,
        transformOrigin: isFullscreen ? "center center" : "top left",
        overflow: "hidden",
        borderRadius: isFullscreen ? "0px" : "28px",
        border: isFullscreen ? "none" : "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          isFullscreen || mobileLiteMode
            ? "none"
            : "inset 0 0 0 1px rgba(0,255,180,0.04)",
        backfaceVisibility: "hidden" as const,
      };

  const gameView = (
    <div className="jal-tokenfit-shell" aria-label="JAL's Trials Token Fit">
      {!isFullscreen && (
        <div className="jal-tokenfit-inline-head">
          <div className="jal-bay-head">
            <div className="jal-bay-title">JAL’s Trials ~ Token Fit</div>
            <div className="jal-bay-note">{statusText}</div>
          </div>

          <p className="jal-note">
            Keep the token stable under movement. Tap the screen or press Space
            to lift. Reach a best score of <strong>{minScore}</strong>. Endless
            mode stays live after threshold.
          </p>
        </div>
      )}

      <div
        className={
          isFullscreen
            ? "jal-tokenfit-fullscreen"
            : "jal-tokenfit-stage-wrap"
        }
      >
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
          style={frameSizeStyle}
        >
          <div style={worldStyle}>
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: `${worldWidth}px`,
                height: `${worldHeight}px`,
                display: "block",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          </div>

          {!hideLeftPillsOnMobile && (
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
                  ...hudCardStyle,
                  padding: hudPad,
                  color: "#f6fffb",
                  fontSize: hudFont,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                JAL’s Trials
              </div>

              {!isSmallViewport && !mobileLiteMode && (
                <div
                  style={{
                    ...hudCardStyle,
                    padding: hudPad,
                    color: "#c7fce8",
                    fontSize: hudFont,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {endlessMode ? "Token Fit Endless" : "Token Fit"}
                </div>
              )}
            </div>
          )}

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
                ...hudCardStyle,
                minWidth: hudStatWidth,
                padding: hudPad,
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
              <div style={{ fontSize: hudStatValue, fontWeight: 700 }}>
                {scoreDisplay}
              </div>
            </div>

            <div
              style={{
                ...hudCardStyle,
                minWidth: hudStatWidth,
                padding: hudPad,
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
              <div style={{ fontSize: hudStatValue, fontWeight: 700 }}>
                {highScore}
              </div>
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
                  ...hudCardStyle,
                  padding: hudPad,
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
                  boxShadow: mobileLiteMode
                    ? "none"
                    : "0 0 22px rgba(0,255,180,0.08)",
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
                  width: mobileLiteMode ? "min(92vw, 360px)" : overlayCardWidth,
                  maxWidth: "100%",
                  textAlign: "center",
                  padding: isSmallViewport ? "22px 18px" : "28px 26px",
                  borderRadius: 24,
                  background: "rgba(4,12,18,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: mobileLiteMode
                    ? "none"
                    : "0 0 24px rgba(0,255,180,0.08)",
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
                    fontSize: isSmallViewport ? 26 : 34,
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
                  Player: <strong>{safeUsername || "Unassigned"}</strong> ·
                  Score: <strong>{score}</strong> · Required best:{" "}
                  <strong>{minScore}</strong> · Best: <strong>{highScore}</strong>
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

          {gameState === "playing" && !mobileLiteMode && (
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

          {gameState === "playing" && mobileLiteMode && (
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
                border: "1px solid rgba(0,255,180,0.22)",
                background: "rgba(0,255,180,0.10)",
                color: "#d9fff1",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "none",
                zIndex: 7,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
            >
              Lift
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const leaderboardView = (
    <section className="jal-trial-leaderboard">
      <div className="jal-trial-leaderboard-head">
        <div className="jal-trial-leaderboard-title">Gate 01 Global Leaderboard</div>
        <div className="jal-trial-leaderboard-note">
          Global Top {LEADERBOARD_LIMIT}
        </div>
      </div>

      <div className="jal-trial-leaderboard-list">
        {leaderboard.length === 0 ? (
          <div className="jal-trial-leaderboard-empty">
            No global entries yet. Start the trial to set the first record.
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <article
              key={entry.id}
              className={`jal-trial-leaderboard-row ${
                index === 0 ? "is-rank-1" : ""
              }`}
            >
              <div className="jal-trial-leaderboard-rank">#{index + 1}</div>

              <div className="jal-trial-leaderboard-player">
                <div className="jal-trial-leaderboard-name">{entry.username}</div>
                <div className="jal-trial-leaderboard-sub">Gate 01 Trial</div>
              </div>

              <div className="jal-trial-leaderboard-score">
                <div className="jal-trial-leaderboard-score-k">Score</div>
                <div className="jal-trial-leaderboard-score-v">{entry.score}</div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );

  if (showCompactEntry) {
    return (
      <>
        <div className="jal-trial-entry" aria-label="JAL's Trials Token Fit">
          <div className="jal-bay-head">
            <div className="jal-bay-title">JAL’s Trials ~ Token Fit</div>
            <div className="jal-bay-note">Trial Available</div>
          </div>

          <p className="jal-trial-note">
            Keep the token stable under movement. Reach a best score of{" "}
            <strong>{minScore}</strong> to complete Gate 01. Endless mode
            activates after reaching the required score.
          </p>

          <div className="jal-trial-preview">
            <div className="jal-trial-preview-badge">Trial 01</div>
            <div className="jal-trial-preview-title">
              Hold alignment under pressure.
            </div>
            <div className="jal-trial-preview-line">
              Your token stays in motion. Your job is not panic. Your job is fit.
            </div>
          </div>

          <div className="jal-trial-grid">
            <article className="jal-trial-card">
              <div className="jal-trial-k">Player</div>
              <div className="jal-trial-v">
                {canStart ? safeUsername : "Set Gate 01 username above"}
              </div>
            </article>

            <article className="jal-trial-card">
              <div className="jal-trial-k">Control</div>
              <div className="jal-trial-v">
                Tap screen to lift. Desktop also supports Space.
              </div>
            </article>

            <article className="jal-trial-card">
              <div className="jal-trial-k">Threshold</div>
              <div className="jal-trial-v">Required best score: {minScore}</div>
            </article>

            <article className="jal-trial-card">
              <div className="jal-trial-k">Mode</div>
              <div className="jal-trial-v">
                {endlessMode ? "Endless active" : "Standard run"}
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
              disabled={!canStart}
            >
              Start Trial
            </button>
          </div>

          {!canStart && (
            <p className="jal-lock-text" style={{ marginTop: "1rem" }}>
              Enter a Gate 01 username with at least 3 characters to start.
            </p>
          )}
        </div>

        {leaderboardView}
      </>
    );
  }

  if (isFullscreen && typeof document !== "undefined" && document.body) {
    return createPortal(gameView, document.body);
  }

  return (
    <>
      {gameView}
      {leaderboardView}
    </>
  );
}