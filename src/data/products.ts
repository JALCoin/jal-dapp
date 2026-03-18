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
  | "Preorder"
  | "Support";

export type ProductLink = {
  label: string;
  href: string;
};

export type Product = {
  id: string;
  title: string;
  kind: ProductKind;
  status: ProductStatus;
  priceNote?: string;
  summary: string;
  tags?: ProductTag[];
  links: ProductLink[];
  image?: string;
};

const EMAIL = "358jal@gmail.com";
const ETSY_SHOP = "https://jalrelics.etsy.com";

/**
 * Replace these with your real Stripe Payment Links
 * once each product is created in Stripe Dashboard.
 */
const STRIPE_LINKS = {
  hoodieXXL: "",
  miniPillow: "",
  goldCuffDeposit: "",
};

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

function quoteMailto(subject: string, bodyLines?: string[]) {
  return mailto(subject, [
    "Name:",
    "Phone (optional):",
    "",
    ...(bodyLines ?? []),
    "",
    "Notes:",
  ]);
}

function buildLinks(options: {
  stripeHref?: string;
  stripeLabel?: string;
  etsyHref?: string;
  enquiryHref?: string;
  enquiryLabel?: string;
}): ProductLink[] {
  const links: ProductLink[] = [];

  if (options.stripeHref) {
    links.push({
      label: options.stripeLabel ?? "Buy Now",
      href: options.stripeHref,
    });
  }

  if (options.etsyHref) {
    links.push({
      label: "Etsy",
      href: options.etsyHref,
    });
  }

  if (options.enquiryHref) {
    links.push({
      label: options.enquiryLabel ?? "Enquire",
      href: options.enquiryHref,
    });
  }

  return links;
}

/**
 * Storefront ordering:
 * 1. flagship wearable
 * 2. accessible entry product
 * 3. premium quote / made-to-order piece
 *
 * Status guidance:
 * - active: live now, buyable / actionable
 * - coming_soon: visible but not yet direct checkout ready
 * - archived: hidden from storefront
 */
export const PRODUCTS: Product[] = [
// ---------- SYSTEM SUPPORT (DIGITAL) ----------

{
  id: "system-support-25",
  title: "System Support — $25",
  kind: "digital",
  status: "active",
  priceNote: "$25.00 AUD",
  summary:
    "Entry-level support into the JALSOL system. A signal of alignment and early-stage participation.",
  tags: ["Digital", "Support", "New"],
  links: buildLinks({
    stripeHref: "", // add Stripe later
    stripeLabel: "Support",
    enquiryHref: mailto("System Support — $25"),
  }),
},

{
  id: "system-support-50",
  title: "System Support — $50",
  kind: "digital",
  status: "active",
  priceNote: "$50.00 AUD",
  summary:
    "Mid-tier support level. Strengthens position and contribution into the system structure.",
  tags: ["Digital", "Support"],
  links: buildLinks({
    stripeHref: "",
    stripeLabel: "Support",
    enquiryHref: mailto("System Support — $50"),
  }),
},

{
  id: "system-support-75",
  title: "System Support — $75",
  kind: "digital",
  status: "active",
  priceNote: "$75.00 AUD",
  summary:
    "Elevated support layer. Positioned for those moving with stronger intent.",
  tags: ["Digital", "Support"],
  links: buildLinks({
    stripeHref: "",
    stripeLabel: "Support",
    enquiryHref: mailto("System Support — $75"),
  }),
},

{
  id: "system-support-100",
  title: "System Support — $100",
  kind: "digital",
  status: "active",
  priceNote: "$100.00 AUD",
  summary:
    "High-tier support level. Signals commitment to progression within the JALSOL system.",
  tags: ["Digital", "Support", "Premium"],
  links: buildLinks({
    stripeHref: "",
    stripeLabel: "Support",
    enquiryHref: mailto("System Support — $100"),
  }),
},

{
  id: "system-support-150",
  title: "System Support — $150",
  kind: "digital",
  status: "active",
  priceNote: "$150.00 AUD",
  summary:
    "Top support tier. Reserved for those aligning deeper with system direction and future access.",
  tags: ["Digital", "Support", "Premium", "Limited"],
  links: buildLinks({
    stripeHref: "",
    stripeLabel: "Support",
    enquiryHref: mailto("System Support — $150"),
  }),
},
  {
    id: "hoodie-embroidered-xxl",
    title: "JALSOL Embroidered Hoodie (XXL)",
    kind: "physical",
    status: STRIPE_LINKS.hoodieXXL ? "active" : "coming_soon",
    priceNote: "$130.00 AUD",
    summary:
      "Flagship embroidered wearable release. Structured, limited, and aligned with the JALSOL storefront aesthetic.",
    tags: ["Physical", "Handmade", "Premium", "Preorder", "Limited"],
    image: "/shop/hoodie-xxl.jpg",
    links: buildLinks({
      stripeHref: STRIPE_LINKS.hoodieXXL || undefined,
      stripeLabel: "Pre-order",
      etsyHref: ETSY_SHOP,
      enquiryHref: preorderMailto(
        "Pre-order — JALSOL Embroidered Hoodie (XXL) — $130.00 AUD"
      ),
      enquiryLabel: STRIPE_LINKS.hoodieXXL ? "Enquire" : "Pre-order via Email",
    }),
  },

  {
    id: "mini-pillow-plush",
    title: "JALSOL Embroidered Mini Pillow Plush",
    kind: "physical",
    status: STRIPE_LINKS.miniPillow ? "active" : "coming_soon",
    priceNote: "$17.50 AUD",
    summary:
      "Collectible mini plush with clean embroidery and a simple entry price point. Designed for repeatable production and consistent finish.",
    tags: ["Physical", "Handmade", "Preorder", "New"],
    image: "/shop/mini-pillow-plush.jpg",
    links: buildLinks({
      stripeHref: STRIPE_LINKS.miniPillow || undefined,
      stripeLabel: "Buy Now",
      etsyHref: ETSY_SHOP,
      enquiryHref: preorderMailto(
        "Pre-order — JALSOL Embroidered Mini Pillow Plush — $17.50 AUD"
      ),
      enquiryLabel: STRIPE_LINKS.miniPillow ? "Enquire" : "Pre-order via Email",
    }),
  },

  {
    id: "solid-gold-cuff",
    title: "Solid Gold JALSOL Cuff",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Enquire for price",
    summary:
      "Made-to-order solid gold cuff with sculpted open-form geometry. Precision metalwork, premium finish, and one-off statement-piece positioning.",
    tags: ["Physical", "Handmade", "One-of-One", "Premium", "Limited"],
    image: "/shop/solid-gold-cuff.jpg",
    links: buildLinks({
      stripeHref: STRIPE_LINKS.goldCuffDeposit || undefined,
      stripeLabel: "Reserve",
      enquiryHref: quoteMailto(
        "Enquiry — Solid Gold JALSOL Cuff (Quote Request)",
        [
          "Gold purity: 9k / 14k / 18k / 24k",
          "Wrist circumference (mm):",
          "Finish: polished / matte / brushed",
          "Engraving: yes / no (details):",
        ]
      ),
      enquiryLabel: "Enquire (Quote)",
    }),
  },

  // Example future digital product
  // {
  //   id: "jalsol-guide-level-1",
  //   title: "JALSOL Level 1 Guide",
  //   kind: "digital",
  //   status: "coming_soon",
  //   priceNote: "$29.00 AUD",
  //   summary:
  //     "A structured onboarding guide for entering the cryptocurrency market through JALSOL order-of-operations.",
  //   tags: ["Digital", "New", "Premium"],
  //   image: "/shop/jalsol-guide-level-1.jpg",
  //   links: buildLinks({
  //     stripeHref: "",
  //     stripeLabel: "Buy Now",
  //     enquiryHref: mailto("Enquiry — JALSOL Level 1 Guide"),
  //   }),
  // },
];

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status !== "archived");
}