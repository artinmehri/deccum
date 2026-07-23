"use client";

import {
  integerToDisplay,
  moneyToDisplay,
  parseIntegerInput,
  parseMoneyInput,
} from "@/lib/numericInput";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Mode = "integer" | "money";

export function NumericInput({
  label,
  value,
  onChange,
  mode = "integer",
  prefix,
  placeholder,
  emptyWhenZero = false,
  hint,
  className,
  inputClassName,
  id,
}: {
  label?: string;
  /** Numeric value from parent. `null` = blank field. */
  value: number | null;
  onChange: (value: number | null) => void;
  mode?: Mode;
  prefix?: string;
  placeholder?: string;
  /** Show blank instead of "0" (useful for optional amounts). */
  emptyWhenZero?: boolean;
  hint?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
}) {
  const toDisplay =
    mode === "money"
      ? (v: number | null) => moneyToDisplay(v, emptyWhenZero)
      : (v: number | null) => integerToDisplay(v, emptyWhenZero);

  const [text, setText] = useState(() => toDisplay(value));

  useEffect(() => {
    setText(toDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when parent value changes
  }, [value, mode, emptyWhenZero]);

  function handleChange(raw: string) {
    const parsed =
      mode === "money" ? parseMoneyInput(raw) : parseIntegerInput(raw);
    setText(parsed.display);
    onChange(parsed.value);
  }

  const field = (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
          {prefix}
        </span>
      ) : null}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className={cn(
          "w-full rounded-2xl border border-line bg-white py-3.5 text-lg outline-none transition placeholder:text-ink-soft/50 focus:border-accent focus:ring-4 focus:ring-accent/15",
          prefix ? "pl-9 pr-4" : "px-4",
          inputClassName,
        )}
      />
    </div>
  );

  if (!label) {
    return <div className={className}>{field}</div>;
  }

  return (
    <label className={cn("block", className)}>
      <span className="text-base font-semibold text-ink">{label}</span>
      {hint ? (
        <span className="mt-0.5 block text-sm text-ink-soft">{hint}</span>
      ) : null}
      <div className="mt-2">{field}</div>
    </label>
  );
}
