// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReportPanel } from "./ReportPanel";
import type { Report } from "../types";
import { LanguageProvider } from "../i18n/LanguageContext";

afterEach(cleanup);

describe("Research-backed report", () => {
  it("shows TinyFish findings and only safe, provider-returned web links", () => {
    const report: Report = {
      id: "report-1",
      workspace: "agrivision",
      filename: "leaf.jpg",
      created_at: "2026-10-29T00:00:00Z",
      result: {
        subject: "Tomato plant",
        possible_condition: "Possible leaf spot",
        model_name: "Test model",
        confidence: null,
        observations: ["Dark marks are visible."],
        care_steps: [],
        prevention: [],
        treatment_options: [],
        limitations: ["A photo cannot confirm the cause."],
        urgency: "expert_review",
        research_status: "complete",
        research_message: "TinyFish search and page retrieval completed.",
        research_queries: ["tomato leaf spot guidance"],
        sources: [
          {
            title: "Agricultural guidance",
            url: "https://icar.org.in/guidance",
            snippet: "TinyFish returned this real search snippet.",
            content: "This text was retrieved from the linked page.",
            retrieved: true,
          },
          {
            title: "Unsafe source",
            url: "javascript:alert(1)",
          },
        ],
      },
    };

    render(
      <LanguageProvider>
        <ReportPanel report={report} />
      </LanguageProvider>,
    );

    expect(screen.getByText("Research & Helpful Sources")).toBeTruthy();
    expect(screen.getByText("Research completed")).toBeTruthy();
    expect(
      screen.getByText("TinyFish returned this real search snippet."),
    ).toBeTruthy();
    expect(
      screen.getByText("This text was retrieved from the linked page."),
    ).toBeTruthy();
    const sourceLink = screen.getByRole("link", {
      name: "Agricultural guidance",
    });
    expect(sourceLink.getAttribute("href")).toBe(
      "https://icar.org.in/guidance",
    );
    expect(screen.queryByText("Unsafe source")).toBeNull();
  });
});
