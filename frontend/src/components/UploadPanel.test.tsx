// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UploadPanel } from "./UploadPanel";
import { api, ApiError } from "../services/api";
import { LanguageProvider } from "../i18n/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
vi.mock("../hooks/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test", name: "Test Farmer", email: "test@example.test" },
  }),
}));
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:test-preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
function setup() {
  render(
    <MemoryRouter initialEntries={["/pashuvision/scan?task=health"]}>
      <LanguageProvider>
        <LanguageSelector />
        <UploadPanel workspace="pashuvision" />
      </LanguageProvider>
    </MemoryRouter>,
  );
  return screen.getByLabelText("Upload an animal image");
}
describe("Image upload workflow", () => {
  it("previews a selected file, sends the correct workspace/task, and shows an honest unavailable error", async () => {
    const analyze = vi
      .spyOn(api, "analyze")
      .mockRejectedValue(
        new ApiError(
          503,
          "model_unavailable",
          "Image analysis is not connected yet. No prediction has been made.",
        ),
      );
    const input = setup();
    const file = new File(["test image content"], "animal.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      screen.getByAltText("Selected animal for analysis").getAttribute("src"),
    ).toBe("blob:test-preview");
    fireEvent.click(screen.getByRole("button", { name: "Analyze Image" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "No prediction has been made",
      ),
    );
    expect(analyze).toHaveBeenCalledWith("pashuvision", file, "health", "en");
    expect(screen.queryByText("AI PREDICTION · REQUIRES REVIEW")).toBeNull();
  });
  it("sends the selected language with the image analysis request", async () => {
    const analyze = vi
      .spyOn(api, "analyze")
      .mockRejectedValue(new ApiError(503, "model_unavailable", "Unavailable."));
    const input = setup();
    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "hi" },
    });
    fireEvent.change(input, {
      target: {
        files: [new File(["test image"], "animal.png", { type: "image/png" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "तस्वीर का विश्लेषण करें" }));
    await waitFor(() => expect(analyze).toHaveBeenCalled());
    expect(analyze).toHaveBeenCalledWith(
      "pashuvision",
      expect.any(File),
      "health",
      "hi",
    );
  });
  it("rejects unsupported files before creating a preview", () => {
    const input = setup();
    fireEvent.change(input, {
      target: {
        files: [
          new File(["x"], "bad.exe", { type: "application/octet-stream" }),
        ],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "JPG, PNG, or WebP",
    );
    expect(screen.queryByAltText("Selected animal for analysis")).toBeNull();
  });
  it("rejects images above 8 MB", () => {
    const input = setup();
    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(8 * 1024 * 1024 + 1)], "big.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain("too large");
  });
  it("removes the preview and releases its object URL", () => {
    const input = setup();
    fireEvent.change(input, {
      target: { files: [new File(["x"], "cow.png", { type: "image/png" })] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove selected image" }),
    );
    expect(screen.queryByAltText("Selected animal for analysis")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-preview");
  });
});
