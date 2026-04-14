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
      lead="This page explains what personal information Jeremy Aaron Lugg's public site may handle through the merch store, support channels, temporary compliance pages and technical operations, and how requests can be made."
      badges={["Orders", "Support", "Access requests", "Technical operations", "OAIC-guided"]}
      facts={LEGAL_OPERATOR_FACTS}
      sections={[
        {
          title: "Scope And Operator",
          paragraphs: [
            "This page applies to the current public site, merch store, support contact, temporary compliance pages and related technical operations operated by Jeremy Aaron Lugg under ABN 35 780 648 234.",
            "OAIC guidance says many small businesses with annual turnover of $3 million or less are not covered by the Privacy Act 1988 unless an exception applies. This page is published for transparency regardless, and because privacy expectations can change if business activities change.",
          ],
          note: "If the site later becomes a reporting entity under AML/CTF law, trades in personal information, or otherwise falls within a Privacy Act exception, privacy obligations may expand.",
        },
        {
          title: "What Information May Be Collected",
          bullets: [
            "Names, email addresses, shipping details and other contact information you provide.",
            "Order records, payment status, invoice references and fulfilment notes.",
            "Support details, contact records and any optional information you submit through current public forms.",
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
            "To respond to support requests, maintain compliance records and manage temporary public site settings.",
            "To maintain records, reduce fraud risk, investigate misuse and keep the site operating securely.",
            "To respond to customer questions, complaints and service requests.",
          ],
          note: "This page does not say that personal information is sold. If that activity ever changed, this policy would need to change too.",
        },
        {
          title: "Direct Contact And Marketing Messages",
          paragraphs: [
            "Order updates, support replies, fulfilment notices and transactional contact may be sent where reasonably necessary to complete an order or respond to a request.",
            "If marketing emails or similar promotional messages are later sent, ACMA guidance says consent, sender identification and a working unsubscribe pathway should be maintained.",
          ],
          bullets: [
            "Transactional messages about orders, support, refunds or fulfilment are treated differently from optional marketing content.",
            "If you opt out of marketing, operational messages needed to complete an order or handle a complaint may still be sent.",
          ],
        },
        {
          title: "Service Providers And External Systems",
          paragraphs: [
            "Personal information may be handled by providers used to run the site, such as Stripe for checkout, Supabase for authentication or data storage, hosting or analytics providers, shipping providers and email providers.",
            "Some providers may process or store data outside Australia, depending on their own infrastructure and configuration. External providers have their own privacy terms and operational practices.",
          ],
          note: "Where a third-party platform processes your payment, delivery details or login, some information will also be handled under that provider's own policy.",
        },
        {
          title: "Storage And Security",
          paragraphs: [
            "Reasonable steps are taken to limit access to information and to retain records only as reasonably necessary for orders, support, security and legal record-keeping.",
            "Some technical logs and records may be retained by third-party providers under their own operational settings and legal requirements.",
          ],
          bullets: [
            "Security measures reduce risk but cannot guarantee absolute security.",
            "You should avoid submitting unnecessary sensitive information through general contact forms or support channels.",
          ],
        },
        {
          title: "Access, Correction And Complaints",
          paragraphs: [
            `You can request access to, or correction of, personal information held by Jeremy Aaron Lugg through this site by contacting ${LEGAL_CONTACT_EMAIL}. Identity verification may be required before information is released or amended.`,
            "If the Privacy Act applies to the relevant activity and an issue cannot be resolved directly, OAIC complaint pathways may be available.",
          ],
          bullets: [
            "Include your name, contact details and enough detail to identify the information you want to access or correct.",
            "Requests should describe the record or activity concerned, such as an order, support interaction or account email.",
            "Access requests are generally free, though OAIC guidance says a reasonable charge can apply in some cases for providing access.",
          ],
          note: "This policy is intended to be practical and transparent, but it should not be read as a claim that every site activity is automatically covered by the Privacy Act in every circumstance.",
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
        OFFICIAL_SOURCES.spam,
      ]}
    />
  );
}
