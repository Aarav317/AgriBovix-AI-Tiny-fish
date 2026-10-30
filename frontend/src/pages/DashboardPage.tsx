import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  Info,
  Camera,
  ScanLine,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { useAuth } from "../hooks/AuthContext";
import { Photo } from "../components/Photo";
import { UploadPanel } from "../components/UploadPanel";
import { useLanguage } from "../i18n/LanguageContext";
export function ModelNotice() {
  const { t } = useLanguage();
  const { workspace, health, healthError } =
    useOutletContext<WorkspaceContext>();
  if (health?.workspaces[workspace].analysis_configured) return null;
  return (
    <div className="model-notice">
      <Info size={19} />
      <p>
        <strong>
          {healthError
            ? t("workspace.analysisOffline")
            : t("workspace.analysisUnavailable")}
        </strong>{" "}
        {healthError
          ? t("workspace.checkBackend")
          : t("workspace.connectModel")}
      </p>
    </div>
  );
}
export default function DashboardPage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { user } = useAuth();
  const { t } = useLanguage();
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">{t("workspace.greeting")}</span>
          <h1>{t("workspace.welcome", { name: c.name })}</h1>
          <p>
            {t(
              workspace === "agrivision"
                ? "workspace.descriptionAgri"
                : "workspace.descriptionPashu",
            )}
          </p>
        </div>
        <span className="intro-icon">
          <c.icon size={37} strokeWidth={1.3} />
        </span>
      </div>
      <div className="welcome-banner">
        <span className="circle-icon">
          <c.icon size={25} />
        </span>
        <div>
          <strong>
            {t(
              workspace === "agrivision"
                ? "workspace.welcomeAgri"
                : "workspace.welcomePashu",
            )}
          </strong>
          <p>
            {t("workspace.bannerText", {
              subject: t(
                workspace === "agrivision"
                  ? "workspace.subjectPlant"
                  : "workspace.subjectAnimal",
              ),
            })}
          </p>
        </div>
        <Photo
          src={c.image}
          alt={
            workspace === "agrivision"
              ? t("workspace.photoAltPlant")
              : t("workspace.photoAltCow")
          }
        />
      </div>
      <div className="dashboard-grid">
        <div className="scan-column">
          <UploadPanel workspace={workspace} />
        </div>
        <aside className="instructions panel">
          <span className="eyebrow">{t("workspace.start")}</span>
          <h2>{t("workspace.howScan")}</h2>
          {[
            {
              icon: Camera,
              title: t("workspace.photoStep"),
              text: t(
                workspace === "agrivision"
                  ? "workspace.photoTipPlant"
                  : "workspace.photoTipAnimal",
              ),
            },
            {
              icon: ScanLine,
              title: t("workspace.featuresStep"),
              text: t("workspace.featuresText"),
            },
            {
              icon: ClipboardCheck,
              title: t("workspace.nextStep"),
              text: t("workspace.nextStepText"),
            },
          ].map((item, i) => (
            <div className="instruction" key={item.title}>
              <span>{i + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
          <div className="instruction-footer">
            <ShieldCheck size={20} />
            <p>{t("workspace.decisions")}</p>
          </div>
        </aside>
      </div>
      <ModelNotice />
      <section className="quick-section">
        <div className="section-heading">
          <h2>{t("workspace.whatNext")}</h2>
          <span className="muted">{t("workspace.supportEveryStep")}</span>
        </div>
        <div className="quick-grid">
          {c.actions.map((a) => (
            <Link
              className="quick-card"
              key={a.task}
              to={`/${workspace}/${a.task === "guide" ? "guide" : a.task === "assistant" ? "assistant" : `scan?task=${a.task}`}`}
            >
              <span className="mini-icon">
                <a.icon size={23} />
              </span>
              <ArrowRight className="quick-arrow" size={16} />
              <h3>{t(`${workspace}.action.${a.task}.title`)}</h3>
              <p>{t(`${workspace}.action.${a.task}.description`)}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-bottom">
        <div className="history-prompt">
          <span className="mini-icon">
            <ClipboardCheck size={24} />
          </span>
          <div>
            <h3>{t("workspace.historyPrompt")}</h3>
            <p>
              {user
                ? t("workspace.viewSaved")
                : t("workspace.createToSave")}
            </p>
          </div>
          <Link
            className="text-link"
            to={
              user
                ? `/${workspace}/history`
                : `/auth/register?next=/${workspace}`
            }
          >
            {user
              ? t("workspace.viewHistory")
              : t("workspace.createAccount")}
            <ArrowRight size={16} />
          </Link>
        </div>
        <Link className="guide-prompt" to={`/${workspace}/guide`}>
          <BookOpen size={25} />
          <div>
            <strong>{t("workspace.knowledge")}</strong>
            <span>
              {t("workspace.exploreGuide", {
                guide: t(
                  workspace === "agrivision"
                    ? "nav.guideAgri"
                    : "nav.guideAnimal",
                ),
              })}
              <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>
    </>
  );
}
