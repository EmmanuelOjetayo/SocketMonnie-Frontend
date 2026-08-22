import { useRef } from "react";

/** 4-6 digit OTP entry — each box auto-advances on input. */
export function OtpInput({ length = 4, value, onChange }) {
  const refs = useRef([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function handleChange(i, char) {
    const next = digits.slice();
    next[i] = char.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (char && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          className="size-14 rounded-control border border-border bg-card text-center text-xl font-bold text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      ))}
    </div>
  );
}
