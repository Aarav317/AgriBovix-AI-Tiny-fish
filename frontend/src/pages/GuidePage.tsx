import { useOutletContext } from "react-router-dom";
import { ShieldCheck, PhoneCall } from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { Sources } from "../components/ReportPanel";
import { useLanguage } from "../i18n/LanguageContext";
export default function GuidePage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { t } = useLanguage();
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            {t("guide.eyebrow")}
          </span>
          <h1>
            {t(workspace === "agrivision" ? "nav.guideAgri" : "nav.guideAnimal")}
          </h1>
          <p>
            {t("guide.description")}
          </p>
        </div>
        <span className="intro-icon">
          <ShieldCheck size={35} />
        </span>
      </div>
      <div className="guide-grid">
        {c.guideCards.map((card) => (
          <article className="panel guide-card" key={card.title}>
            <span className="circle-icon">
              <card.icon size={25} />
            </span>
            <h2>{t(`guide.${workspace}.${c.guideCards.indexOf(card)}.title`)}</h2>
            <p>{t(`guide.${workspace}.${c.guideCards.indexOf(card)}.text`)}</p>
          </article>
        ))}
      </div>
      {workspace === "pashuvision" && (
        <section className="expert-callout">
          <PhoneCall size={25} />
          <div>
            <h2>{t("guide.urgentTitle")}</h2>
            <p>
              {t("guide.urgentText")}
            </p>
          </div>
        </section>
      )}
      <section className="panel sources-panel">
        <span className="eyebrow">{t("guide.sourceEyebrow")}</span>
        <h2>{t("guide.sourcesTitle")}</h2>
        <p>
          {t("guide.sourcesDescription")}
        </p>
        <Sources sources={c.sources} />
        <small>{t("guide.sourceDate")}</small>
      </section>
      <p className="notice">
        <ShieldCheck size={18} />
        {t(
          workspace === "agrivision"
            ? "guide.plantWarning"
            : "guide.animalWarning",
        )}
      </p>
    </>
  );
}
