import { describe, it, expect } from "vitest";
import { safeReturn, workspaceConfig } from "./workspaces";
describe("Workspace login destinations", () => {
  it("preserves every supported workspace route", () => {
    for (const w of ["agrivision", "pashuvision"])
      for (const suffix of [
        "",
        "/scan",
        "/history",
        "/assistant",
        "/guide",
        "/settings",
      ])
        expect(safeReturn(`/${w}${suffix}`)).toBe(`/${w}${suffix}`);
  });
  it("rejects external and unsupported destinations", () => {
    for (const path of [
      null,
      "",
      "https://evil.example",
      "//evil.example",
      "/agrivision/../admin",
      "/agrivision2",
      "/pashuvision/scan?next=//evil.example",
      "/auth/login",
    ])
      expect(safeReturn(path)).toBe("/choose-workspace");
  });
});
describe("Workspace separation", () => {
  it("keeps crop actions and animal actions scoped", () => {
    expect(workspaceConfig.agrivision.actions.map((x) => x.task)).not.toContain(
      "breed",
    );
    expect(
      workspaceConfig.pashuvision.actions.map((x) => x.task),
    ).not.toContain("maturity");
    expect(workspaceConfig.agrivision.history).toBe("Crop History");
    expect(workspaceConfig.pashuvision.history).toBe("Livestock History");
  });
});
