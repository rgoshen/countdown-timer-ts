import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../App";

describe("App integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00"));
  });
  afterEach(() => { vi.useRealTimers(); });

  it("validates and counts down; reset clears persistence", async () => {
    render(<App />);
    const date = screen.getByLabelText(/select date/i) as HTMLInputElement;
    const h = screen.getByLabelText(/hours/i) as HTMLSelectElement;
    const m = screen.getByLabelText(/minutes/i) as HTMLSelectElement;
    const s = screen.getByLabelText(/seconds/i) as HTMLSelectElement;

    // Past date -> error
    fireEvent.change(date, { target: { value: "2029-12-31" } });
    fireEvent.change(h, { target: { value: "23" } });
    fireEvent.change(m, { target: { value: "59" } });
    fireEvent.change(s, { target: { value: "00" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/future date/);

    // Valid future
    fireEvent.change(date, { target: { value: "2030-01-01" } });
    fireEvent.change(h, { target: { value: "12" } });
    fireEvent.change(m, { target: { value: "01" } });
    fireEvent.change(s, { target: { value: "00" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Seconds")).toBeInTheDocument();

    // Finish after 61s
    vi.advanceTimersByTime(61000);
    await Promise.resolve();
    expect(await screen.findByText(/Time’s up!/)).toBeInTheDocument();

    // Reset clears
    fireEvent.click(screen.getByText(/reset/i));
    expect(localStorage.getItem("countdown-target")).toBeNull();
  });
});
