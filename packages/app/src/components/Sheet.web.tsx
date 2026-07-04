"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DRAG_ZONE =
  "[data-sheet-grab-row], [data-sheet-handle], [data-sheet-header]";

const PANEL_MS = 420;
const BACKDROP_MS = 320;
const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

type DragState = {
  pointerId: number;
  startY: number;
  startOffset: number;
  dragging: boolean;
  scrollEl: HTMLElement | null;
  samples: { y: number; t: number }[];
};

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelElRef = useRef<HTMLDivElement>(null);
  const offsetYRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
  } | null>(null);
  const wasDragClosingRef = useRef(false);
  const [mounted, setMounted] = useState(open);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [exiting, setExiting] = useState(false);

  const rubberOffset = (dy: number) => (dy >= 0 ? dy : dy * 0.12);

  const syncVisuals = useCallback((y: number, { animate = false } = {}) => {
    offsetYRef.current = y;
    const panel = panelElRef.current;
    const backdrop = backdropRef.current;
    const panelTransition = animate ? `transform ${PANEL_MS}ms ${EASING}` : "none";
    const backdropTransition = animate ? `opacity ${PANEL_MS}ms ${EASING}` : "none";

    if (panel) {
      panel.style.transition = panelTransition;
      panel.style.transform = `translate3d(0, ${y}px, 0)`;
    }
    if (backdrop) {
      const h = panel?.offsetHeight || window.innerHeight * 0.55;
      backdrop.style.transition = backdropTransition;
      backdrop.style.opacity = String(Math.max(0, 1 - y / (h * 0.82)));
    }
  }, []);

  const getVelocity = (samples: { y: number; t: number }[]) => {
    if (samples.length < 2) return 0;
    const first = samples[0]!;
    const last = samples[samples.length - 1]!;
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return (last.y - first.y) / dt;
  };

  const detachDragListeners = useCallback(() => {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    window.removeEventListener("pointercancel", listeners.up);
    dragListenersRef.current = null;
  }, []);

  const finishDrag = useCallback(() => {
    const d = dragRef.current;
    const current = offsetYRef.current;
    const panel = panelElRef.current;
    const h = panel?.offsetHeight || window.innerHeight;
    const velocity = d ? getVelocity(d.samples) : 0;
    const shouldDismiss =
      current > h * 0.2 || (velocity > 0.35 && current > 12);

    if (shouldDismiss) {
      wasDragClosingRef.current = true;
      setClosing(true);
      syncVisuals(h, { animate: true });
      window.setTimeout(onClose, PANEL_MS);
    } else {
      syncVisuals(0, { animate: true });
    }
    setDragging(false);
    dragRef.current = null;
  }, [onClose, syncVisuals]);

  const attachDragListeners = useCallback(() => {
    detachDragListeners();

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId || closing) return;

      const panel = panelElRef.current;
      if (!panel) return;

      if (!d.dragging) {
        const dy = e.clientY - d.startY;
        if (Math.abs(dy) <= 3) return;
        if (dy < 0) return;
        if (d.scrollEl && d.scrollEl.scrollTop > 0) {
          detachDragListeners();
          dragRef.current = null;
          return;
        }
        d.dragging = true;
        d.startOffset = offsetYRef.current;
        setDragging(true);
        panel.style.animation = "none";
      }

      e.preventDefault();
      const raw = e.clientY - d.startY + (d.startOffset || 0);
      syncVisuals(rubberOffset(raw));
      d.samples.push({ y: e.clientY, t: performance.now() });
      if (d.samples.length > 5) d.samples.shift();
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      detachDragListeners();
      panelElRef.current?.releasePointerCapture(e.pointerId);
      if (d.dragging) finishDrag();
      else dragRef.current = null;
    };

    dragListenersRef.current = { move: onMove, up: onUp };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }, [closing, detachDragListeners, finishDrag, syncVisuals]);

  const runExitAnimation = useCallback(() => {
    const panel = panelElRef.current;
    const backdrop = backdropRef.current;
    if (panel) {
      panel.style.animation = "";
      panel.style.transition = "";
      panel.style.transform = "";
    }
    if (backdrop) {
      backdrop.style.transition = "";
      backdrop.style.opacity = "";
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setExiting(true));
    });
  }, []);

  useEffect(() => () => detachDragListeners(), [detachDragListeners]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setExiting(false);
      setDragging(false);
      wasDragClosingRef.current = false;
      dragRef.current = null;
      offsetYRef.current = 0;
      return;
    }

    if (!mounted) return;

    if (wasDragClosingRef.current) {
      wasDragClosingRef.current = false;
      setMounted(false);
      setClosing(false);
      setExiting(false);
      return;
    }

    runExitAnimation();
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      setExiting(false);
    }, PANEL_MS);
    return () => clearTimeout(t);
  }, [open, mounted, runExitAnimation]);

  const onPanelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (closing || e.button !== 0) return;
    const panel = panelElRef.current;
    if (!panel) return;

    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'input, textarea, button, select, a, label, [contenteditable="true"], [role="button"]',
      )
    ) {
      return;
    }

    const inDragZone = target?.closest(DRAG_ZONE);

    let scrollEl: HTMLElement | null = null;
    if (!inDragZone) {
      let el = target;
      while (el && el !== panel) {
        if (el.scrollHeight > el.clientHeight + 1) {
          const style = getComputedStyle(el);
          if (style.overflowY === "auto" || style.overflowY === "scroll") {
            scrollEl = el;
            break;
          }
        }
        el = el.parentElement;
      }
    }

    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startOffset: offsetYRef.current,
      dragging: !!inDragZone,
      scrollEl,
      samples: [{ y: e.clientY, t: performance.now() }],
    };

    attachDragListeners();
    panel.setPointerCapture(e.pointerId);

    if (inDragZone) {
      panel.style.animation = "none";
      setDragging(true);
    }
  };

  const onPanelPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragListenersRef.current?.up(e.nativeEvent);
  };

  const onPanelPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    detachDragListeners();
    panelElRef.current?.releasePointerCapture(e.pointerId);
    syncVisuals(0, { animate: true });
    setDragging(false);
    dragRef.current = null;
  };

  if (!mounted) return null;

  const handleBackdropClose = () => {
    if (closing || exiting) return;
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClose}
      className={`rp-sheet-backdrop fixed inset-0 z-[75] flex items-end${exiting ? " rp-sheet-backdrop--closing" : ""}`}
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
    >
      <div
        ref={panelElRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPanelPointerDown}
        onPointerUp={onPanelPointerUp}
        onPointerCancel={onPanelPointerCancel}
        className={`rp-sheet-panel relative mx-auto w-full max-w-[440px] rounded-t-sheet border-t border-border bg-surface2 px-5 pb-8 pt-4${dragging ? " rp-sheet-panel--dragging" : ""}${exiting ? " rp-sheet-panel--exit" : ""}`}
      >
        <div
          data-sheet-grab-row
          className="rp-sheet-grab-row -mx-5 -mt-2 mb-0 flex w-[calc(100%+40px)] items-center justify-center px-5 pb-4 pt-3.5"
          aria-hidden
        >
          <div
            data-sheet-handle
            className="h-[5px] w-11 rounded-full bg-border"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
