import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../App";

describe("Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("stores the selected datetime and rehydrates on reload", async () => {
    render(<App />);

    const date = screen.getByLabelText(/select date/i) as HTMLInputElement;
    const h = screen.getByLabelText(/hours/i) as HTMLSelectElement;
    const m = screen.getByLabelText(/minutes/i) as HTMLSelectElement;
    const s = screen.getByLabelText(/seconds/i) as HTMLSelectElement;

    fireEvent.change(date, { target: { value: "2030-01-01" } });
    fireEvent.change(h, { target: { value: "12" } });
    fireEvent.change(m, { target: { value: "10" } });
    fireEvent.change(s, { target: { value: "15" } });

    expect(localStorage.getItem("countdown-target")).toBe("2030-01-01T12:10:15");

    cleanup();
    render(<App />);

    const date2 = screen.getByLabelText(/select date/i) as HTMLInputElement;
    const h2 = screen.getByLabelText(/hours/i) as HTMLSelectElement;
    const m2 = screen.getByLabelText(/minutes/i) as HTMLSelectElement;
    const s2 = screen.getByLabelText(/seconds/i) as HTMLSelectElement;

    expect(date2.value).toBe("2030-01-01");
    expect(h2.value).toBe("12");
    expect(m2.value).toBe("10");
    expect(s2.value).toBe("15");
  });

  it("clears persisted value on Reset", () => {
    localStorage.setItem("countdown-target", "2030-01-01T12:01:00");
    render(<App />);
    const reset = screen.getByText(/reset/i);
    fireEvent.click(reset);
    expect(localStorage.getItem("countdown-target")).toBeNull();
  });
});
