import LegalDocument from "../components/LegalDocument";
import {
  JALSOL_ACTIVITY_BULLETS,
  JALSOL_BOUNDARY_BULLETS,
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR_FACTS,
  LEGAL_REVIEWED_ON,
  OFFICIAL_SOURCES,
} from "../lib/legal";

export default function Terms() {
  return (
    <LegalDocument
      title="Terms"
      kicker="Site Terms"
      updated={LEGAL_REVIEWED_ON}
      lead="These terms explain who currently operates JALSOL, what activities the site presently offers, and which Australian consumer rights continue to apply."
      badges={["Sole trader", "ABN identified", "Physical merch", "Paid onboarding", "Read-only engine"]}
      facts={LEGAL_OPERATOR_FACTS}
      sections={[
        {
          title: "Who Operates JALSOL",
          paragraphs: [
            "As reviewed on 10 April 2026, ABN Lookup lists ABN 35 780 648 234 in the name of Jeremy Aaron Lugg as an active Individual / Sole Trader in Western Australia.",
            "On this site, JALSOL is used as the public-facing site, brand and project name. Unless a page expressly says otherwise, orders, onboarding activities and related support on this site are supplied by Jeremy Aaron Lugg.",
            "business.gov.au explains that an ABN identifies a business to government, other businesses and the public. It does not by itself turn JALSOL into a separate company or a financial-services licence.",
          ],
          note: "business.gov.au explains that a sole trader's legal name is generally their own name.",
        },
        {
          title: "Name Use And Registrations",
          paragraphs: [
            "business.gov.au states that you generally do not need to register a business name if you trade only under your own name or a shortened form of it. If you trade under a different name, separate business name registration may be required.",
            "These terms identify the legal operator and the public site name, but they do not state that JALSOL is a separate company or separate legal entity.",
            "If any ASIC business-name registration for JALSOL is still pending or not yet approved, site orders and onboarding activities are still supplied by Jeremy Aaron Lugg under ABN 35 780 648 234.",
          ],
          note: "If JALSOL is relied on as a trading name distinct from Jeremy Aaron Lugg, the current business-name position should be checked against ASIC and business.gov.au guidance.",
        },
        {
          title: "Current Site Activities",
          bullets: JALSOL_ACTIVITY_BULLETS,
          note: "The current public shop has been narrowed to physical merch and physical commissions rather than digital download products.",
        },
        {
          title: "Orders, Payments And Site Use",
          paragraphs: [
            "Prices, availability, product descriptions and onboarding scope can change over time. Orders and access flows may depend on third-party systems such as payment processors, hosting, wallet tools, shipping carriers and authentication providers.",
            "By using the site, you remain responsible for your own wallet decisions, device security, addresses, shipping details and compliance with the laws that apply to you.",
          ],
          bullets: [
            "Third-party providers may apply their own terms, policies, fees and operational limits.",
            "The public engine page is informational and read-only. It is not a customer trading terminal.",
            "General site content is not a promise of market outcome, profit or regulatory approval.",
          ],
        },
        {
          title: "Australian Consumer Law Rights",
          paragraphs: [
            "ACCC guidance says consumer guarantees automatically apply when businesses sell goods and services to consumers, and those rights cannot be taken away by a 'no refunds' statement or contrary term.",
            "Nothing in these terms removes any right to a repair, replacement, refund, cancellation or other remedy that applies under the Australian Consumer Law.",
          ],
          bullets: [
            "Change-of-mind refunds are not automatically required unless they are separately offered.",
            "If a physical item or paid onboarding service has a major problem, the available remedy depends on the Australian Consumer Law and the facts.",
            `For faults, non-delivery or support issues, contact ${LEGAL_CONTACT_EMAIL} first so the issue can be assessed and handled.`,
          ],
          note: "A site term cannot lawfully exclude consumer guarantees that apply.",
        },
        {
          title: "Crypto And Trading Boundary",
          bullets: JALSOL_BOUNDARY_BULLETS,
          note: "If site activities later expand into exchange, custody, arranging trades, copy-trading, pooled capital or token-sale financial services, a different legal review may be needed.",
        },
      ]}
      sources={[
        OFFICIAL_SOURCES.abnLookup,
        OFFICIAL_SOURCES.registerAbn,
        OFFICIAL_SOURCES.businessNamesLegalNames,
        OFFICIAL_SOURCES.registerBusinessName,
        OFFICIAL_SOURCES.businessRegistrations,
        OFFICIAL_SOURCES.legalEssentials,
        OFFICIAL_SOURCES.consumerRights,
        OFFICIAL_SOURCES.refunds,
        OFFICIAL_SOURCES.digitalAssets,
        OFFICIAL_SOURCES.discussingOnline,
        OFFICIAL_SOURCES.austracVaspOverview,
      ]}
    />
  );
}
