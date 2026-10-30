import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Send,
  MessageSquare,
  Plus,
  ArrowUpRight,
  Info,
  LoaderCircle,
  BookOpen,
} from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import type { Message } from "../types";
import { useAuth } from "../hooks/AuthContext";
import { workspaceConfig } from "../services/workspaces";
import { api } from "../services/api";
import { ErrorMessage } from "../components/Status";
import { Sources } from "../components/ReportPanel";
import { useLanguage } from "../i18n/LanguageContext";
export default function AssistantPage() {
  const { workspace, health } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError("");
  }, [workspace, user?.id]);
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    if (!user) {
      setError(t("assistant.signInFirst"));
      return;
    }
    const updated: Message[] = [
      ...messages,
      { role: "user", content: draft.trim() },
    ];
    setMessages(updated);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const result = await api.chat(
        workspace,
        updated.slice(-19),
        language,
      );
      setMessages([
        ...updated,
        { role: "assistant", content: result.message, sources: result.sources },
      ]);
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
          <span className="eyebrow">{t("assistant.eyebrow")}</span>
          <h1>{t("assistant.title", { name: c.name })}</h1>
          <p>
            {t(
              workspace === "agrivision"
                ? "assistant.agriScope"
                : "assistant.animalScope",
            )}
          </p>
        </div>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={() => {
            setMessages([]);
            setError("");
            setDraft("");
          }}
        >
          <Plus size={16} />
          {t("assistant.newChat")}
        </button>
      </div>
      <div className="assistant-grid">
        <section className="panel chat-panel">
          <header className="chat-header">
            <span className="circle-icon">
              <c.icon size={23} />
            </span>
            <div>
              <strong>{t("assistant.title", { name: c.name })}</strong>
              <small>
                {health?.workspaces[workspace].assistant_configured
                  ? t("assistant.configured")
                  : t("assistant.unavailable")}
              </small>
            </div>
          </header>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <span className="chat-welcome-icon">
                  <MessageSquare size={34} strokeWidth={1.3} />
                </span>
                <h2>{t("assistant.welcome")}</h2>
                <p>
                  {t(
                    workspace === "agrivision"
                      ? "assistant.cropPrompt"
                      : "assistant.animalPrompt",
                  )}
                </p>
                <div className="chat-prompts">
                  {c.prompts.map((p, index) => {
                    const prompt = t(
                      `${workspace}.assistant.prompt.${index + 1}`,
                    );
                    return (
                      <button onClick={() => setDraft(prompt)} key={p}>
                        {prompt}
                        <ArrowUpRight size={15} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className={`chat-message ${m.role}`} key={i}>
                  <small>
                    {m.role === "user"
                      ? t("assistant.you")
                      : t("assistant.title", { name: c.name })}
                  </small>
                  <p>{m.content}</p>
                  {m.sources && <Sources sources={m.sources} />}
                </div>
              ))
            )}
            {busy && (
              <div className="loading" role="status">
                <LoaderCircle className="spin" size={18} />
                {t("assistant.thinking")}
              </div>
            )}
            <div ref={end} />
          </div>
          {error && (
            <div className="chat-error">
              <ErrorMessage message={error} />
            </div>
          )}
          {!user && (
            <div className="chat-login">
              <Link to={`/auth/login?next=/${workspace}/assistant`}>
                {t("assistant.login")}
              </Link>{" "}
              {t("assistant.loginPrompt")}
            </div>
          )}
          <form className="chat-composer" onSubmit={send}>
            <label className="sr-only" htmlFor="chat-input">
              {t("assistant.question")}
            </label>
            <textarea
              id="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("assistant.placeholder", {
                plural: t(
                  workspace === "agrivision"
                    ? "workspace.pluralCrops"
                    : "workspace.pluralAnimals",
                ),
              })}
              rows={2}
              maxLength={2000}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              className="button"
              disabled={busy || !draft.trim()}
              aria-label={t("assistant.send")}
            >
              <Send size={19} />
            </button>
          </form>
          <p className="chat-footnote">
            {t("assistant.safety")}
          </p>
        </section>
        <aside className="assistant-side">
          <div className="panel">
            <Info size={25} />
            <h2>{t("assistant.contextTitle")}</h2>
            <p>
              {t(
                workspace === "agrivision"
                  ? "assistant.cropContext"
                  : "assistant.animalContext",
              )}
            </p>
            <p>{t("assistant.noDiagnosis")}</p>
          </div>
          <Link className="guide-prompt" to={`/${workspace}/guide`}>
            <BookOpen size={24} />
            <div>
              <strong>{t("assistant.guidePrompt")}</strong>
              <span>
                {t("assistant.readGuide", {
                  guide: t(
                    workspace === "agrivision"
                      ? "nav.guideAgri"
                      : "nav.guideAnimal",
                  ),
                })}
                <ArrowUpRight size={14} />
              </span>
            </div>
          </Link>
        </aside>
      </div>
    </>
  );
}
