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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
import {
  TOAST_ENTER_MS,
  TOAST_EXIT_MS,
  TOAST_MS,
  TOAST_SWIPE_DISMISS_Y,
} from "./toast-constants";

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-18);
  const scale = useSharedValue(0.92);
  const dragY = useSharedValue(0);

  const finishUnmount = useCallback(() => {
    setMounted(false);
    setMsg("");
  }, []);

  const resetMotion = useCallback(() => {
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    cancelAnimation(scale);
    cancelAnimation(dragY);
    opacity.value = 0;
    translateY.value = -18;
    scale.value = 0.92;
    dragY.value = 0;
  }, [dragY, opacity, scale, translateY]);

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
    opacity.value = withTiming(1, { duration: TOAST_ENTER_MS });
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

  const animateOut = useCallback(
    (session: number, swipe = false) => {
      if (sessionRef.current !== session) return;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      opacity.value = withTiming(0, { duration: TOAST_EXIT_MS });
      translateY.value = withTiming(swipe ? -56 : -10, { duration: TOAST_EXIT_MS });
      scale.value = withTiming(0.96, { duration: TOAST_EXIT_MS });
      dragY.value = withTiming(0, { duration: TOAST_EXIT_MS }, (finished) => {
        if (finished && sessionRef.current === session) {
          runOnJS(finishUnmount)();
        }
      });
    },
    [dragY, finishUnmount, opacity, scale, translateY],
  );

  const dismissInteractive = useCallback(() => {
    animateOut(sessionRef.current, true);
  }, [animateOut]);

  const dismiss = useCallback(
    (session: number) => {
      animateOut(session, false);
    },
    [animateOut],
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

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(-8)
        .failOffsetX([-24, 24])
        .shouldCancelWhenOutside(false)
        .onUpdate((e) => {
          if (e.translationY < 0) {
            dragY.value = e.translationY;
          }
        })
        .onEnd((e) => {
          if (
            e.translationY < TOAST_SWIPE_DISMISS_Y ||
            e.velocityY < -650
          ) {
            runOnJS(dismissInteractive)();
            return;
          }
          dragY.value = withSpring(0, {
            damping: 16,
            stiffness: 220,
          });
        }),
    [dismissInteractive, dragY],
  );

  const toastStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + dragY.value },
      { scale: scale.value },
    ],
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
      <GestureDetector gesture={pan}>
        <Animated.View style={toastStyle}>
          <ToastBubbleContent msg={msg} />
        </Animated.View>
      </GestureDetector>
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
