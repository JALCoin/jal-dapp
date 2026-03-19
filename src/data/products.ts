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
  isSupport?: boolean;
};

const EMAIL = "358jal@gmail.com";

const STRIPE_LINKS = {
  support25: "https://donate.stripe.com/28EcN438Y98f0m3dUU0x202",
  support50: "https://donate.stripe.com/28EaEWaBqdov4Cj7ww0x203",
  support75: "https://donate.stripe.com/4gM5kCeRG2JR2ub7ww0x204",
  support100: "https://donate.stripe.com/28EdR89xm2JR4CjbMM0x205",
  support150: "https://donate.stripe.com/6oU00i7pe4RZ1q70440x206",

  hoodieXXL: "https://buy.stripe.com/cNi00ifVKbgn6Kr6ss0x207",
  miniPillow: "",

  internalDialogueEntry: "https://buy.stripe.com/4gM28q24Ubgn3yfg320x208",
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

  if (options.enquiryHref) {
    links.push({
      label: options.enquiryLabel ?? "Enquire",
      href: options.enquiryHref,
    });
  }

  return links;
}

export const PRODUCTS: Product[] = [
  {
    id: "system-support-25",
    title: "System Support — $25",
    kind: "digital",
    status: "active",
    priceNote: "$25.00 AUD",
    summary:
      "Entry-level support into the JALSOL system. A signal of alignment and early-stage participation.",
    tags: ["Digital", "Support", "New"],
    image: "/shop/system-support.jpg",
    isSupport: true,
    links: buildLinks({
      stripeHref: STRIPE_LINKS.support25,
      stripeLabel: "Donate",
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
    image: "/shop/system-support.jpg",
    isSupport: true,
    links: buildLinks({
      stripeHref: STRIPE_LINKS.support50,
      stripeLabel: "Donate",
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
    image: "/shop/system-support.jpg",
    isSupport: true,
    links: buildLinks({
      stripeHref: STRIPE_LINKS.support75,
      stripeLabel: "Donate",
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
    image: "/shop/system-support.jpg",
    isSupport: true,
    links: buildLinks({
      stripeHref: STRIPE_LINKS.support100,
      stripeLabel: "Donate",
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
    tags: ["Digital", "Support", "Premium"],
    image: "/shop/system-support.jpg",
    isSupport: true,
    links: buildLinks({
      stripeHref: STRIPE_LINKS.support150,
      stripeLabel: "Donate",
    }),
  },

  {
    id: "jal-internal-dialogue-method-entry-layer",
    title: "JAL’s Internal Dialogue Method — Entry Layer",
    kind: "digital",
    status: STRIPE_LINKS.internalDialogueEntry ? "active" : "coming_soon",
    priceNote: "$29.00 AUD",
    summary:
      "A structured method for stabilising internal dialogue, improving verbal clarity, and completing thought under pressure. Built from direct observation, sequence, and repeatable use.",
    tags: ["Digital", "New", "Premium"],
    image: "/shop/digital-product-1.jpg",
    links: buildLinks({
      stripeHref: STRIPE_LINKS.internalDialogueEntry || undefined,
      stripeLabel: "Buy Now",
      enquiryHref: mailto(
        "Enquiry — JAL’s Internal Dialogue Method — Entry Layer",
        [
          "Name:",
          "Question:",
          "",
          "Product: JAL’s Internal Dialogue Method — Entry Layer",
        ]
      ),
      enquiryLabel: STRIPE_LINKS.internalDialogueEntry
        ? "Enquire"
        : "Join Waitlist",
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
    links: STRIPE_LINKS.hoodieXXL
      ? [
          {
            label: "Claim",
            href: STRIPE_LINKS.hoodieXXL,
          },
        ]
      : [
          {
            label: "Pre-order via Email",
            href: preorderMailto(
              "Pre-order — JALSOL Embroidered Hoodie (XXL) — $130.00 AUD"
            ),
          },
        ],
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
      enquiryHref: preorderMailto(
        "Pre-order — JALSOL Embroidered Mini Pillow Plush — $17.50 AUD"
      ),
      enquiryLabel: STRIPE_LINKS.miniPillow ? "Enquire" : "Pre-order via Email",
    }),
  },

  {
    id: "solid-gold-cuff",
    title: "JALSOL Gold Cuff — Private Allocation",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Private allocation",
    summary:
      "Made-to-order solid gold cuff with sculpted open-form geometry. Allocation is handled privately in crypto for aligned participants within the JALSOL system.",
    tags: ["Physical", "Handmade", "One-of-One", "Premium", "Limited"],
    image: "/shop/solid-gold-cuff.jpg",
    links: buildLinks({
      enquiryHref: quoteMailto(
        "Enquiry — JALSOL Gold Cuff (Private Allocation)",
        [
          "Preferred payment: SOL / USDC / other",
          "Estimated budget range:",
          "Wrist circumference (mm):",
          "Finish: polished / matte / brushed",
          "Engraving: yes / no (details):",
        ]
      ),
      enquiryLabel: "Request Access",
    }),
  },
];

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status !== "archived");
}