"use client";

import { useEffect, useState, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

const FOOTER_RESERVED = 72;
/** iOS Safari often under-reports keyboard overlap via visualViewport. */
const KEYBOARD_EXTRA_LIFT = 44;

/** Mobile web: pin the action above the on-screen keyboard via visualViewport. */
export function KeyboardFloatingFooter({ children }: { children: ReactNode }) {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const overlap = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
        setKeyboardInset(
          overlap > 0 ? overlap + KEYBOARD_EXTRA_LIFT : 0,
        );
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const shellStyle: ViewStyle = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: keyboardInset,
    zIndex: 50,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 20,
  };

  return (
    <>
      <View className="flex-1" />
      <View style={{ height: FOOTER_RESERVED }} />
      <View pointerEvents="box-none" style={shellStyle}>
        <View style={{ width: "100%", maxWidth: 440 }}>{children}</View>
      </View>
    </>
  );
}
