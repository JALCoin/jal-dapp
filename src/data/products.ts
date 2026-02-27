// src/data/products.ts

export type ProductKind = "physical" | "digital";
export type ProductStatus = "active" | "coming_soon" | "archived";

export type ProductTag =
  | "New"
  | "Limited"
  | "Handmade"
  | "One-of-One"
  | "Digital"
  | "Physical"
  | "Bundle";

export type ProductLink = {
  label: string;
  href: string;
};

export type Product = {
  id: string;
  title: string;
  kind: ProductKind;
  status: ProductStatus;
  priceNote?: string; // ex: "AUD — varies", "From $11"
  summary: string;
  tags?: ProductTag[];
  links: ProductLink[];
  image?: string; // optional local path: "/shop/xyz.jpg"
};

export const PRODUCTS: Product[] = [
  {
    id: "etsy-hub",
    title: "JALRelics — Etsy Storefront",
    kind: "physical",
    status: "active",
    priceNote: "AUD — listing-based",
    summary:
      "Physical relics, wearable pieces, and shop drops. The canonical storefront for public releases.",
    tags: ["Physical", "Handmade"],
    links: [
      { label: "Open Etsy Shop", href: "https://jalrelics.etsy.com" },
    ],
  },
  {
    id: "jalsol-hub",
    title: "jalsol.com — Hub",
    kind: "digital",
    status: "active",
    priceNote: "Live",
    summary:
      "The structured hub for releases, inventory, and modules. Store UI will live here over time.",
    tags: ["Digital"],
    links: [{ label: "Open jalsol.com", href: "https://jalsol.com" }],
  },

  // ---- Add real products below as you release them ----
  {
    id: "drop-001",
    title: "Drop 001 — Relic Pack",
    kind: "physical",
    status: "coming_soon",
    priceNote: "TBD",
    summary:
      "First structured drop. Placeholder entry so the grid layout is proven.",
    tags: ["Limited", "Bundle", "Physical"],
    links: [{ label: "Etsy (when live)", href: "https://jalrelics.etsy.com" }],
  },
  {
    id: "digital-001",
    title: "Digital Release — Print / Blueprint",
    kind: "digital",
    status: "coming_soon",
    priceNote: "TBD",
    summary:
      "Digital goods slot (prints, guides, templates). Placeholder entry for the store pipeline.",
    tags: ["Digital", "New"],
    links: [{ label: "jalsol.com (when live)", href: "https://jalsol.com" }],
  },
];

export function getActiveProducts() {
  return PRODUCTS.filter((p) => p.status !== "archived");
}