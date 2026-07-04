import Svg, { Circle, G } from "react-native-svg";
import { avatarColorFor, avatarIndexFor } from "@reelparty/shared";
import { renderAvatarFace } from "./avatarFaces";

const STROKE = "#1a1a22";

export interface AvatarProps {
  id?: string;
  name?: string;
  sm?: boolean;
  size?: number;
  /** Stored member color from the server (preferred over derived). */
  color?: string;
  /** Stored member face index from the server (preferred over derived). */
  faceIndex?: number;
}

/** Deterministic doodle avatar, identical on web + native. */
export function Avatar({ id, name, sm, size, color, faceIndex }: AvatarProps) {
  const s = size ?? (sm ? 26 : 34);
  const seed = id || name || "";
  const idx = faceIndex ?? avatarIndexFor(seed);
  const bg = color || avatarColorFor(seed);
  const label = name ? `${name} avatar` : "User avatar";

  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" accessibilityLabel={label}>
      <Circle cx={24} cy={24} r={24} fill={bg} />
      <G
        key={idx}
        stroke={STROKE}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {renderAvatarFace(idx)}
      </G>
    </Svg>
  );
}
