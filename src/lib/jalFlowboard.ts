export type FlowboardPreviewItem = {
  id: string;
  label: string;
  value: string;
  note: string;
};

export type FlowboardBoundaryItem = {
  id: string;
  title: string;
  body: string;
};

export type FlowboardFuturePanel = {
  id: string;
  title: string;
  status: string;
  body: string;
};

export const flowboardCopy = {
  title: "JALSOL Flowboard",
  subtitle: "Watch-only preview",
  line: "See the trail. Keep your keys.",
  lead:
    "A future read-only crypto flow dashboard for public addresses, source labels, snapshots, and export-friendly history.",
  boundary:
    "JAL/SOL helps visitors check public links, preview the path, and watch the build. It does not create keys, store seed phrases, sign transactions, process trades, or manage assets.",
};

export const flowboardPreviewItems: FlowboardPreviewItem[] = [
  {
    id: "public-addresses",
    label: "Public Addresses",
    value: "Watch-only",
    note: "Follow public records without asking for private keys or seed phrases.",
  },
  {
    id: "read-only-imports",
    label: "Read-Only Imports",
    value: "Later",
    note: "Future account imports would be view-only and never withdrawal-enabled.",
  },
  {
    id: "aud-snapshot",
    label: "AUD Snapshot",
    value: "Planned",
    note: "Simple portfolio values and historical snapshots for easier reading.",
  },
  {
    id: "history-csv",
    label: "History + CSV",
    value: "Planned",
    note: "Downloadable history for personal records when the tool is ready.",
  },
  {
    id: "source-labels",
    label: "Source Labels",
    value: "Planned",
    note: "Clear labels showing where each public record or price view comes from.",
  },
];

export const flowboardBoundaryItems: FlowboardBoundaryItem[] = [
  {
    id: "no-keys",
    title: "No keys",
    body: "No private keys, seed phrases, or signing prompts.",
  },
  {
    id: "no-custody",
    title: "No custody",
    body: "No holding, safekeeping, pooled balances, or withdrawal control.",
  },
  {
    id: "no-trades",
    title: "No in-site trades",
    body: "No sending, swaps, staking, buy/sell flow, or transaction handling.",
  },
  {
    id: "no-promises",
    title: "No promises",
    body: "No ownership, repayment, managed portfolio, or future claim.",
  },
];

export const flowboardFuturePanels: FlowboardFuturePanel[] = [
  {
    id: "address-watch",
    title: "Address Watch",
    status: "Preview",
    body: "A clean place to view public addresses and their source labels.",
  },
  {
    id: "flow-map",
    title: "Flow Map",
    status: "Planned",
    body: "A visual trail for public movements and historical snapshots.",
  },
  {
    id: "export-station",
    title: "Export Station",
    status: "Planned",
    body: "CSV-ready history for personal records once live data is approved.",
  },
];
