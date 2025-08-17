import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../App";

describe("App integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows error for past date and no error for future date, and finishes when time passes", async () => {
    const base = new Date("2030-01-01T12:00:00");
    vi.setSystemTime(base);

    render(<App />);

    const input = screen.getByLabelText(/choose future date and time/i) as HTMLInputElement;

    // Past date -> error
    fireEvent.change(input, { target: { value: "2029-12-31T23:59" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/future date/i);

    // Exact current time -> still not future
    fireEvent.change(input, { target: { value: "2030-01-01T12:00" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/future date/i);

    // One minute in the future
    fireEvent.change(input, { target: { value: "2030-01-01T12:01" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Seconds")).toBeInTheDocument();

    vi.advanceTimersByTime(61000);
    await Promise.resolve();
    expect(await screen.findByText(/Time’s up!/)).toBeInTheDocument();
  });
});
