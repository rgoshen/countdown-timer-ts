import { describe, it, expect } from "vitest";
import { diffToTimeLeft, nextTickDelay, isFutureDate, isValidDateString } from "../lib/time";

describe("lib/time", () => {
  it("diffToTimeLeft splits ms into weeks/days/hours/minutes/seconds", () => {
    const ms = (((1 * 7 + 2) * 24 + 3) * 60 + 4) * 60 * 1000 + 5 * 1000;
    const left = diffToTimeLeft(ms);
    expect(left.weeks).toBe(1);
    expect(left.days).toBe(2);
    expect(left.hours).toBe(3);
    expect(left.minutes).toBe(4);
    expect(left.seconds).toBe(5);
  });
  it("nextTickDelay aligns to next whole second", () => {
    expect(nextTickDelay(1000)).toBe(1000);
    expect(nextTickDelay(1001)).toBe(999);
    expect(nextTickDelay(1999)).toBe(1);
  });
  it("isValidDateString", () => {
    expect(isValidDateString("2030-01-01T12:00")).toBe(true);
    expect(isValidDateString("nope")).toBe(false);
  });
  it("isFutureDate", () => {
    const now = new Date("2030-01-01T12:00:00").getTime();
    const realNow = Date.now;
    Date.now = () => now;
    expect(isFutureDate("2030-01-01T12:01")).toBe(true);
    expect(isFutureDate("2029-12-31T23:59")).toBe(false);
    Date.now = realNow;
  });
});
