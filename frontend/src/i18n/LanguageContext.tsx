import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en";
import hi from "./hi";
import kn from "./kn";

export type Language = "en" | "hi" | "kn";
type TranslationKey = keyof typeof en;
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (
    key: TranslationKey | string,
    values?: Record<string, string | number>,
  ) => string;
};

const STORAGE_KEY = "agribovix-language";
const resources: Record<Language, Record<string, string>> = { en, hi, kn };
const context = createContext<LanguageContextValue | null>(null);

function storedLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "hi" || stored === "kn" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(storedLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The in-memory selection still works when browser storage is unavailable.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, values: Record<string, string | number> = {}) => {
      let value = resources[language][key] ?? resources.en[key] ?? key;
      for (const [name, replacement] of Object.entries(values)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
      return value;
    },
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
}

export function useLanguage() {
  const value = useContext(context);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return value;
}

export type { TranslationKey };
