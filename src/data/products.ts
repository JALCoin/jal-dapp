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
  hoodieXXL: "https://buy.stripe.com/cNi00ifVKbgn6Kr6ss0x207",
  miniPillow: "",
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
    id: "hoodie-embroidered-xxl",
    title: "JALSOL Embroidered Hoodie (XXL)",
    kind: "physical",
    status: STRIPE_LINKS.hoodieXXL ? "active" : "coming_soon",
    priceNote: "$130.00 AUD",
    summary:
      "Flagship embroidered wearable release with a structured, limited run and a heavier premium finish.",
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
            href: preorderMailto("Pre-order - JALSOL Embroidered Hoodie (XXL) - $130.00 AUD"),
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
      "Collectible mini plush with clean embroidery, simple entry pricing, and a repeatable physical production format.",
    tags: ["Physical", "Handmade", "Preorder", "New"],
    image: "/shop/mini-pillow-plush.jpg",
    links: buildLinks({
      stripeHref: STRIPE_LINKS.miniPillow || undefined,
      stripeLabel: "Buy Now",
      enquiryHref: preorderMailto(
        "Pre-order - JALSOL Embroidered Mini Pillow Plush - $17.50 AUD"
      ),
      enquiryLabel: STRIPE_LINKS.miniPillow ? "Enquire" : "Pre-order via Email",
    }),
  },
  {
    id: "solid-gold-cuff",
    title: "JALSOL Gold Cuff - Private Order",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Private order",
    summary:
      "Made-to-order solid gold cuff with sculpted open-form geometry for one-to-one commission requests.",
    tags: ["Physical", "Handmade", "One-of-One", "Premium", "Limited"],
    image: "/shop/solid-gold-cuff.jpg",
    links: buildLinks({
      enquiryHref: quoteMailto("Enquiry - JALSOL Gold Cuff (Private Order)", [
        "Preferred payment: AUD / SOL / USDC / other",
        "Estimated budget range:",
        "Wrist circumference (mm):",
        "Finish: polished / matte / brushed",
        "Engraving: yes / no (details):",
      ]),
      enquiryLabel: "Request Access",
    }),
  },
];

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status !== "archived");
}
