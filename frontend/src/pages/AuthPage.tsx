import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { Brand } from "../components/Brand";
import { Photo } from "../components/Photo";
import { ErrorMessage } from "../components/Status";
import { api } from "../services/api";
import { safeReturn } from "../services/workspaces";
import { useAuth } from "../hooks/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSelector } from "../components/LanguageSelector";
export default function AuthPage({ register = false }: { register?: boolean }) {
  const [params] = useSearchParams();
  const next = safeReturn(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = register
        ? await api.register(name, email, password)
        : await api.login(email, password);
      setUser(user);
      navigate(next, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Photo
          src="/images/farmer-hero.png"
          alt={t("auth.photoAltFarmer")}
        />
        <div className="auth-overlay" />
        <Brand />
        <div className="auth-story-copy">
          <span className="eyebrow">{t("auth.storyEyebrow")}</span>
          <h1>
            {t("auth.storyTitle")}
          </h1>
          <p>{t("auth.storyText")}</p>
          <div className="hero-values">
            <span>{t("auth.smartFarming")}</span>
            <span>{t("auth.healthyLivestock")}</span>
          </div>
        </div>
      </aside>
      <main className="auth-main" id="main">
        <div className="auth-topbar">
          <Link className="text-link" to="/">
            <ArrowLeft size={16} />
            {t("auth.backHome")}
          </Link>
          <LanguageSelector />
        </div>
        <div className="auth-form-wrap">
          <Brand />
          <span className="eyebrow">
            {t(register ? "auth.registerEyebrow" : "auth.loginEyebrow")}
          </span>
          <h1>{t(register ? "auth.createTitle" : "auth.welcomeTitle")}</h1>
          <p>
            {register
              ? t("auth.createText")
              : t("auth.loginText")}
          </p>
          {next.startsWith("/agrivision") || next.startsWith("/pashuvision") ? (
            <div className="auth-workspace">
              {t("auth.continuing")}{" "}
              <strong>
                {next.startsWith("/agrivision") ? "AgriVision" : "PashuVision"}
              </strong>
            </div>
          ) : null}
          <form onSubmit={submit}>
            {register && (
              <label>
                {t("auth.fullName")}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder={t("auth.namePlaceholder")}
                />
              </label>
            )}
            <label>
              {t("auth.email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
                required
                placeholder="you@example.com"
              />
            </label>
            <label>
              {t("auth.password")}
              <span className="password-field">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  required
                  placeholder={
                    register
                      ? t("auth.passwordNew")
                      : t("auth.passwordEnter")
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t(
                    show ? "auth.hidePassword" : "auth.showPassword",
                  )}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {register && (
              <p className="form-hint">
                {t("auth.passwordHint")}
              </p>
            )}
            {error && <ErrorMessage message={error} />}
            <button className="button full-width" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {t(register ? "auth.createButton" : "auth.signInButton")}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="auth-alternate">
            {t(register ? "auth.already" : "auth.new")}{" "}
            <Link
              to={`/auth/${register ? "login" : "register"}?next=${encodeURIComponent(next)}`}
            >
              {t(register ? "auth.signInLink" : "auth.createLink")}
            </Link>
          </p>
          <p className="auth-legal">
            {t("auth.agree")} <Link to="/terms">{t("common.terms")}</Link> and{" "}
            <Link to="/privacy">{t("common.privacy")}</Link>.
          </p>
          <div className="auth-security">
            <LockKeyhole size={15} />
            {t("auth.workspacePrivate")}
          </div>
        </div>
      </main>
    </div>
  );
}
