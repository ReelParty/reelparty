import { useState, type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { PAL, type ButtonTone } from "@reelparty/shared";
import { cn } from "./cn";

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  children: ReactNode;
  tone?: ButtonTone;
  full?: boolean;
  sm?: boolean;
  disabled?: boolean;
  /** Disables press but keeps full opacity (e.g. inline spinner). */
  loading?: boolean;
}

/**
 * Duolingo-style chunky button with a colored bottom "lip" that depresses on
 * press. Works on web (react-native-web) and native identically.
 */
export function Button({
  children,
  tone = "green",
  full,
  sm,
  disabled,
  loading,
  ...rest
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const p = PAL[tone];
  const lipMax = 5;
  const pressDepth = 3;
  const lip = pressed ? lipMax - pressDepth : lipMax;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={cn(full && "w-full", "self-start", full && "self-stretch")}
      style={{
        opacity: loading ? 1 : inactive ? 0.45 : 1,
      }}
      {...rest}
    >
      <View
        className={cn(
          "flex-row items-center justify-center gap-2 rounded-btn",
          sm ? "px-4 py-2" : "px-5 py-3.5",
        )}
        style={{
          backgroundColor: p.c,
          borderBottomWidth: lip,
          borderBottomColor: p.lip,
          marginBottom: pressed ? pressDepth : 0,
          transform: [{ translateY: pressed ? pressDepth : 0 }],
        }}
      >
        {typeof children === "string" ? (
          <Text
            className="font-head font-bold"
            style={{ color: p.text, fontSize: sm ? 15 : 17, letterSpacing: 0.3 }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

/** Inline label styled to sit next to icons inside a Button. */
export function ButtonText({
  children,
  tone = "green",
  sm,
}: {
  children: ReactNode;
  tone?: ButtonTone;
  sm?: boolean;
}) {
  const p = PAL[tone];
  return (
    <Text
      className="font-head font-bold"
      style={{ color: p.text, fontSize: sm ? 15 : 17, letterSpacing: 0.3 }}
    >
      {children}
    </Text>
  );
}
