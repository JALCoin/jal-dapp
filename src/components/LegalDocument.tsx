import { Link } from "react-router-dom";
import type { LegalFact, LegalSection, LegalSource } from "../lib/legal";
import { ABN_LOOKUP_URL, LEGAL_CONTACT_MAILTO } from "../lib/legal";
import { usePageMeta } from "../hooks/usePageMeta";

type LegalDocumentProps = {
  title: string;
  kicker: string;
  updated: string;
  lead: string;
  badges?: string[];
  facts?: LegalFact[];
  sections: LegalSection[];
  sources: LegalSource[];
};

export default function LegalDocument(props: LegalDocumentProps) {
  usePageMeta(props.title, props.lead);

  return (
    <main className="home-shell legal-page" aria-label={props.title}>
      <div className="home-wrap legal-wrap">
        <section className="card machine-surface panel-frame legal-card legal-card--hero">
          <div className="legal-kicker">{props.kicker}</div>
          <h1 className="home-title">{props.title}</h1>
          <p className="home-lead legal-lead">{props.lead}</p>
          <p className="legal-updated">Last reviewed: {props.updated}</p>

          <div className="home-links legal-hero-links">
            <Link className="chip" to="/app/legal">
              Legal Hub
            </Link>
            <Link className="chip" to="/app/about">
              About Jeremy
            </Link>
            <a className="chip" href={LEGAL_CONTACT_MAILTO}>
              Contact
            </a>
            <a className="chip" href={ABN_LOOKUP_URL} target="_blank" rel="noreferrer">
              ABN Lookup
            </a>
          </div>

          {props.badges?.length ? (
            <div className="legal-badges" aria-label="Document highlights">
              {props.badges.map((badge) => (
                <span key={badge} className="legal-badge">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {props.facts?.length ? (
          <section className="card machine-surface panel-frame legal-card">
            <div className="legal-section-title">Business Identity</div>
            <div className="legal-facts">
              {props.facts.map((fact) => (
                <article key={fact.label} className="legal-fact">
                  <div className="legal-fact-label">{fact.label}</div>
                  <div className="legal-fact-value">
                    {fact.href ? (
                      <a href={fact.href} target="_blank" rel="noreferrer">
                        {fact.value}
                      </a>
                    ) : (
                      fact.value
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="legal-section-grid">
          {props.sections.map((section) => (
            <section key={section.title} className="card machine-surface panel-frame legal-card">
              <div className="legal-section-title">{section.title}</div>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="legal-paragraph">
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length ? (
                <ul className="legal-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}

              {section.note ? <p className="legal-note">{section.note}</p> : null}
            </section>
          ))}
        </div>

        <section className="card machine-surface panel-frame legal-card">
          <div className="legal-section-title">Official Sources</div>
          <p className="legal-paragraph">
            Australian government and regulator pages used to review this document on {props.updated}.
          </p>

          <ul className="legal-source-list">
            {props.sources.map((source) => (
              <li key={source.href}>
                <a className="legal-source-link" href={source.href} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
