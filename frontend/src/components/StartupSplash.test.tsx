// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { StartupSplash } from "./StartupSplash";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.style.overflow = "";
});

describe("StartupSplash", () => {
  it("keeps the app mounted and inaccessible until the exact seven-second transition ends", () => {
    vi.useFakeTimers();
    render(
      <StartupSplash>
        <main>Existing homepage</main>
      </StartupSplash>,
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("AgriBovix")).toBeTruthy();
    expect(screen.getByText("POWERED BY")).toBeTruthy();
    expect(screen.getByText("ARANICA LAB")).toBeTruthy();
    expect(screen.getByText("Existing homepage")).toBeTruthy();
    expect(document.querySelector(".startup-app")?.getAttribute("inert")).toBe(
      "",
    );
    expect(document.body.style.overflow).toBe("hidden");

    act(() => vi.advanceTimersByTime(6249));
    expect(
      document
        .querySelector(".startup-splash")
        ?.classList.contains("is-exiting"),
    ).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(
      document
        .querySelector(".startup-splash")
        ?.classList.contains("is-exiting"),
    ).toBe(true);
    act(() => vi.advanceTimersByTime(749));
    expect(screen.getByRole("status")).toBeTruthy();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Existing homepage")).toBeTruthy();
    expect(document.querySelector(".startup-app")?.hasAttribute("inert")).toBe(
      false,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("does not replay when navigating between routes inside the app", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <StartupSplash>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <p>Homepage route</p>
                  <Link to="/agrivision">Open AgriVision</Link>
                </>
              }
            />
            <Route path="/agrivision" element={<p>AgriVision route</p>} />
          </Routes>
        </StartupSplash>
      </MemoryRouter>,
    );

    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "Open AgriVision" }));

    expect(screen.getByText("AgriVision route")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
