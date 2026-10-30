import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  History,
  MessageSquare,
  BookOpen,
  Settings,
  ArrowLeft,
  ChevronDown,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { CowIcon as Beef } from "../components/CowIcon";
import { Brand } from "../components/Brand";
import { useAuth } from "../hooks/AuthContext";
import { api } from "../services/api";
import { workspaceConfig } from "../services/workspaces";
import { LanguageSelector } from "../components/LanguageSelector";
import { useLanguage } from "../i18n/LanguageContext";
import type { Health, Workspace } from "../types";
export type WorkspaceContext = {
  workspace: Workspace;
  health: Health | null;
  healthError: boolean;
};
export default function WorkspaceLayout({
  workspace,
}: {
  workspace: Workspace;
}) {
  const config = workspaceConfig[workspace];
  const { t } = useLanguage();
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState(false);
  const location = useLocation();
  const closeMenu = () => {
    setMenu(false);
    toggleRef.current?.focus();
  };
  useEffect(() => {
    if (menu)
      sidebarRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [menu]);
  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);
  useEffect(() => {
    api
      .health()
      .then((h) => {
        setHealth(h);
        setHealthError(false);
      })
      .catch(() => setHealthError(true));
  }, [workspace]);
  const navigation = [
    { to: "", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/scan", label: t("nav.scan"), icon: ScanLine },
    {
      to: "/history",
      label:
        workspace === "agrivision"
          ? t("nav.historyAgri")
          : t("nav.historyAnimal"),
      icon: History,
    },
    { to: "/assistant", label: t("nav.assistant"), icon: MessageSquare },
    {
      to: "/guide",
      label:
        workspace === "agrivision"
          ? t("nav.guideAgri")
          : t("nav.guideAnimal"),
      icon: BookOpen,
    },
  ];
  return (
    <div className="workspace-shell">
      <button
        className={`sidebar-scrim ${menu ? "visible" : ""}`}
        aria-label={t("nav.close")}
        onClick={closeMenu}
      />
      <aside
        id="workspace-sidebar"
        ref={sidebarRef}
        className={`sidebar ${menu ? "open" : ""}`}
        onKeyDown={(event) => {
          if (!menu) return;
          if (event.key === "Escape") {
            event.preventDefault();
            closeMenu();
          }
          if (event.key === "Tab") {
            const controls = Array.from(
              sidebarRef.current?.querySelectorAll<HTMLElement>("a,button") ??
                [],
            );
            const first = controls[0],
              last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="sidebar-brand">
          <Brand compact />
          <button
            className="icon-button sidebar-close"
            aria-label={t("nav.close")}
            onClick={closeMenu}
          >
            <X />
          </button>
        </div>
        <div className="workspace-switch-label">
          <config.icon size={18} />
          {config.name}
          <span>{t("nav.workspace")}</span>
        </div>
        <nav aria-label={`${config.name} navigation`}>
          {navigation.map((n) => (
            <NavLink key={n.to} end={!n.to} to={`/${workspace}${n.to}`}>
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            {workspace === "agrivision" ? (
              <Leaf size={29} />
            ) : (
              <Beef size={30} />
            )}
            <strong>
              {t(
                workspace === "agrivision"
                  ? "workspace.sidebarAgri"
                  : "workspace.sidebarPashu",
              )}
            </strong>
            <span>
              {t(
                workspace === "agrivision"
                  ? "workspace.taglineAgri"
                  : "workspace.taglinePashu",
              )}
            </span>
          </div>
          <NavLink to={`/${workspace}/settings`} className="sidebar-setting">
            <Settings size={17} />
            {t("nav.settings")}
          </NavLink>
          <Link className="back-home" to="/">
            <ArrowLeft size={16} />
            {t("nav.back")}
          </Link>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-breadcrumb">
            <button
              className="icon-button mobile-menu"
              ref={toggleRef}
              aria-label={t("nav.open")}
              aria-expanded={menu}
              aria-controls="workspace-sidebar"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span className="workspace-top-icon">
              <config.icon size={21} />
            </span>
            <div>
              <strong>{config.name}</strong>
              <small>
                {t(
                  workspace === "agrivision"
                    ? "workspace.labelAgri"
                    : "workspace.labelPashu",
                )}
              </small>
            </div>
          </div>
          <div className="workspace-header-right">
            <LanguageSelector />
            <span className="model-status">
              <i
                className={
                  health?.workspaces[workspace].analysis_configured
                    ? "configured"
                    : ""
                }
              />
              {healthError
                ? t("nav.offline")
                : health?.workspaces[workspace].analysis_configured
                  ? t("nav.aiConfigured")
                  : t("nav.aiUnavailable")}
            </span>
            <Link
              to={
                user
                  ? `/${workspace}/settings`
                  : `/auth/login?next=/${workspace}`
              }
              className="profile-link"
            >
              <span className="avatar">
                {user?.name.slice(0, 1).toUpperCase() || "F"}
              </span>
              <span>{user?.name.split(" ")[0] || "Farmer"}</span>
              <ChevronDown size={14} />
            </Link>
          </div>
        </header>
        <main id="main" className="dashboard-content">
          <Outlet
            context={
              { workspace, health, healthError } satisfies WorkspaceContext
            }
          />
        </main>
        <footer className="workspace-footer">
          <span>
            AgriBovix AI ·{" "}
            {t(
              workspace === "agrivision"
                ? "workspace.taglineAgri"
                : "workspace.taglinePashu",
            )}
          </span>
          <Link to="/terms">{t("nav.expertGuidance")}</Link>
        </footer>
      </div>
    </div>
  );
}
