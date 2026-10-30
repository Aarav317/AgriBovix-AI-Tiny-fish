import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Brand } from "../components/Brand";
import { WorkspaceCards } from "./HomePage";
import { LanguageSelector } from "../components/LanguageSelector";
import { useLanguage } from "../i18n/LanguageContext";
export function ChooseWorkspace() {
  const { t } = useLanguage();
  return (
    <div className="choose-page">
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <LanguageSelector />
          <Link className="text-link" to="/">
            <ArrowLeft size={16} />
            {t("common.home")}
          </Link>
        </div>
      </header>
      <main className="container" id="main">
        <span className="eyebrow">{t("common.welcome")}</span>
        <h1>{t("common.chooseWorkspaceTitle")}</h1>
        <p>{t("common.chooseWorkspaceText")}</p>
        <WorkspaceCards />
      </main>
    </div>
  );
}
export function PolicyPage({ privacy = false }: { privacy?: boolean }) {
  const { t } = useLanguage();
  return (
    <main className="policy-page container" id="main">
      <Brand />
      <LanguageSelector />
      <Link className="text-link back-link" to="/">
        <ArrowLeft size={16} />
        {t("common.home")}
      </Link>
      <span className="eyebrow">{t("common.projectInfo")}</span>
      <h1>{t(privacy ? "common.privacy" : "common.termsOfService")}</h1>
      {privacy ? (
        <>
          <h2>{t("policy.privacy.storedTitle")}</h2>
          <p>{t("policy.privacy.stored")}</p>
          <h2>{t("policy.privacy.photosTitle")}</h2>
          <p>{t("policy.privacy.photos")}</p>
          <h2>{t("policy.privacy.cookiesTitle")}</h2>
          <p>{t("policy.privacy.cookies")}</p>
          <h2>{t("policy.privacy.deploymentTitle")}</h2>
          <p>{t("policy.privacy.deployment")}</p>
        </>
      ) : (
        <>
          <h2>{t("policy.terms.purposeTitle")}</h2>
          <p>{t("policy.terms.purpose")}</p>
          <h2>{t("policy.terms.careTitle")}</h2>
          <p>{t("policy.terms.care")}</p>
          <h2>{t("policy.terms.availabilityTitle")}</h2>
          <p>{t("policy.terms.availability")}</p>
          <h2>{t("policy.terms.useTitle")}</h2>
          <p>{t("policy.terms.use")}</p>
        </>
      )}
      <Link className="button" to="/">
        {t("common.backHome")}
      </Link>
    </main>
  );
}
export function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="not-found" id="main">
      <Brand />
      <LanguageSelector />
      <span className="eyebrow">{t("common.notFoundEyebrow")}</span>
      <h1>{t("common.notFoundTitle")}</h1>
      <p>{t("common.notFoundText")}</p>
      <Link className="button" to="/">
        {t("common.backHome")}
      </Link>
    </main>
  );
}
