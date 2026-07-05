"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastBubbleContent } from "./toast-bubble";
import { ToastCtx, type ToastController } from "./toast-context";

const TOAST_MS = 2200;
const ENTER_MS = 280;
const EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const stopAnimations = useCallback(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    scale.stopAnimation();
  }, [opacity, scale, translateY]);

  const dismissNow = useCallback(() => {
    sessionRef.current += 1;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    stopAnimations();
    opacity.setValue(0);
    translateY.setValue(-18);
    scale.setValue(0.92);
    setVisible(false);
    setMsg("");
  }, [opacity, scale, stopAnimations, translateY]);

  const dismiss = useCallback(
    (session: number) => {
      if (sessionRef.current !== session) return;

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: EXIT_MS,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: EXIT_MS,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: EXIT_MS,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (sessionRef.current !== session || !finished) return;
        setVisible(false);
        setMsg("");
      });
    },
    [opacity, scale, translateY],
  );

  const show = useCallback(
    (m: string) => {
      const session = ++sessionRef.current;
      if (timer.current) clearTimeout(timer.current);

      stopAnimations();
      setMsg(m);
      setVisible(true);
      timer.current = setTimeout(() => dismiss(session), TOAST_MS);
    },
    [dismiss, stopAnimations],
  );

  useEffect(() => {
    if (!visible || !msg) return;

    stopAnimations();
    opacity.setValue(0);
    translateY.setValue(-18);
    scale.setValue(0.92);

    const frame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 220,
          mass: 0.7,
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 240,
          mass: 0.7,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ENTER_MS,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, msg, opacity, scale, stopAnimations, translateY]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const overlayStyle: ViewStyle = {
    position: "fixed",
    top: insets.top + 16,
    left: 0,
    right: 0,
    zIndex: 9999,
  };

  const controller = useMemo<ToastController>(
    () => ({ show, dismiss: dismissNow }),
    [dismissNow, show],
  );

  return (
    <ToastCtx.Provider value={controller}>
      {children}
      {visible ? (
        <View
          pointerEvents="none"
          className="items-center px-6"
          style={overlayStyle}
        >
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY }, { scale }],
              maxWidth: "92%",
            }}
          >
            <ToastBubbleContent msg={msg} />
          </Animated.View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}
