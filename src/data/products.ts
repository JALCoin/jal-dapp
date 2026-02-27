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
  image?: string; // public path: "/shop/xyz.jpg"
};

const EMAIL = "358jal@gmail.com";

function mailto(subject: string, bodyLines?: string[]) {
  const s = encodeURIComponent(subject);
  const body = encodeURIComponent((bodyLines ?? []).join("\n"));
  return `mailto:${EMAIL}?subject=${s}${bodyLines?.length ? `&body=${body}` : ""}`;
}

function preorderMailto(subject: string) {
  return mailto(subject, [
    "Name:",
    "Phone (optional):",
    "Shipping suburb/postcode:",
    "",
    "Order request:",
    "- Qty:",
    "- Notes:",
    "",
    "Preferred contact method: email / sms",
  ]);
}

/**
 * Sovereign storefront:
 * - JALSOL direct checkout will live here long-term
 * - Etsy stays as a small outbound link elsewhere (not a product card)
 *
 * Images:
 * - Put files in: /public/shop/
 * - Then reference: image: "/shop/your-file.jpg"
 */
export const PRODUCTS: Product[] = [
  {
    id: "hoodie-embroidered-xxl",
    title: "JALSOL Embroidered Hoodie (XXL)",
    kind: "physical",
    status: "coming_soon",
    priceNote: "$130.00 AUD",
    summary:
      "Premium embroidered hoodie drop. Flagship wearable release — structured, limited, and consistent with the JALSOL aesthetic.",
    tags: ["Physical", "Handmade", "Premium", "Preorder", "Limited"],
    image: "/shop/hoodie-xxl.jpg",
    links: [
      {
        label: "Pre-order",
        href: preorderMailto("Pre-order — JALSOL Embroidered Hoodie (XXL) — $130.00 AUD"),
      },
      {
        label: "Enquire",
        href: mailto("Enquiry — JALSOL Embroidered Hoodie (XXL)"),
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
        href: mailto("Enquiry — JALSOL Embroidered Mini Pillow Plush"),
      },
    ],
  },

  {
    id: "solid-gold-cuff",
    title: "Solid Gold JALSOL Cuff",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Enquire for price",
    summary:
      "Solid gold JALSOL cuff — sculpted open-form design. Precision metalwork, weight-balanced, made-to-order statement piece.",
    tags: ["Physical", "Handmade", "One-of-One", "Premium", "Limited"],
    image: "/shop/solid-gold-cuff.jpg",
    links: [
      {
        label: "Enquire (Quote)",
        href: mailto("Enquiry — Solid Gold JALSOL Cuff (Quote Request)", [
          "Name:",
          "Phone (optional):",
          "",
          "Gold purity: 9k / 14k / 18k / 24k",
          "Wrist circumference (mm):",
          "Finish: polished / matte / brushed",
          "Engraving: yes/no (details):",
          "",
          "Notes:",
        ]),
      },
      {
        label: "Pre-register",
        href: mailto("Pre-register — Solid Gold JALSOL Cuff"),
      },
    ],
  },
];

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status !== "archived");
}