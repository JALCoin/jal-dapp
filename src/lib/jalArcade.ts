import { JAL_COIN } from "./jalCoin";

export type JalArcadeModuleId =
  | "check-first"
  | "pool-compass"
  | "link-runner"
  | "signal-sprint";

export type JalArcadeModuleItem = {
  id: JalArcadeModuleId;
  eyebrow: string;
  title: string;
  route: string;
  status: "Live" | "Coming Soon";
  summary: string;
  command: string;
  available: boolean;
};

export type CrownScanOption = {
  id: string;
  seal: string;
  fragments: [string, string, string];
  value: string;
  isOfficial: boolean;
};

export const arcadeCopy = {
  title: "JALSOL Arcade",
  line: "Check the links. Try the path. Follow the build.",
  lead:
    "A browser terminal for quick scans, clean paths, and public records. No wallet connection. No transaction flow.",
  crownScanFraming: "Four seals detected. One matches the public record.",
  crownScanHint: "Trust the match, not the shine.",
};

export const arcadeModuleItems: JalArcadeModuleItem[] = [
  {
    id: "check-first",
    eyebrow: "Module 01",
    title: "Crown Scan",
    route: "/app/jal-sol/arcade/check-first",
    status: "Live",
    summary: "Four seals detected. One matches the public record.",
    command: "Scan the seal",
    available: true,
  },
  {
    id: "pool-compass",
    eyebrow: "Module 02",
    title: "Pool Compass",
    route: "/app/jal-sol/arcade/pool-compass",
    status: "Coming Soon",
    summary: "Match each official link to what it does.",
    command: "Compass offline",
    available: false,
  },
  {
    id: "link-runner",
    eyebrow: "Module 03",
    title: "Route Runner",
    route: "/app/jal-sol/arcade/link-runner",
    status: "Coming Soon",
    summary: "Trace Start Here, Official Links, Try The Path, then Open Raydium.",
    command: "Route sealed",
    available: false,
  },
  {
    id: "signal-sprint",
    eyebrow: "Module 04",
    title: "Signal Sprint",
    route: "/app/jal-sol/arcade/signal-sprint",
    status: "Coming Soon",
    summary: "Catch the latest build signal and read what changed.",
    command: "Signal pending",
    available: false,
  },
];

export const crownScanOptions: CrownScanOption[] = [
  {
    id: "seal-crown",
    seal: "Seal 01",
    fragments: ["9TCw", "ZBQ3", "gx7v"],
    value: JAL_COIN.mintAddress,
    isOfficial: true,
  },
  {
    id: "seal-mirror",
    seal: "Seal 02",
    fragments: ["9TCw", "ZB03", "gx7v"],
    value: "9TCwNEKKPPgZB03CopjdhW9j8fZNt8SH7waZJTFRgx7v",
    isOfficial: false,
  },
  {
    id: "seal-echo",
    seal: "Seal 03",
    fragments: ["9TCw", "ZBQ3", "gx7x"],
    value: "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7x",
    isOfficial: false,
  },
  {
    id: "seal-static",
    seal: "Seal 04",
    fragments: ["9TCw", "ZBQ8", "gX7v"],
    value: "9TCwNEKKPPgZBQ8CopjdhW9j8fZNt8SH7waZJTFRgX7v",
    isOfficial: false,
  },
];

export function getArcadeModule(id: JalArcadeModuleId) {
  return arcadeModuleItems.find((item) => item.id === id) ?? arcadeModuleItems[0];
}
