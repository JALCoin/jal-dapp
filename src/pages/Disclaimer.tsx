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
      lead="This page explains what JALSOL currently is not, what the public engine page represents, and the limits of the site's crypto-related content."
      badges={["No personal advice", "Not an exchange", "Read-only engine", "Crypto risk", "Source-backed"]}
      facts={LEGAL_OPERATOR_FACTS}
      sections={[
        {
          title: "No Personal Advice",
          paragraphs: [
            "Content on this site is general technical, educational, product and observational information only. It is not personal financial product advice, legal advice, tax advice, accounting advice, medical advice or a promise of investment outcome.",
            "If you need advice about your wallet, tax position, licensing, business structure, regulated products or legal obligations, you should obtain professional advice tailored to your circumstances.",
          ],
        },
        {
          title: "What JALSOL Currently Is",
          bullets: JALSOL_ACTIVITY_BULLETS,
          note: "JALSOL is described here as a site, brand and project surface operated by Jeremy Aaron Lugg, not as a separate licensed exchange entity.",
        },
        {
          title: "What JALSOL Currently Is Not",
          bullets: JALSOL_BOUNDARY_BULLETS,
          note: "No statement on this site should be read as an invitation to place trades through Jeremy Aaron Lugg's personal trading engine or external exchange accounts.",
        },
        {
          title: "Market, Wallet And Third-Party Risk",
          bullets: [
            "Crypto markets are volatile and prices can move rapidly.",
            "Wallet signatures, blockchain transactions and transfers can be irreversible.",
            "External wallets, exchanges, blockchain networks, RPC providers, payment providers and shipping carriers have their own outages, fees, delays, risks and terms.",
            "Educational or technical information can become outdated as laws, platforms and market practices change.",
          ],
        },
        {
          title: "Regulatory Boundary",
          paragraphs: [
            "ASIC guidance says digital asset activities may trigger financial services obligations depending on the rights and benefits involved and the real-world activity being carried on, including dealing, arranging, providing advice, market making or custody.",
            "AUSTRAC guidance says businesses that provide virtual asset services such as exchange, arrangements for exchange, safekeeping or certain financial services connected with virtual assets can fall within registration and AML/CTF obligations.",
          ],
          note: "This disclaimer describes the current site boundary only. If JALSOL later expands into customer trading, custody, exchange services, pooled funds or token-offer financial services, a new legal review should be done before those features go live.",
        },
        {
          title: "Responsibility For Use",
          paragraphs: [
            "You remain responsible for your own wallet security, transaction approvals, tax reporting, regulatory obligations and commercial decisions.",
            "Use of the site, public dashboards, onboarding materials and external tools is at your own judgment and subject to the separate rules of the providers you choose to use.",
          ],
        },
      ]}
      sources={[
        OFFICIAL_SOURCES.abnLookup,
        OFFICIAL_SOURCES.digitalAssets,
        OFFICIAL_SOURCES.discussingOnline,
        OFFICIAL_SOURCES.austracVirtualAssets,
        OFFICIAL_SOURCES.austracVaspOverview,
      ]}
    />
  );
}
