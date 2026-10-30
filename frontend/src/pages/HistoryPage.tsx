import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  History,
  ArrowRight,
  Search,
  Trash2,
  FileText,
  RefreshCw,
  X,
} from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import type { Report } from "../types";
import { useAuth } from "../hooks/AuthContext";
import { api } from "../services/api";
import { workspaceConfig } from "../services/workspaces";
import { ErrorMessage, Loading } from "../components/Status";
import { ReportPanel } from "../components/ReportPanel";
import { useLanguage } from "../i18n/LanguageContext";
export default function HistoryPage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { language, t } = useLanguage();
  const { user, ready } = useAuth();
  const [items, setItems] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = await api.history(workspace, offset);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setSelected(null);
    setPending(null);
    setItems([]);
    setOffset(0);
  }, [workspace, user?.id]);
  useEffect(() => {
    if (user) void load();
    else if (ready) setBusy(false);
  }, [workspace, user?.id, ready, offset]);
  async function remove() {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.remove(workspace, pending);
      setPending(null);
      setSelected(null);
      if (items.length === 1 && offset > 0) setOffset(Math.max(0, offset - 20));
      else await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  const filtered = items.filter((r) =>
    `${r.filename} ${r.result.subject} ${r.result.possible_condition || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">{t("history.eyebrow")}</span>
          <h1>
            {t(
              workspace === "agrivision"
                ? "nav.historyAgri"
                : "nav.historyAnimal",
            )}
          </h1>
          <p>
            {t("history.revisit", {
              subject: t(
                workspace === "agrivision"
                  ? "workspace.subjectPlant"
                  : "workspace.subjectAnimal",
              ),
            })}
          </p>
        </div>
        <Link className="button small" to={`/${workspace}/scan`}>
          {t("history.newScan")}
          <ArrowRight size={16} />
        </Link>
      </div>
      {!ready ? (
        <Loading />
      ) : !user ? (
        <div className="panel empty-state">
          <History size={40} />
          <h2>{t("history.private")}</h2>
          <p>
            {t("history.signInPrompt", {
              plural: t(
                workspace === "agrivision"
                  ? "workspace.pluralCrops"
                  : "workspace.pluralAnimals",
              ),
            })}
          </p>
          <Link
            className="button"
            to={`/auth/login?next=/${workspace}/history`}
          >
            {t("history.signIn")}
            <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className="panel history-panel">
            <div className="history-toolbar">
              <label className="search-field">
                <Search size={18} />
                <input
                  aria-label={t("history.searchLabel")}
                  placeholder={t("history.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                className="icon-button"
                onClick={load}
                disabled={busy}
                aria-label={t("history.refresh")}
              >
                <RefreshCw size={18} />
              </button>
            </div>
            {error && <ErrorMessage message={error} />}{" "}
            {busy ? (
              <Loading text={t("history.loading")} />
            ) : items.length === 0 ? (
              <div className="empty-state">
                <FileText size={42} />
                <h2>{t("history.emptyTitle")}</h2>
                <p>
                  {t("history.emptyText")}
                </p>
                <Link className="button" to={`/${workspace}/scan`}>
                  {t("history.startScan")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className="history-list">
                  {filtered.map((r) => (
                    <div className="history-row" key={r.id}>
                      <span className="mini-icon">
                        <c.icon size={23} />
                      </span>
                      <button
                        className="report-open"
                        onClick={() => setSelected(r)}
                      >
                        <strong>{r.result.subject}</strong>
                        <span>
                          {r.filename} ·{" "}
                          {new Date(r.created_at).toLocaleDateString(
                            language === "hi"
                              ? "hi-IN"
                              : language === "kn"
                                ? "kn-IN"
                                : "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </button>
                      <span className="report-condition">
                        {r.result.possible_condition ||
                          t("history.observationsRecorded")}
                      </span>
                      <button
                        className="text-link"
                        onClick={() => setSelected(r)}
                      >
                        {t("history.view")}
                        <ArrowRight size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={t("history.deleteReport", {
                          filename: r.filename,
                        })}
                        onClick={() => setPending(r.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="empty-state">
                      {t("history.noMatch")}
                    </p>
                  )}
                </div>
                <div className="pagination">
                  <button
                    className="button secondary small"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - 20))}
                  >
                    {t("history.previous")}
                  </button>
                  <span>
                    {offset + 1}–{Math.min(offset + 20, total)}{" "}
                    {t("history.of")} {total}
                  </span>
                  <button
                    className="button secondary small"
                    disabled={offset + 20 >= total}
                    onClick={() => setOffset(offset + 20)}
                  >
                    {t("history.next")}
                  </button>
                </div>
              </>
            )}
          </div>
          {selected && (
            <div className="selected-report">
              <div className="section-heading">
                <h2>{t("history.saved")}</h2>
                <button
                  className="icon-button"
                  aria-label={t("history.close")}
                  onClick={() => setSelected(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <ReportPanel report={selected} />
            </div>
          )}
          {pending && (
            <div className="delete-confirm panel" role="alert">
              <div>
                <strong>{t("history.confirmDelete")}</strong>
                <p>{t("history.deleteText")}</p>
              </div>
              <button
                className="button secondary small"
                disabled={deleting}
                onClick={() => setPending(null)}
              >
                {t("history.keep")}
              </button>
              <button
                className="button small"
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? t("history.deleting") : t("history.delete")}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
