// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageSelector } from "../components/LanguageSelector";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import en from "./en";
import hi from "./hi";
import kn from "./kn";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function LanguageProbe() {
  const { t } = useLanguage();
  return <p>{t("home.getStarted")}</p>;
}

describe("language selection", () => {
  it("persists the selected locale and updates translated content", () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
        <LanguageProbe />
      </LanguageProvider>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "hi" },
    });

    expect(screen.getByText("शुरू करें")).toBeTruthy();
    expect(localStorage.getItem("agribovix-language")).toBe("hi");
    expect(document.documentElement.lang).toBe("hi");
  });

  it("provides every English resource key in Hindi and Kannada", () => {
    const englishKeys = Object.keys(en).sort();
    expect(Object.keys(hi).sort()).toEqual(englishKeys);
    expect(Object.keys(kn).sort()).toEqual(englishKeys);
  });
});
