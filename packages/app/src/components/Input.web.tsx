"use client";

import type { TextInputProps } from "react-native";
import { cn } from "@reelparty/ui";

/** Web URL input — avoids RN TextInput + sheet pointer-capture quirks. */
export function Input({ className, value, onChangeText, placeholder, ...rest }: TextInputProps & { className?: string }) {
  return (
    <input
      type="text"
      inputMode="url"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChangeText?.(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          rest.onSubmitEditing?.(
            {} as Parameters<NonNullable<TextInputProps["onSubmitEditing"]>>[0],
          );
        }
      }}
      className={cn(
        "w-full rounded-btn border-[3px] border-border bg-surface px-4 py-3.5 font-body text-lg font-bold text-text outline-none",
        className,
      )}
    />
  );
}

/** Big centered 5-digit code input. */
export function CodeInput({ className, value, onChangeText, placeholder, maxLength, ...rest }: TextInputProps & { className?: string }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={maxLength ?? 5}
      placeholder={placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChangeText?.(e.target.value.replace(/\D/g, ""))}
      className={cn(
        "w-full rounded-btn border-[3px] border-blue bg-surface px-4 py-3.5 text-center font-head text-3xl font-bold tracking-[12px] text-blueDk outline-none",
        className,
      )}
    />
  );
}
