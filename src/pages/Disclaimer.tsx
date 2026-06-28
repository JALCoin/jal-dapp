import LegalDocument from "../components/LegalDocument";
import {
  JALSOL_ACTIVITY_BULLETS,
  JALSOL_BOUNDARY_BULLETS,
  LEGAL_OPERATOR_FACTS,
  LEGAL_REVIEWED_ON,
  OFFICIAL_SOURCES,
} from "../lib/legal";

export default function Disclaimer() {
  return (
    <LegalDocument
      title="Disclaimer"
      kicker="General Information And Risk Boundary"
      updated={LEGAL_REVIEWED_ON}
      lead="This page explains the current public boundary of the JALSOL business domain, including what the site does and does not present to visitors at this time."
      badges={["No personal advice", "Founder domain", "Read-only Flowboard", "Not an exchange", "Source-backed"]}
      facts={LEGAL_OPERATOR_FACTS}
      sections={[
        {
          title: "No Personal Advice",
          paragraphs: [
            "Content on this site is general technical, product, legal-boundary and observational information only. It is not personal financial product advice, legal advice, tax advice, accounting advice, medical advice or a promise of business outcome.",
            "If you need advice about licensing, business structure, regulated products or legal obligations, you should obtain professional advice tailored to your circumstances.",
          ],
        },
        {
          title: "What The Public Site Currently Is",
          bullets: JALSOL_ACTIVITY_BULLETS,
          note: "This public site is described here as a business site operated by Jeremy Aaron Lugg, not as a separate licensed financial-services entity.",
        },
        {
          title: "What The Public Site Currently Is Not",
          bullets: JALSOL_BOUNDARY_BULLETS,
          note: "No statement on this site should be read as an invitation to place trades, complete wallet actions, transfer assets, provide private keys, use a public trading account through the site, or expect JALSOL to manage assets.",
        },
        {
          title: "JAL/SOL And Flowboard Boundary",
          paragraphs: [
            "The JAL/SOL page is a public explorer for official links, a simple external-path explanation, build signals, optional support-address information, JALSOL Arcade, and the static Flowboard preview.",
            "The Flowboard preview is watch-only. It does not collect public addresses, connect to exchange accounts, store API credentials, show live portfolio data, provide account-specific valuation, or allow a visitor to move assets.",
            "The Raydium link on JAL/SOL is an external output-only link. Any decision to use Raydium or another third-party tool happens outside JALSOL and under that provider's own interface, terms, risks and controls.",
          ],
          note: "This boundary is deliberate because ASIC and AUSTRAC guidance can treat wallet, payment, exchange, safekeeping, transfer-instruction and arranging services differently from read-only public information.",
        },
        {
          title: "Third-Party And Service Risk",
          bullets: [
            "Third-party providers such as payment processors, shipping carriers, hosting providers, email providers and identity systems have their own outages, fees, delays, risks and terms.",
            "Public legal and business information can become outdated as laws, registrations, platforms and business settings change.",
            "Interactive features may be paused, redirected or removed while compliance settings are reviewed.",
            "External services linked from the site have their own terms and privacy settings.",
          ],
        },
        {
          title: "Retail And Home-Based Business Limits",
          paragraphs: [
            "This public site should presently be read as a small sole-trader online retail site with home-dispatched physical orders, not as a warehousing, marketplace or platform-operator business.",
            "Home-based business settings can still be affected by council rules, lease terms, strata by-laws, insurance conditions, shipping restrictions, product safety obligations and tax-registration thresholds.",
          ],
          note: "The legal pages are published for transparency only and should not be read as a guarantee that every future product or operating change is automatically compliant without further review.",
        },
        {
          title: "Regulatory Boundary",
          paragraphs: [
            "ASIC guidance says digital asset arrangements must be assessed by their rights, benefits, features and how they are promoted or used in practice. ASIC also says digital asset wallets, custodial or non-custodial, may be non-cash payment facilities where users can make payments to third parties.",
            "AUSTRAC guidance for virtual asset designated services includes exchange, arranging exchange, safekeeping, private-key control, transfer and related virtual asset services when provided in the course of carrying on a business as a virtual asset service provider.",
            "JALSOL therefore keeps the public JAL/SOL and Flowboard surfaces static and read-only at this stage.",
          ],
          note: "This disclaimer describes the current site boundary only. If the site later expands into customer trading, custody, exchange services, payment features, wallet verification workflows, live account imports, pooled funds, API-key storage or token-offer financial services, a new legal review should be done before those features go live.",
        },
        {
          title: "Responsibility For Use",
          paragraphs: [
            "You remain responsible for your own legal, tax, regulatory and commercial decisions.",
            "Use of the site, public legal pages, static information and external tools is at your own judgment and subject to the separate rules of the providers you choose to use.",
          ],
        },
      ]}
      sources={[
        OFFICIAL_SOURCES.abnLookup,
        OFFICIAL_SOURCES.homeBasedBusiness,
        OFFICIAL_SOURCES.gstRegistering,
        OFFICIAL_SOURCES.buyingOnline,
        OFFICIAL_SOURCES.productSafety,
        OFFICIAL_SOURCES.digitalAssets,
        OFFICIAL_SOURCES.discussingOnline,
        OFFICIAL_SOURCES.austracVirtualAssets,
        OFFICIAL_SOURCES.austracVaspOverview,
      ]}
    />
  );
}
