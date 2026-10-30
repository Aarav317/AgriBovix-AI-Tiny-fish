import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { UserRound, ShieldCheck, LogOut } from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { useAuth } from "../hooks/AuthContext";
import { ErrorMessage, Loading } from "../components/Status";
import { useLanguage } from "../i18n/LanguageContext";
export default function SettingsPage() {
  const { workspace, health, healthError } =
    useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { t } = useLanguage();
  const { user, ready, logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">{t("settings.eyebrow")}</span>
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle", { name: c.name })}</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel settings-panel">
          <UserRound size={30} />
          <h2>{t("settings.account")}</h2>
          {!ready ? (
            <Loading />
          ) : user ? (
            <>
              <dl>
                <dt>{t("settings.name")}</dt>
                <dd>{user.name}</dd>
                <dt>{t("settings.email")}</dt>
                <dd>{user.email}</dd>
                <dt>{t("settings.activeWorkspace")}</dt>
                <dd>{c.name}</dd>
              </dl>
              <p className="muted">
                {t("settings.profileUnavailable")}
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={signOut}
              >
                <LogOut size={17} />
                {t("settings.signOut")}
              </button>
            </>
          ) : (
            <>
              <p>{t("settings.signInSave")}</p>
              <Link
                className="button"
                to={`/auth/login?next=/${workspace}/settings`}
              >
                {t("auth.signInButton")}
              </Link>
            </>
          )}
          {error && <ErrorMessage message={error} />}
        </section>
        <section className="panel settings-panel">
          <ShieldCheck size={30} />
          <h2>{t("settings.services")}</h2>
          <dl>
            <dt>{t("settings.backend")}</dt>
            <dd>
              {healthError
                ? t("settings.offline")
                : health
                  ? t("settings.connected")
                  : t("settings.checking")}
            </dd>
            <dt>{t("settings.imageAnalysis")}</dt>
            <dd>
              {health?.workspaces[workspace].analysis_configured
                ? t("settings.modelConfigured")
                : t("settings.modelUnavailable")}
            </dd>
            <dt>{t("settings.aiAssistant")}</dt>
            <dd>
              {health?.workspaces[workspace].assistant_configured
                ? t("settings.assistantConfigured")
                : t("settings.assistantUnavailable")}
            </dd>
            <dt>{t("settings.savedReports")}</dt>
            <dd>{t("settings.privateReports")}</dd>
          </dl>
          <p className="muted">
            {t("settings.validResponse")}
          </p>
          <Link className="text-link" to="/privacy">
            {t("settings.privacy")}
          </Link>
        </section>
      </div>
    </>
  );
}
