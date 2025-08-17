import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DateTimePicker from "../components/DateTimePicker";

describe("DateTimePicker", () => {
  it("emits combined ISO string when date or time changes", () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="" onChange={onChange} min="2025-01-01T00:00" />);

    const date = screen.getByLabelText(/select date/i) as HTMLInputElement;
    fireEvent.change(date, { target: { value: "2030-12-25" } });
    expect(onChange).toHaveBeenLastCalledWith("2030-12-25T00:00:00");

    const h = screen.getByLabelText(/hours/i) as HTMLSelectElement;
    const m = screen.getByLabelText(/minutes/i) as HTMLSelectElement;
    const s = screen.getByLabelText(/seconds/i) as HTMLSelectElement;

    fireEvent.change(h, { target: { value: "09" } });
    expect(onChange).toHaveBeenLastCalledWith("2030-12-25T09:00:00");

    fireEvent.change(m, { target: { value: "05" } });
    expect(onChange).toHaveBeenLastCalledWith("2030-12-25T09:05:00");

    fireEvent.change(s, { target: { value: "30" } });
    expect(onChange).toHaveBeenLastCalledWith("2030-12-25T09:05:30");
  });
  it("supports 12-hour format with AM/PM", () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="" onChange={onChange} min="2025-01-01T00:00" format="12h" />);

    const date = screen.getByLabelText(/select date/i) as HTMLInputElement;
    fireEvent.change(date, { target: { value: "2030-12-25" } });

    const h = screen.getByLabelText(/hours/i) as HTMLSelectElement;
    const m = screen.getByLabelText(/minutes/i) as HTMLSelectElement;
    const s = screen.getByLabelText(/seconds/i) as HTMLSelectElement;
    const ap = screen.getByLabelText(/am\/pm/i) as HTMLSelectElement;

    fireEvent.change(h, { target: { value: "12" } });
    fireEvent.change(m, { target: { value: "05" } });
    fireEvent.change(s, { target: { value: "30" } });
    fireEvent.change(ap, { target: { value: "PM" } });
    expect(onChange).toHaveBeenLastCalledWith("2030-12-25T12:05:30");

    fireEvent.change(ap, { target: { value: "AM" } });
    expect(onChange).toHaveBeenLastCalledWith("2030-12-25T00:05:30");
  });

});
