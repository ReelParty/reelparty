"use client";

import { Image } from "react-native";

type BrandLogoProps = {
  size?: number;
};

/** ReelParty mark — loads from the web public folder. */
export function BrandLogo({ size = 104 }: BrandLogoProps) {
  return (
    <Image
      source={{ uri: "/logo.png" }}
      accessibilityLabel="ReelParty"
      style={{ width: size, height: size }}
    />
  );
}
