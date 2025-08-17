import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";

// Simple Consumer to expose controls in tests
function Consumer() {
  const { mode, setMode, computed } = useTheme();
  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="computed">{computed}</div>
      <button onClick={() => setMode("light")}>light</button>
      <button onClick={() => setMode("dark")}>dark</button>
      <button onClick={() => setMode("system")}>system</button>
    </div>
  );
}

function setupMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = [];
  // @ts-ignore
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: () => void) => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    },
    onchange: null,
    addListener: () => {}, // legacy
    removeListener: () => {}, // legacy
    dispatch: () => listeners.forEach((fn) => fn()),
  }));
  return {
    setMatches(next: boolean) {
      // @ts-ignore
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: next,
        media: query,
        addEventListener: (_: string, cb: () => void) => listeners.push(cb),
        removeEventListener: (_: string, cb: () => void) => {
          const i = listeners.indexOf(cb);
          if (i >= 0) listeners.splice(i, 1);
        },
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        dispatch: () => listeners.forEach((fn) => fn()),
      }));
      listeners.forEach((fn) => fn());
    }
  };
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("applies light/dark and persists selection; system follows matchMedia", () => {
    const control = setupMatchMedia(false); // system resolves to light

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    // default system -> light
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByTestId("computed")).toHaveTextContent("light");

    // user sets dark
    fireEvent.click(screen.getByText("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme-mode")).toBe("dark");

    // user sets light
    fireEvent.click(screen.getByText("light"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme-mode")).toBe("light");

    // system mode tracks matchMedia
    fireEvent.click(screen.getByText("system"));
    expect(localStorage.getItem("theme-mode")).toBe("system");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    // switch system to dark
    control.setMatches(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
