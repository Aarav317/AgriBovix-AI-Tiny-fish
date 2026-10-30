import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  UploadCloud,
  ImagePlus,
  X,
  ArrowRight,
  LockKeyhole,
  LoaderCircle,
  ScanLine,
} from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { api } from "../services/api";
import { workspaceConfig } from "../services/workspaces";
import { ErrorMessage } from "./Status";
import { ReportPanel } from "./ReportPanel";
import { useLanguage } from "../i18n/LanguageContext";
import type { Report, Workspace } from "../types";
export function UploadPanel({ workspace }: { workspace: Workspace }) {
  const config = workspaceConfig[workspace];
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const task = config.actions.some(
    (a) =>
      a.task === params.get("task") && !["guide", "assistant"].includes(a.task),
  )
    ? params.get("task")!
    : "general";
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    setFile(null);
    setError("");
    setReport(null);
  }, [workspace]);
  function select(next?: File) {
    if (busy) return;
    setError("");
    setReport(null);
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError(t("upload.invalidType"));
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError(t("upload.tooLarge"));
      return;
    }
    setFile(next);
  }
  function drop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length > 1) {
      setError(t("upload.oneAtTime"));
      return;
    }
    select(e.dataTransfer.files[0]);
  }
  async function analyze() {
    if (!file) return;
    if (!user) {
      navigate(`/auth/login?next=/${workspace}/scan`);
      return;
    }
    setBusy(true);
    setError("");
    setReport(null);
    try {
      setReport(await api.analyze(workspace, file, task, language));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel upload-panel">
        <div className="section-heading">
          <div className="panel-title">
            <span className="mini-icon">
              <ScanLine size={18} />
            </span>
            <h2>
              {workspace === "agrivision"
                ? t("upload.labelPlant")
                : t("upload.labelAnimal")}
            </h2>
          </div>
          <span className="subtle-label">{t("upload.formats")}</span>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={
            workspace === "agrivision"
              ? t("upload.labelPlant")
              : t("upload.labelAnimal")
          }
          disabled={busy}
          onChange={(e) => {
            select(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div
          className={`dropzone ${drag ? "dragging" : ""} ${file ? "has-preview" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={drop}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt={
                  workspace === "agrivision"
                    ? t("upload.selectedPlant")
                    : t("upload.selectedAnimal")
                }
                onError={() => {
                  setFile(null);
                  setError(
                    t("upload.previewError"),
                  );
                }}
              />
              <button
                className="remove-image icon-button"
                aria-label={t("upload.remove")}
                disabled={busy}
                onClick={() => {
                  setFile(null);
                  setReport(null);
                  setError("");
                }}
              >
                <X size={18} />
              </button>
              <span className="preview-label">{file?.name}</span>
            </>
          ) : (
            <>
              <span className="upload-cloud">
                <UploadCloud size={32} strokeWidth={1.4} />
              </span>
              <h3>
                {workspace === "agrivision"
                  ? t("upload.dropPlant")
                  : t("upload.dropAnimal")}
              </h3>
              <p>{t("upload.choosePrompt")}</p>
              <button
                className="button small"
                onClick={() => input.current?.click()}
              >
                <ImagePlus size={16} />
                {t("upload.choose")}
              </button>
              <small>{t("upload.size")}</small>
            </>
          )}
        </div>
        {file && (
          <div className="upload-actions">
            <button
              className="text-link"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {t("upload.chooseAnother")}
            </button>
            <button className="button" disabled={busy} onClick={analyze}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  {t("upload.analyzing")}
                </>
              ) : (
                <>
                  {user ? t("upload.analyze") : t("upload.signInAnalyze")}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
        <p className="upload-privacy">
          <LockKeyhole size={13} />
          {t("upload.privacy")}
        </p>
        {error && <ErrorMessage message={error} />}
      </section>
      {report && <ReportPanel report={report} />}
    </>
  );
}
