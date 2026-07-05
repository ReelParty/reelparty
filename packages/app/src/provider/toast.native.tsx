"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastBubbleContent } from "./toast-bubble";
import { ToastCtx, type ToastController } from "./toast-context";

const TOAST_MS = 2200;
const ENTER_MS = 280;
const EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-18);
  const scale = useSharedValue(0.92);

  const finishUnmount = useCallback(() => {
    setMounted(false);
    setMsg("");
  }, []);

  const resetMotion = useCallback(() => {
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    cancelAnimation(scale);
    opacity.value = 0;
    translateY.value = -18;
    scale.value = 0.92;
  }, [opacity, scale, translateY]);

  const dismissNow = useCallback(() => {
    sessionRef.current += 1;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    resetMotion();
    finishUnmount();
  }, [finishUnmount, resetMotion]);

  const animateIn = useCallback(() => {
    resetMotion();
    opacity.value = withTiming(1, { duration: ENTER_MS });
    translateY.value = withSpring(0, {
      damping: 16,
      stiffness: 220,
      mass: 0.7,
    });
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 240,
      mass: 0.7,
    });
  }, [opacity, resetMotion, scale, translateY]);

  const dismiss = useCallback(
    (session: number) => {
      if (sessionRef.current !== session) return;

      opacity.value = withTiming(0, { duration: EXIT_MS });
      translateY.value = withTiming(-10, { duration: EXIT_MS });
      scale.value = withTiming(0.96, { duration: EXIT_MS }, (finished) => {
        if (finished && sessionRef.current === session) {
          runOnJS(finishUnmount)();
        }
      });
    },
    [finishUnmount, opacity, scale, translateY],
  );

  const show = useCallback(
    (m: string) => {
      const session = ++sessionRef.current;
      if (timer.current) clearTimeout(timer.current);

      setMsg(m);
      setMounted(true);
      timer.current = setTimeout(() => dismiss(session), TOAST_MS);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!mounted || !msg) return;
    const frame = requestAnimationFrame(() => animateIn());
    return () => cancelAnimationFrame(frame);
  }, [mounted, msg, animateIn]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toastStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    alignSelf: "center",
    width: "100%",
    maxWidth: "92%",
  }));

  const controller = useMemo<ToastController>(
    () => ({ show, dismiss: dismissNow }),
    [dismissNow, show],
  );

  const overlay = (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { paddingTop: insets.top + 16 }]}
    >
      <Animated.View style={toastStyle} pointerEvents="none">
        <ToastBubbleContent msg={msg} />
      </Animated.View>
    </View>
  );

  return (
    <ToastCtx.Provider value={controller}>
      {children}
      {mounted ? (
        Platform.OS === "ios" ? (
          <FullWindowOverlay>{overlay}</FullWindowOverlay>
        ) : (
          <Modal
            visible
            transparent
            animationType="none"
            statusBarTranslucent
            presentationStyle="overFullScreen"
            onRequestClose={() => {}}
          >
            {overlay}
          </Modal>
        )
      ) : null}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
});
