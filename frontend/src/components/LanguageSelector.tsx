import { Languages } from "lucide-react";
import { useLanguage, type Language } from "../i18n/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="language-control">
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={language}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "en" || value === "hi" || value === "kn") {
            setLanguage(value satisfies Language);
          }
        }}
      >
        <option value="hi">{t("language.hindi")}</option>
        <option value="en">{t("language.english")}</option>
        <option value="kn">{t("language.kannada")}</option>
      </select>
    </label>
  );
}
