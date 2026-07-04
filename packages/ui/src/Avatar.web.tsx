import { avatarColorFor, avatarIndexFor } from "@reelparty/shared";
import { renderAvatarFace } from "./avatarFaces.web";
import type { AvatarProps } from "./Avatar";

const STROKE = "#1a1a22";

/** Web avatar — native HTML SVG so face strokes render reliably in the browser. */
export function Avatar({ id, name, sm, size, color, faceIndex }: AvatarProps) {
  const s = size ?? (sm ? 26 : 34);
  const seed = id || name || "";
  const idx = faceIndex ?? avatarIndexFor(seed);
  const bg = color || avatarColorFor(seed);
  const label = name ? `${name} avatar` : "User avatar";

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      role="img"
      aria-label={label}
      className="block shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]"
    >
      <circle cx={24} cy={24} r={24} fill={bg} />
      <g
        stroke={STROKE}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {renderAvatarFace(idx)}
      </g>
    </svg>
  );
}

export type { AvatarProps };
