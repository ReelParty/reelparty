import { View, type ReactNode } from "react-native";

/** Sheet title block (native: layout only; web adds drag-to-dismiss zone). */
export function SheetHeader({ children }: { children: ReactNode }) {
  return <View className="items-center">{children}</View>;
}
