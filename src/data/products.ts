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
  | "Bundle"
  | "Premium"
  | "Preorder";

export type ProductLink = {
  label: string;
  href: string;
};

export type Product = {
  id: string;
  title: string;
  kind: ProductKind;
  status: ProductStatus;
  priceNote?: string; // ex: "$130.00 AUD", "Enquire for price"
  summary: string;
  tags?: ProductTag[];
  links: ProductLink[];
  image?: string; // optional local path: "/shop/xyz.jpg"
};

const EMAIL = "358jal@gmail.com";

function preorderMailto(subject: string) {
  const s = encodeURIComponent(subject);
  const body = encodeURIComponent(
    [
      "Name:",
      "Phone (optional):",
      "Shipping suburb/postcode:",
      "",
      "Order request:",
      "- Qty:",
      "- Notes:",
      "",
      "Preferred contact method: email / sms",
    ].join("\n")
  );
  return `mailto:${EMAIL}?subject=${s}&body=${body}`;
}

/**
 * Sovereign storefront:
 * - JALSOL direct checkout will live here long-term
 * - Etsy stays as a small outbound link elsewhere (not the core product)
 */
export const PRODUCTS: Product[] = [
  {
    id: "hoodie-embroidered-xxl",
    title: "JALSOL Embroidered Hoodie (XXL)",
    kind: "physical",
    status: "coming_soon",
    priceNote: "$130.00 AUD",
    summary:
      "Premium embroidered hoodie drop. Built as a flagship wearable release — structured, limited, and consistent with the JALSOL aesthetic.",
    tags: ["Physical", "Handmade", "Premium", "Preorder", "Limited"],
    image: "/shop/hoodie-xxl.jpg",
    links: [
      {
        label: "Pre-order",
        href: preorderMailto("Pre-order — JALSOL Embroidered Hoodie (XXL) — $130.00 AUD"),
      },
      {
        label: "Enquire",
        href: `mailto:${EMAIL}?subject=${encodeURIComponent(
          "Enquiry — JALSOL Embroidered Hoodie (XXL)"
        )}`,
      },
    ],
  },

  {
    id: "mini-pillow-plush",
    title: "JALSOL Embroidered Mini Pillow Plush",
    kind: "physical",
    status: "coming_soon",
    priceNote: "$17.50 AUD",
    summary:
      "Mini plush drop — clean embroidery, collectible vibe, easy entry item. Designed for repeatable production + consistent finish.",
    tags: ["Physical", "Handmade", "Preorder", "New"],
    image: "/shop/mini-pillow-plush.jpg",
    links: [
      {
        label: "Pre-order",
        href: preorderMailto(
          "Pre-order — JALSOL Embroidered Mini Pillow Plush — $17.50 AUD"
        ),
      },
      {
        label: "Enquire",
        href: `mailto:${EMAIL}?subject=${encodeURIComponent(
          "Enquiry — JALSOL Embroidered Mini Pillow Plush"
        )}`,
      },
    ],
  },

  {
    id: "solid-gold-bracelet-band",
    title: "Solid Gold JALSOL Bracelet Band",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Enquire for price",
    summary:
      "Solid gold band — bespoke enquiry-only piece. Material/weight/finish options handled privately before quoting.",
    tags: ["Physical", "Handmade", "One-of-One", "Premium", "Limited"],
    image: "/shop/solid-gold-band.jpg",
    links: [
      {
        label: "Enquire (Quote)",
        href: `mailto:${EMAIL}?subject=${encodeURIComponent(
          "Enquiry — Solid Gold JALSOL Bracelet Band (Quote Request)"
        )}&body=${encodeURIComponent(
          [
            "Name:",
            "Phone (optional):",
            "",
            "Gold purity (if known): 9k / 14k / 18k / 24k",
            "Approx. size (mm) or wrist circumference:",
            "Finish: polished / matte / brushed",
            "Engraving: yes/no (details):",
            "",
            "Notes:",
          ].join("\n")
        )}`,
      },
      {
        label: "Pre-register",
        href: preorderMailto("Pre-register — Solid Gold JALSOL Bracelet Band (Enquiry)"),
      },
    ],
  },
];

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status !== "archived");
}