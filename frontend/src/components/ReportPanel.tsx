import { Download, ShieldCheck, ExternalLink } from "lucide-react";
import type { Report, Source } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
export function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="source-links">
      {sources
        .filter((s) => {
          try {
            const url = new URL(s.url);
            return url.protocol === "https:" || url.protocol === "http:";
          } catch {
            return false;
          }
        })
        .map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            {s.title}
            <ExternalLink size={13} />
          </a>
        ))}
    </div>
  );
}
export function ReportPanel({ report }: { report: Report }) {
  const { t } = useLanguage();
  const r = report.result;
  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agribovix-report-${report.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const researchSources = r.sources.filter(
    (source) => source.snippet || source.content,
  );
  const researchLabel =
    r.research_status === "complete"
      ? t("report.researchComplete")
      : r.research_status === "partial"
        ? t("report.researchPartial")
        : r.research_status === "no_results"
          ? t("report.researchEmpty")
          : t("report.researchUnavailable");
  const researchSummary = t(
    r.research_status === "complete"
      ? "report.researchSummaryComplete"
      : r.research_status === "partial"
        ? "report.researchSummaryPartial"
        : r.research_status === "no_results"
          ? "report.researchSummaryEmpty"
          : "report.researchSummaryUnavailable",
  );
  const urgency = t(`report.urgency.${r.urgency}`);
  const sections = [
    { title: t("report.observations"), items: r.observations },
    { title: t("report.nextSteps"), items: r.care_steps },
    { title: t("report.care"), items: r.prevention },
    { title: t("report.treatment"), items: r.treatment_options },
    { title: t("report.limitations"), items: r.limitations },
  ];
  return (
    <article className="panel report-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("report.badge")}</span>
          <h2>{r.subject}</h2>
        </div>
        <button
          className="icon-button"
          onClick={download}
          aria-label={t("report.download")}
        >
          <Download size={20} />
        </button>
      </div>
      <section>
        <h3>{t("report.possibleIssue")}</h3>
        <p>{r.possible_condition || t("report.noCondition")}</p>
      </section>
      <div className="report-meta">
        <span>{r.model_name}</span>
        <span>
          {r.confidence === null
            ? t("report.noConfidence")
            : t("report.confidence", {
                value: Math.round(r.confidence * 100),
              })}
        </span>
        <span>{urgency}</span>
      </div>
      <section className="research-results" aria-live="polite">
        <div className="research-heading">
          <h3>{t("report.researchTitle")}</h3>
          <span
            className={`research-status ${r.research_status || "unavailable"}`}
          >
            {researchLabel}
          </span>
        </div>
        <p>{t("report.researchIntro")}</p>
        <p>{r.research_message ? researchSummary : t("report.oldResearch")}</p>
        <p className="muted">{t("report.sourceLanguageNote")}</p>
        {r.research_message && (
          <details className="research-detail">
            <summary>{t("report.providerDetails")}</summary>
            <p>{r.research_message}</p>
          </details>
        )}
        {researchSources.length > 0 ? (
          <div className="research-source-list">
            {researchSources.map((source) => (
              <article className="research-source" key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                  <ExternalLink size={13} />
                </a>
                {source.snippet && <p>{source.snippet}</p>}
                {source.content && (
                  <details>
                    <summary>
                      {source.retrieved
                        ? t("report.viewContent")
                        : t("report.viewSnippet")}
                    </summary>
                    <p>{source.content}</p>
                  </details>
                )}
              </article>
            ))}
          </div>
        ) : (
          researchSources.length === 0 &&
          r.research_status === "no_results" && (
            <p>{t("report.noSources")}</p>
          )
        )}
      </section>
      {sections.map(
        ({ title, items }) =>
          items.length > 0 && (
            <section key={title}>
              <h3>{title}</h3>
              <ul>
                {items.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </section>
          ),
      )}
      {r.urgency !== "routine" && (
        <section>
          <h3>{t("report.expert")}</h3>
          <p>
            {t("report.expertAdvice", {
              expert:
                report.workspace === "agrivision"
                  ? t("report.agriExpert")
                  : t("report.vet"),
            })}
          </p>
        </section>
      )}
      <Sources
        sources={r.sources.filter(
          (source) => !source.snippet && !source.content,
        )}
      />
      <p className="notice">
        <ShieldCheck size={18} />
        {t("report.safety", {
          expert:
            report.workspace === "agrivision"
              ? t("report.agriExpert")
              : t("report.vet"),
        })}
      </p>
    </article>
  );
}
