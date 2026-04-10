import LegalDocument from "../components/LegalDocument";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR_FACTS,
  LEGAL_REVIEWED_ON,
  OFFICIAL_SOURCES,
} from "../lib/legal";

export default function Privacy() {
  return (
    <LegalDocument
      title="Privacy"
      kicker="Privacy And Information Handling"
      updated={LEGAL_REVIEWED_ON}
      lead="This page explains what personal information JALSOL may handle through the store, onboarding flow, support channels and technical operations, and how requests can be made."
      badges={["Orders", "Wallet metadata", "Support", "Access requests", "OAIC-guided"]}
      facts={LEGAL_OPERATOR_FACTS}
      sections={[
        {
          title: "Scope And Operator",
          paragraphs: [
            "This page applies to the current JALSOL website, merch store, onboarding flow, support contact and related technical operations. The site is operated by Jeremy Aaron Lugg under ABN 35 780 648 234.",
            "OAIC guidance says many small businesses with annual turnover of $3 million or less are not covered by the Privacy Act 1988 unless an exception applies. This page is published for transparency regardless, and because privacy expectations can change if business activities change.",
          ],
          note: "If the site later becomes a reporting entity under AML/CTF law, trades in personal information, or otherwise falls within a Privacy Act exception, privacy obligations may expand.",
        },
        {
          title: "What Information May Be Collected",
          bullets: [
            "Names, email addresses, shipping details and other contact information you provide.",
            "Order records, payment status, invoice references and fulfilment notes.",
            "Wallet addresses, signed messages and public blockchain transaction references submitted during onboarding or verification.",
            "Authentication, session, browser, device, IP and security-log data created through normal site operation.",
            "Support messages, feedback and other correspondence you send to the operator.",
          ],
          note: "OAIC guidance says personal information collection should be limited to what is reasonably necessary for the activity being carried out.",
        },
        {
          title: "Why Information Is Used",
          bullets: [
            "To create and manage sign-in, access and support records.",
            "To process payments, match orders, arrange shipping and manage fulfilment.",
            "To verify onboarding steps such as wallet ownership, signatures and payment confirmation.",
            "To maintain records, reduce fraud risk, investigate misuse and keep the site operating securely.",
            "To respond to customer questions, complaints and service requests.",
          ],
          note: "This page does not say that personal information is sold. If that activity ever changed, this policy would need to change too.",
        },
        {
          title: "Service Providers And External Systems",
          paragraphs: [
            "Personal information may be handled by providers used to run the site, such as Stripe for checkout, Supabase for authentication or data storage, hosting or analytics providers, shipping providers, email providers and public blockchain or wallet infrastructure when you submit wallet information.",
            "Some providers may process or store data outside Australia, depending on their own infrastructure and configuration. External providers have their own privacy terms and operational practices.",
          ],
          note: "Where a third-party platform processes your payment, blockchain interaction or login, some information will also be handled under that provider's own policy.",
        },
        {
          title: "Storage, Security And Blockchain Limits",
          paragraphs: [
            "Reasonable steps are taken to limit access to information and to retain records only as reasonably necessary for orders, onboarding, support, security and legal record-keeping.",
            "Public blockchain records, wallet addresses and transaction data cannot necessarily be amended, recalled or erased once published to a blockchain or public network.",
          ],
          bullets: [
            "Security measures reduce risk but cannot guarantee absolute security.",
            "You should avoid submitting unnecessary sensitive information through wallet notes, public transaction memos or general contact forms.",
          ],
        },
        {
          title: "Access, Correction And Complaints",
          paragraphs: [
            `You can request access to, or correction of, personal information held by JALSOL by contacting ${LEGAL_CONTACT_EMAIL}. Identity verification may be required before information is released or amended.`,
            "If the Privacy Act applies to the relevant activity and an issue cannot be resolved directly, OAIC complaint pathways may be available.",
          ],
          bullets: [
            "Include your name, contact details and enough detail to identify the information you want to access or correct.",
            "Requests should describe the record or activity concerned, such as an order, onboarding submission or account email.",
            "Access requests are generally free, though OAIC guidance says a reasonable charge can apply in some cases for providing access.",
          ],
          note: "This policy is intended to be practical and transparent, but it should not be read as a claim that every JALSOL activity is automatically covered by the Privacy Act in every circumstance.",
        },
      ]}
      sources={[
        OFFICIAL_SOURCES.abnLookup,
        OFFICIAL_SOURCES.protectCustomers,
        OFFICIAL_SOURCES.privacyPolicy,
        OFFICIAL_SOURCES.privacySmallBusiness,
        OFFICIAL_SOURCES.privacyRightsResponsibilities,
        OFFICIAL_SOURCES.whatIsPersonalInformation,
        OFFICIAL_SOURCES.collectPersonalInfo,
        OFFICIAL_SOURCES.useDisclosure,
        OFFICIAL_SOURCES.accessPersonalInfo,
        OFFICIAL_SOURCES.correctPersonalInfo,
      ]}
    />
  );
}
