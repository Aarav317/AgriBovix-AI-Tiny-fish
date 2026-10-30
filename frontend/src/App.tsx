import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import DashboardPage from "./pages/DashboardPage";
import ScanPage from "./pages/ScanPage";
import HistoryPage from "./pages/HistoryPage";
import AssistantPage from "./pages/AssistantPage";
import GuidePage from "./pages/GuidePage";
import SettingsPage from "./pages/SettingsPage";
import { ChooseWorkspace, NotFound, PolicyPage } from "./pages/StaticPages";
import { useLanguage } from "./i18n/LanguageContext";
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const { language, t } = useLanguage();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
    document.title = pathname.startsWith("/agrivision")
      ? "AgriVision | AgriBovix AI"
      : pathname.startsWith("/pashuvision")
        ? "PashuVision | AgriBovix AI"
        : "AgriBovix AI — Smarter farming. Healthier livestock.";
  }, [pathname, hash, language, t]);
  return null;
}
export default function App() {
  const { t } = useLanguage();
  return (
    <>
      <a href="#main" className="skip-link">
        {t("app.skip")}
      </a>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/login" element={<AuthPage />} />
        <Route path="/auth/register" element={<AuthPage register />} />
        <Route path="/choose-workspace" element={<ChooseWorkspace />} />
        {(["agrivision", "pashuvision"] as const).map((w) => (
          <Route
            key={w}
            path={`/${w}`}
            element={<WorkspaceLayout workspace={w} key={w} />}
          >
            <Route index element={<DashboardPage />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        ))}
        <Route path="/privacy" element={<PolicyPage privacy />} />
        <Route path="/terms" element={<PolicyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
