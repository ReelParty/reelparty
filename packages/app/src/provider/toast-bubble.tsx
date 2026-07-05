import { Platform, StyleSheet, Text, View } from "react-native";
import { PAL } from "@reelparty/shared";

export function ToastBubbleContent({ msg }: { msg: string }) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: PAL.purple.c,
    borderBottomWidth: 4,
    borderBottomColor: PAL.purple.lip,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: "100%",
    ...Platform.select({
      web: {
        boxShadow:
          "0 10px 28px rgba(206, 130, 255, 0.55), 0 6px 16px rgba(0, 0, 0, 0.45)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 14,
      },
    }),
  },
  text: {
    color: PAL.purple.text,
    fontFamily: "Fredoka",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
