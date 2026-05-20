// src/data/products.ts

export type ProductKind = "physical" | "digital";
export type ProductStatus = "active" | "coming_soon" | "archived";
export type ProductCategory = "apparel" | "accessories" | "desk" | "private";

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
  | "Support"
  | "Concept"
  | "Supplier Sourced"
  | "Register Interest"
  | "Quote Only"
  | "Stripe Ready";

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
  availability?: string;
  category: ProductCategory;
  summary: string;
  tags?: ProductTag[];
  links: ProductLink[];
  image?: string;
  isSupport?: boolean;
};

const EMAIL = "358jal@gmail.com";
const BRAND_PLACEHOLDER = "/JALSOL1.gif";

function mailto(subject: string, bodyLines?: string[]) {
  const s = encodeURIComponent(subject);
  const body = encodeURIComponent((bodyLines ?? []).join("\n"));
  return `mailto:${EMAIL}?subject=${s}${bodyLines?.length ? `&body=${body}` : ""}`;
}

function interestMailto(subject: string) {
  return mailto(subject, [
    "Name:",
    "Phone (optional):",
    "Shipping suburb/postcode:",
    "",
    "Interest:",
    "- Product:",
    "- Preferred size / colour:",
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

export const PRODUCTS: Product[] = [
  {
    id: "jalsol-logo-cap",
    title: "JALSOL Logo Cap",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Target: $35-$55 AUD",
    availability: "Supplier sample planned",
    category: "accessories",
    summary: "Low-risk first release candidate.",
    tags: ["Concept", "Supplier Sourced", "Register Interest", "Stripe Ready"],
    image: BRAND_PLACEHOLDER,
    links: [
      {
        label: "Register Interest",
        href: interestMailto("Interest - JALSOL Logo Cap"),
      },
    ],
  },
  {
    id: "jalsol-oversized-tee",
    title: "JALSOL Oversized Tee",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Target: $45-$70 AUD",
    availability: "Supplier sample planned",
    category: "apparel",
    summary: "Simple apparel test before larger runs.",
    tags: ["Concept", "Supplier Sourced", "Register Interest"],
    image: BRAND_PLACEHOLDER,
    links: [
      {
        label: "Register Interest",
        href: interestMailto("Interest - JALSOL Oversized Tee"),
      },
    ],
  },
  {
    id: "jalsol-embroidered-hoodie",
    title: "JALSOL Embroidered Hoodie",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Target: $120-$160 AUD",
    availability: "Sample required before checkout",
    category: "apparel",
    summary: "Flagship apparel concept for a future limited run.",
    tags: ["Concept", "Supplier Sourced", "Premium", "Register Interest"],
    image: BRAND_PLACEHOLDER,
    links: [
      {
        label: "Register Interest",
        href: interestMailto("Interest - JALSOL Embroidered Hoodie"),
      },
    ],
  },
  {
    id: "jalsol-sticker-pack",
    title: "JALSOL Sticker Pack",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Target: $12-$18 AUD",
    availability: "Stripe-ready candidate",
    category: "accessories",
    summary: "Small entry item for testing demand.",
    tags: ["Concept", "Supplier Sourced", "Stripe Ready"],
    image: BRAND_PLACEHOLDER,
    links: [
      {
        label: "Register Interest",
        href: interestMailto("Interest - JALSOL Sticker Pack"),
      },
    ],
  },
  {
    id: "jalsol-desk-mat",
    title: "JALSOL Desk Mat",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Target: $35-$65 AUD",
    availability: "Supplier sample planned",
    category: "desk",
    summary: "Creator desk object for a practical first batch.",
    tags: ["Concept", "Supplier Sourced", "Register Interest"],
    image: BRAND_PLACEHOLDER,
    links: [
      {
        label: "Register Interest",
        href: interestMailto("Interest - JALSOL Desk Mat"),
      },
    ],
  },
  {
    id: "solid-gold-cuff",
    title: "JALSOL Gold Cuff - Private Order",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Quote only",
    availability: "Private future enquiry",
    category: "private",
    summary: "Future quote-only jewellery concept.",
    tags: ["Concept", "One-of-One", "Premium", "Quote Only"],
    image: BRAND_PLACEHOLDER,
    links: [
      {
        label: "Enquire Now",
        href: quoteMailto("Enquiry - JALSOL Gold Cuff (Private Order)", [
          "Preferred payment: AUD / SOL / USDC / other",
          "Estimated budget range:",
          "Wrist circumference (mm):",
          "Finish: polished / matte / brushed",
          "Engraving: yes / no (details):",
        ]),
      },
    ],
  },
];

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status !== "archived");
}
