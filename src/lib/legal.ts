export type LegalFact = {
  label: string;
  value: string;
  href?: string;
};

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
};

export type LegalSource = {
  label: string;
  href: string;
};

export const LEGAL_REVIEWED_ON = "10 April 2026";
export const LEGAL_OPERATOR_NAME = "Jeremy Aaron Lugg";
export const LEGAL_ABN = "35 780 648 234";
export const LEGAL_CONTACT_EMAIL = "358jal@gmail.com";
export const LEGAL_CONTACT_MAILTO = `mailto:${LEGAL_CONTACT_EMAIL}`;
export const ABN_LOOKUP_URL = "https://abr.business.gov.au/ABN/View?id=35780648234";

export const OFFICIAL_SOURCES = {
  abnLookup: {
    label: "ABN Lookup - Current details for ABN 35 780 648 234",
    href: ABN_LOOKUP_URL,
  },
  registerAbn: {
    label: "business.gov.au - Register for an Australian Business Number",
    href: "https://business.gov.au/registrations/register-for-an-australian-business-number-abn",
  },
  businessNamesLegalNames: {
    label: "business.gov.au - Business names, trading names and legal names",
    href: "https://business.gov.au/planning/new-businesses/business-names-trading-names-and-legal-names",
  },
  businessRegistrations: {
    label: "business.gov.au - Work out your business registrations",
    href: "https://business.gov.au/registrations/work-out-your-business-registrations",
  },
  registerBusinessName: {
    label: "business.gov.au - Register your business name",
    href: "https://business.gov.au/registrations/register-your-business-name",
  },
  legalEssentials: {
    label: "business.gov.au - Legal essentials for business",
    href: "https://business.gov.au/legal/legal-essentials-for-business",
  },
  homeBasedBusiness: {
    label: "business.gov.au - Home-based businesses",
    href: "https://business.gov.au/planning/business-structures-and-types/home-based-businesses",
  },
  gstRegistering: {
    label: "ATO - Registering for GST",
    href: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst",
  },
  taxInvoices: {
    label: "ATO - Tax invoices",
    href: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/invoicing/tax-invoices",
  },
  recordKeeping: {
    label: "ATO - Overview of record-keeping rules for business",
    href: "https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business",
  },
  buyingOnline: {
    label: "ACCC - Buying online",
    href: "https://www.accc.gov.au/consumers/buying-products-and-services/buying-online",
  },
  protectCustomers: {
    label: "business.gov.au - Protect your customers' information",
    href: "https://business.gov.au/online-and-digital/cyber-security/protect-your-customers-information",
  },
  privacyPolicy: {
    label: "OAIC - What is a privacy policy?",
    href: "https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-a-privacy-policy",
  },
  privacySmallBusiness: {
    label: "OAIC - Small business",
    href: "https://www.oaic.gov.au/_old/privacy/privacy-for-organisations/small-business",
  },
  privacyRightsResponsibilities: {
    label: "OAIC - Rights and responsibilities under the Privacy Act",
    href: "https://www.oaic.gov.au/privacy/privacy-legislation/the-privacy-act/rights-and-responsibilities",
  },
  whatIsPersonalInformation: {
    label: "OAIC - What is personal information?",
    href: "https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-personal-information",
  },
  collectPersonalInfo: {
    label: "OAIC - Collection of personal information",
    href: "https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/collection-of-personal-information",
  },
  useDisclosure: {
    label: "OAIC - Use and disclosure of personal information",
    href: "https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/use-and-disclosure-of-personal-information",
  },
  accessPersonalInfo: {
    label: "OAIC - Access your personal information",
    href: "https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/access-your-personal-information",
  },
  correctPersonalInfo: {
    label: "OAIC - Correct your personal information",
    href: "https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/correct-your-personal-information",
  },
  consumerRights: {
    label: "ACCC - Consumer rights and guarantees",
    href: "https://www.accc.gov.au/business/treating-customers-fairly/consumers-rights-obligations",
  },
  refunds: {
    label: "ACCC - Repair, replace, refund, cancel",
    href: "https://www.accc.gov.au/consumers/consumer-rights-guarantees/repair-replace-refund",
  },
  productSafety: {
    label: "business.gov.au - Product safety rules and standards",
    href: "https://business.gov.au/legal/fair-trading/product-safety-rules-and-standards",
  },
  productLabelling: {
    label: "business.gov.au - Labelling your products",
    href: "https://business.gov.au/products-and-services/product-labelling/labelling-your-products",
  },
  spam: {
    label: "ACMA - Avoid sending spam",
    href: "https://www.acma.gov.au/avoid-sending-spam",
  },
  digitalAssets: {
    label: "ASIC - Digital assets: Financial products and services",
    href: "https://www.asic.gov.au/regulatory-resources/digital-transformation/digital-assets-financial-products-and-services/",
  },
  discussingOnline: {
    label: "ASIC - Discussing financial products and services online",
    href: "https://www.asic.gov.au/regulatory-resources/financial-services/giving-financial-product-advice/discussing-financial-products-and-services-online",
  },
  austracVirtualAssets: {
    label: "AUSTRAC - Virtual asset services (Reform)",
    href: "https://www.austrac.gov.au/amlctf-reform/reforms-guidance/before-you-start/new-industries-and-services-be-regulated-reform/virtual-asset-services-reform",
  },
  austracVaspOverview: {
    label: "AUSTRAC - Virtual asset service providers overview",
    href: "https://www.austrac.gov.au/industry-and-business/your-industry/virtual-asset-service-providers/virtual-asset-service-providers-overview",
  },
};

export const LEGAL_OPERATOR_FACTS: LegalFact[] = [
  {
    label: "Legal operator",
    value: LEGAL_OPERATOR_NAME,
  },
  {
    label: "ABN",
    value: LEGAL_ABN,
    href: ABN_LOOKUP_URL,
  },
  {
    label: "ABN status",
    value: "Active from 08 Feb 2026 on ABN Lookup",
    href: ABN_LOOKUP_URL,
  },
  {
    label: "Entity type",
    value: "Individual / Sole Trader",
  },
  {
    label: "Main business location",
    value: "WA 6055",
  },
  {
    label: "GST status",
    value: "Not currently registered for GST on ABN Lookup as viewed on 10 April 2026",
    href: ABN_LOOKUP_URL,
  },
  {
    label: "Contact",
    value: LEGAL_CONTACT_EMAIL,
    href: LEGAL_CONTACT_MAILTO,
  },
];

export const JALSOL_ACTIVITY_BULLETS = [
  "A physical merch store with home-dispatched orders and made-to-order physical commissions.",
  "Operator identity, contact details, and source-backed legal information about the current site boundary.",
  "A temporary compliance notice while interactive site features are paused for review.",
  "General business and support information published by Jeremy Aaron Lugg under ABN 35 780 648 234.",
];

export const JALSOL_BOUNDARY_BULLETS = [
  "This site is not currently presented as a public exchange, brokerage, custodian, managed trading service, or live interactive onboarding product.",
  "Interactive site features are temporarily unavailable while registrations and legal settings are reviewed.",
  "If future features move into exchange, custody, brokerage, copy-trading, pooled capital, wallet verification flows, or other regulated financial services, these pages will need to be updated and further legal review may be required.",
];
