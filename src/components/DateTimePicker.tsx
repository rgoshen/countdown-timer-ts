import React, { useEffect, useMemo, useState } from "react";

type TimeFormat = "24h" | "12h";

type Props = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  format?: TimeFormat;
};

function split(initial: string) {
  if (!initial) return { d: "", h24: "00", m: "00", s: "00" };
  const [date, time] = initial.split("T");
  if (!time) return { d: date ?? "", h24: "00", m: "00", s: "00" };
  const [hh="00", mm="00", ss="00"] = time.split(":");
  return { d: date ?? "", h24: hh.padStart(2, "0"), m: mm.padStart(2, "0"), s: (ss ?? "00").padStart(2, "0") };
}

function toDisplayHour(h24: number): { h12: string; meridiem: "AM" | "PM" } {
  const pm = h24 >= 12;
  const raw = h24 % 12;
  const h12 = raw === 0 ? 12 : raw;
  return { h12: String(h12).padStart(2, "0"), meridiem: pm ? "PM" : "AM" };
}

function fromDisplayHour(h12Str: string, meridiem: "AM" | "PM"): number {
  let h12 = parseInt(h12Str, 10);
  if (isNaN(h12)) h12 = 12;
  if (h12 < 1) h12 = 1;
  if (h12 > 12) h12 = 12;
  const base = h12 % 12;
  return base + (meridiem === "PM" ? 12 : 0);
}

export default function DateTimePicker({ value, onChange, min, format = "24h" }: Props) {
  const base = useMemo(() => split(value), [value]);
  const [date, setDate] = useState<string>(base.d);
  const [h24, setH24] = useState<string>(base.h24);
  const [h12, setH12] = useState<string>(toDisplayHour(parseInt(base.h24,10)||0).h12);
  const [meridiem, setMeridiem] = useState<"AM"|"PM">(toDisplayHour(parseInt(base.h24,10)||0).meridiem);
  const [mm, setMm] = useState<string>(base.m);
  const [ss, setSs] = useState<string>(base.s);

  useEffect(() => {
    setDate(base.d);
    setH24(base.h24);
    const disp = toDisplayHour(parseInt(base.h24, 10) || 0);
    setH12(disp.h12);
    setMeridiem(disp.meridiem);
    setMm(base.m);
    setSs(base.s);
  }, [base.d, base.h24, base.m, base.s]);

  useEffect(() => {
    if (!date) return;
    let hour: number;
    if (format === "12h") {
      hour = fromDisplayHour(h12, meridiem);
    } else {
      hour = Math.max(0, Math.min(23, parseInt(h24, 10) || 0));
    }
    const hhStr = String(hour).padStart(2, "0");
    const next = `${date}T${hhStr}:${mm.padStart(2, "0")}:${ss.padStart(2, "0")}`;
    onChange(next);
  }, [date, h24, h12, meridiem, mm, ss, format, onChange]);

  const minDate = min ? (min.split("T")[0] ?? "") : "";

  return (
    <div className="dtp">
      <div className="dtp-row">
        <label className="dtp-label" htmlFor="dtp-date">Date</label>
        <input
          id="dtp-date"
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Select date"
          className="dtp-input"
        />
      </div>

      <div className="dtp-row">
        <label className="dtp-label">Time</label>
        <div className="dtp-time">
          {format === "24h" ? (
            <select
              aria-label="Hours"
              value={h24}
              onChange={(e) => setH24(e.target.value.padStart(2, "0"))}
              className="dtp-select"
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const v = String(i).padStart(2, "0");
                return <option key={v} value={v}>{v}</option>;
              })}
            </select>
          ) : (
            <>
              <select
                aria-label="Hours"
                value={h12}
                onChange={(e) => setH12(e.target.value.padStart(2, "0"))}
                className="dtp-select"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const v = String(i === 0 ? 12 : i).padStart(2, "0");
                  return <option key={v} value={v}>{v}</option>;
                })}
              </select>
              <select
                aria-label="AM/PM"
                value={meridiem}
                onChange={(e) => setMeridiem(e.target.value as "AM"|"PM")}
                className="dtp-select"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </>
          )}

          <span className="dtp-colon">:</span>
          <select
            aria-label="Minutes"
            value={mm}
            onChange={(e) => setMm(e.target.value.padStart(2, "0"))}
            className="dtp-select"
          >
            {Array.from({ length: 60 }).map((_, i) => {
              const v = String(i).padStart(2, "0");
              return <option key={v} value={v}>{v}</option>;
            })}
          </select>
          <span className="dtp-colon">:</span>
          <select
            aria-label="Seconds"
            value={ss}
            onChange={(e) => setSs(e.target.value.padStart(2, "0"))}
            className="dtp-select"
          >
            {Array.from({ length: 60 }).map((_, i) => {
              const v = String(i).padStart(2, "0");
              return <option key={v} value={v}>{v}</option>;
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
