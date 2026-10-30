import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import { Camera, ArrowLeft, ShieldCheck } from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { UploadPanel } from "../components/UploadPanel";
import { ModelNotice } from "./DashboardPage";
import { useLanguage } from "../i18n/LanguageContext";
export default function ScanPage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const [params] = useSearchParams();
  const task = c.actions.find((a) => a.task === params.get("task"));
  const { t } = useLanguage();
  return (
    <>
      <Link className="text-link back-link" to={`/${workspace}`}>
        <ArrowLeft size={15} />
        {t("scan.backDashboard")}
      </Link>
      <div className="page-intro">
        <div>
          <span className="eyebrow">{t("scan.eyebrow")}</span>
          <h1>
            {task
              ? t(`${workspace}.action.${task.task}.title`)
              : t("scan.title", {
                  subject: t(
                    workspace === "agrivision"
                      ? "workspace.subjectPlant"
                      : "workspace.subjectAnimal",
                  ),
                })}
          </h1>
          <p>
            {t(
              workspace === "agrivision"
                ? "workspace.photoTipPlant"
                : "workspace.photoTipAnimal",
            )}
          </p>
        </div>
      </div>
      <ModelNotice />
      <div className="scan-page-grid">
        <div>
          <UploadPanel workspace={workspace} />
        </div>
        <aside className="panel scan-tips">
          <Camera size={29} />
          <h2>{t("scan.photoHeading")}</h2>
          <ul>
            <li>{t("scan.tipLight")}</li>
            <li>{t("scan.tipFocus")}</li>
            <li>{t("scan.tipAvoid")}</li>
            <li>
              {t(workspace === "agrivision" ? "scan.tipPlant" : "scan.tipAnimal")}
            </li>
          </ul>
          <div className="notice">
            <ShieldCheck size={18} />
            <p>
              {t(workspace === "agrivision" ? "scan.warnPlant" : "scan.warnAnimal")}
            </p>
          </div>
          <Link className="text-link" to={`/${workspace}/guide`}>
            {t("scan.readGuide", {
              guide: t(
                workspace === "agrivision"
                  ? "nav.guideAgri"
                  : "nav.guideAnimal",
              ),
            })}
          </Link>
        </aside>
      </div>
    </>
  );
}
