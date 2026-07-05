"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastBubbleContent } from "./toast-bubble";
import { ToastCtx, type ToastController } from "./toast-context";
import {
  TOAST_ENTER_MS,
  TOAST_EXIT_MS,
  TOAST_MS,
  TOAST_SWIPE_DISMISS_Y,
} from "./toast-constants";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
  captureEl: HTMLElement | null;
  samples: { y: number; t: number }[];
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
  } | null>(null);

  const stopAnimations = useCallback(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    scale.stopAnimation();
    dragY.stopAnimation();
  }, [dragY, opacity, scale, translateY]);

  const resetMotion = useCallback(() => {
    opacity.setValue(0);
    translateY.setValue(-18);
    scale.setValue(0.92);
    dragY.setValue(0);
  }, [dragY, opacity, scale, translateY]);

  const finishDismiss = useCallback(
    (session: number) => {
      if (sessionRef.current !== session) return;
      setVisible(false);
      setMsg("");
      resetMotion();
    },
    [resetMotion],
  );

  const animateOut = useCallback(
    (session: number, swipe = false) => {
      if (sessionRef.current !== session) return;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: TOAST_EXIT_MS,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: swipe ? -56 : -10,
          duration: TOAST_EXIT_MS,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: TOAST_EXIT_MS,
          useNativeDriver: false,
        }),
        Animated.timing(dragY, {
          toValue: 0,
          duration: TOAST_EXIT_MS,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        finishDismiss(session);
      });
    },
    [dragY, finishDismiss, opacity, scale, translateY],
  );

  const dismissNow = useCallback(() => {
    sessionRef.current += 1;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    stopAnimations();
    resetMotion();
    setVisible(false);
    setMsg("");
  }, [resetMotion, stopAnimations]);

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
    resetMotion();

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
          duration: TOAST_ENTER_MS,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, msg, opacity, resetMotion, scale, stopAnimations, translateY]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const detachDragListeners = useCallback(() => {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    window.removeEventListener("pointercancel", listeners.up);
    dragListenersRef.current = null;
  }, []);

  const releaseDragCapture = useCallback((pointerId: number) => {
    const captureEl = dragRef.current?.captureEl;
    if (captureEl?.hasPointerCapture?.(pointerId)) {
      captureEl.releasePointerCapture(pointerId);
    }
  }, []);

  const finishDrag = useCallback(
    (dy: number, vy: number) => {
      if (dy < TOAST_SWIPE_DISMISS_Y || vy < -0.45) {
        dismissInteractive();
        return;
      }
      Animated.spring(dragY, {
        toValue: 0,
        damping: 16,
        stiffness: 220,
        useNativeDriver: false,
      }).start();
    },
    [dismissInteractive, dragY],
  );

  const attachDragListeners = useCallback(() => {
    detachDragListeners();

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;

      const dy = e.clientY - d.startY;
      const dx = e.clientX - d.startX;
      if (!d.dragging) {
        if (dy > -4 || Math.abs(dy) <= Math.abs(dx)) return;
        d.dragging = true;
        d.captureEl?.setPointerCapture?.(e.pointerId);
      }

      e.preventDefault();
      if (dy < 0) dragY.setValue(dy);
      d.samples.push({ y: e.clientY, t: performance.now() });
      if (d.samples.length > 5) d.samples.shift();
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;

      const dy = e.clientY - d.startY;
      let vy = 0;
      if (d.samples.length >= 2) {
        const first = d.samples[0]!;
        const last = d.samples[d.samples.length - 1]!;
        const dt = last.t - first.t;
        if (dt > 0) vy = (last.y - first.y) / dt;
      }

      detachDragListeners();
      releaseDragCapture(e.pointerId);
      dragRef.current = null;

      if (d.dragging) finishDrag(dy, vy);
    };

    dragListenersRef.current = { move: onMove, up: onUp };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }, [detachDragListeners, dragY, finishDrag, releaseDragCapture]);

  useEffect(() => () => detachDragListeners(), [detachDragListeners]);

  const onToastPointerDown = useCallback(
    (e: ReactPointerEvent<View>) => {
      const captureEl = e.currentTarget as unknown as HTMLElement;
      dragRef.current = {
        pointerId: e.nativeEvent.pointerId,
        startX: e.nativeEvent.clientX,
        startY: e.nativeEvent.clientY,
        dragging: false,
        captureEl,
        samples: [{ y: e.nativeEvent.clientY, t: performance.now() }],
      };
      attachDragListeners();
    },
    [attachDragListeners],
  );

  const onToastPointerUp = useCallback(
    (e: ReactPointerEvent<View>) => {
      dragListenersRef.current?.up(e.nativeEvent);
    },
    [],
  );

  const onToastPointerCancel = useCallback(
    (e: ReactPointerEvent<View>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.nativeEvent.pointerId) return;
      detachDragListeners();
      releaseDragCapture(e.nativeEvent.pointerId);
      dragRef.current = null;
      Animated.spring(dragY, {
        toValue: 0,
        damping: 16,
        stiffness: 220,
        useNativeDriver: false,
      }).start();
    },
    [detachDragListeners, dragY, releaseDragCapture],
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

  const translateYCombined = Animated.add(translateY, dragY);

  return (
    <ToastCtx.Provider value={controller}>
      {children}
      {visible ? (
        <View
          pointerEvents="box-none"
          className="items-center px-6"
          style={overlayStyle}
        >
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY: translateYCombined }, { scale }],
              maxWidth: "92%",
            }}
          >
            <View
              onPointerDown={onToastPointerDown}
              onPointerUp={onToastPointerUp}
              onPointerCancel={onToastPointerCancel}
              style={{ touchAction: "none" } as ViewStyle}
            >
              <ToastBubbleContent msg={msg} />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}
