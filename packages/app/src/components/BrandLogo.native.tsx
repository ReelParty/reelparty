"use client";

import { Image } from "react-native";
import logo from "../../assets/logo.png";

type BrandLogoProps = {
  size?: number;
};

/** ReelParty mark — shared app icon artwork. */
export function BrandLogo({ size = 104 }: BrandLogoProps) {
  return (
    <Image
      source={logo}
      accessibilityLabel="ReelParty"
      style={{ width: size, height: size }}
    />
  );
}
