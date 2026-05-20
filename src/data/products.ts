// src/data/products.ts

export type ProductKind = "physical" | "digital";
export type ProductStatus = "active" | "coming_soon" | "archived";
export type ProductCategory = "apparel" | "jewellery" | "private";

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
  availability?: string;
  category: ProductCategory;
  summary: string;
  tags?: ProductTag[];
  links: ProductLink[];
  image?: string;
  isSupport?: boolean;
};

const EMAIL = "358jal@gmail.com";

function mailto(subject: string, bodyLines?: string[]) {
  const s = encodeURIComponent(subject);
  const body = encodeURIComponent((bodyLines ?? []).join("\n"));
  return `mailto:${EMAIL}?subject=${s}${bodyLines?.length ? `&body=${body}` : ""}`;
}

function enquiryMailto(subject: string) {
  return mailto(subject, [
    "Name:",
    "Phone (optional):",
    "Shipping suburb/postcode:",
    "",
    "Enquiry:",
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

export const PRODUCTS: Product[] = [
  {
    id: "hoodie-embroidered-xxl",
    title: "JALSOL Embroidered Hoodie (XXL)",
    kind: "physical",
    status: "active",
    priceNote: "$130.00 AUD",
    availability: "Limited run enquiry",
    category: "apparel",
    summary: "Premium heavyweight embroidered release.",
    tags: ["Limited", "Handmade", "Premium"],
    image: "/shop/hoodie-xxl.jpg",
    links: [
      {
        label: "Enquire Now",
        href: enquiryMailto("Enquiry - JALSOL Embroidered Hoodie (XXL) - $130.00 AUD"),
      },
    ],
  },
  {
    id: "solid-gold-cuff",
    title: "JALSOL Gold Cuff - Private Order",
    kind: "physical",
    status: "coming_soon",
    priceNote: "Private order",
    availability: "Made individually",
    category: "private",
    summary: "Private commission gold cuff.",
    tags: ["One-of-One", "Handmade", "Premium"],
    image: "/shop/solid-gold-cuff.jpg",
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
