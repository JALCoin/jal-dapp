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
      lead="These terms explain who operates the JALSOL public business domain, what the current public offer includes, and which Australian consumer rights continue to apply."
      badges={["Founder domain", "Sole trader", "ABN identified", "Physical merch", "Source-backed"]}
      facts={LEGAL_OPERATOR_FACTS}
      sections={[
        {
          title: "Who Operates This Site",
          paragraphs: [
            "As reviewed on 10 April 2026, ABN Lookup lists ABN 35 780 648 234 in the name of Jeremy Aaron Lugg as an active Individual / Sole Trader in Western Australia.",
            "This public site is presented under Jeremy Aaron Lugg's own name. Unless a page expressly says otherwise, orders, public site activities and related support on this site are supplied by Jeremy Aaron Lugg.",
            "business.gov.au explains that an ABN identifies a business to government, other businesses and the public. It does not by itself create a separate company or a financial-services licence.",
          ],
          note: "business.gov.au explains that a sole trader's legal name is generally their own name.",
        },
        {
          title: "Name Use And Registrations",
          paragraphs: [
            "business.gov.au states that you generally do not need to register a business name if you trade only under your own name or a shortened form of it. If you trade under a different name, separate business name registration may be required.",
            "These terms identify Jeremy Aaron Lugg as the legal operator of the public site and do not state that a separate company or separate legal entity exists.",
            "Project names, internal tool names or product labels used elsewhere do not change the legal operator identified in these terms unless a page expressly says otherwise.",
          ],
          note: "If the public site later trades under a different public business name, the current business-name position should be checked against ASIC and business.gov.au guidance.",
        },
        {
          title: "Current Site Activities",
          bullets: JALSOL_ACTIVITY_BULLETS,
          note: "The current public shop is narrowed to physical merch and physical commissions while interactive features remain paused.",
        },
        {
          title: "Orders, Payments And Site Use",
          paragraphs: [
            "Prices, availability, product descriptions and site scope can change over time. Orders and access flows may depend on third-party systems such as payment processors, hosting, shipping carriers and authentication providers.",
            "By using the site, you remain responsible for your own device security, addresses, shipping details and compliance with the laws that apply to you.",
          ],
          bullets: [
            "Third-party providers may apply their own terms, policies, fees and operational limits.",
            "Interactive onboarding, wallet, builder and engine pages may be paused, redirected or unavailable while registrations and legal settings are reviewed.",
            "General site content is not a promise of market outcome, profit or regulatory approval.",
          ],
        },
        {
          title: "Home Dispatch, Invoices And Tax Position",
          paragraphs: [
            "As reviewed on 10 April 2026, ABN Lookup shows Jeremy Aaron Lugg as an active Individual / Sole Trader and not currently registered for GST. ATO guidance says GST registration becomes compulsory if current or projected GST turnover reaches the registration threshold, and registration is then generally required within 21 days.",
            "ATO guidance also says businesses that are not GST-registered should not represent their documents as tax invoices or charge GST as though they are registered. Site order confirmations and payment records should therefore match the current GST status shown on ABN Lookup unless that status later changes.",
          ],
          bullets: [
            "Dispatch may occur from a home-based business setting, subject to the operator's local council rules, lease conditions, strata rules, insurance settings and any other property rules that apply.",
            "Business income, expenses and records should be kept in line with ATO record-keeping requirements.",
            "Customers remain responsible for any customs, duties, import restrictions or local taxes that apply after shipment leaves the operator's control.",
          ],
          note: "If GST registration, storage arrangements or dispatch locations change, these terms should be updated to reflect the new operating position.",
        },
        {
          title: "Australian Consumer Law Rights",
          paragraphs: [
            "ACCC guidance says consumer guarantees automatically apply when businesses sell goods and services to consumers, and those rights cannot be taken away by a 'no refunds' statement or contrary term.",
            "Nothing in these terms removes any right to a repair, replacement, refund, cancellation or other remedy that applies under the Australian Consumer Law.",
          ],
          bullets: [
            "Change-of-mind refunds are not automatically required unless they are separately offered.",
            "If a physical item or another paid site service has a major problem, the available remedy depends on the Australian Consumer Law and the facts.",
            `For faults, non-delivery or support issues, contact ${LEGAL_CONTACT_EMAIL} first so the issue can be assessed and handled.`,
          ],
          note: "A site term cannot lawfully exclude consumer guarantees that apply.",
        },
        {
          title: "Product Safety, Labelling And Online Selling",
          paragraphs: [
            "business.gov.au guidance says goods supplied in Australia may need to comply with product safety rules, bans, recalls, information standards and labelling requirements depending on the product category.",
            "ACCC online-selling guidance also expects clear pricing, accurate descriptions and honest statements about availability, delivery and customer rights.",
          ],
          bullets: [
            "Product names, images, materials, sizing and made-to-order descriptions should be kept accurate and updated if the offer changes.",
            "If a product category later attracts a mandatory safety standard, information standard or recall requirement, fulfilment should pause until the listing and product comply.",
            "Origin, dispatch timing and fulfilment claims should not be overstated or presented in a misleading way.",
          ],
        },
        {
          title: "Regulatory Boundary",
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
        OFFICIAL_SOURCES.homeBasedBusiness,
        OFFICIAL_SOURCES.gstRegistering,
        OFFICIAL_SOURCES.taxInvoices,
        OFFICIAL_SOURCES.recordKeeping,
        OFFICIAL_SOURCES.buyingOnline,
        OFFICIAL_SOURCES.consumerRights,
        OFFICIAL_SOURCES.refunds,
        OFFICIAL_SOURCES.productSafety,
        OFFICIAL_SOURCES.productLabelling,
        OFFICIAL_SOURCES.digitalAssets,
        OFFICIAL_SOURCES.discussingOnline,
        OFFICIAL_SOURCES.austracVaspOverview,
      ]}
    />
  );
}
