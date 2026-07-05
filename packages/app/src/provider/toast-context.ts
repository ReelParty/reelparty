"use client";

import { createContext, useContext } from "react";

export interface ToastController {
  show: (msg: string) => void;
  dismiss: () => void;
}

export const ToastCtx = createContext<ToastController>({
  show: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastCtx).show;
}

export function useToastDismiss() {
  return useContext(ToastCtx).dismiss;
}
