import { render, screen } from "@testing-library/react";
import React from "react";
import CountdownDisplay from "../components/CountdownDisplay";
import { TimeLeft } from "../types/time";

describe("CountdownDisplay", () => {
  it("renders all units with padded values", () => {
    const tl: TimeLeft = { weeks: 0, days: 1, hours: 2, minutes: 3, seconds: 4 };
    render(<CountdownDisplay timeLeft={tl} />);
    expect(screen.getByText("Weeks")).toBeInTheDocument();
    expect(screen.getByText("Days")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
    expect(screen.getByText("Minutes")).toBeInTheDocument();
    expect(screen.getByText("Seconds")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });
});
