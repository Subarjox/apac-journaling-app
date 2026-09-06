import { describe, it, expect } from "vitest";
import { formatToastMessage } from "@/context/ToastContext";

describe("Toast Formatting Utility", () => {
  it("formats error messages accurately from strings", () => {
    const formatted = formatToastMessage("Auth failed");
    expect(formatted.title).toBe("Action Failed");
    expect(formatted.message).toBe("Auth failed");
  });

  it("handles empty or unknown error gracefully", () => {
    const formatted = formatToastMessage("");
    expect(formatted.message).toBe("An unexpected error occurred. Please try again.");
  });

  it("extracts clean title when provided", () => {
    const formatted = formatToastMessage("Quota exceeded", "Gemini API Limit");
    expect(formatted.title).toBe("Gemini API Limit");
    expect(formatted.message).toBe("Quota exceeded");
  });
});