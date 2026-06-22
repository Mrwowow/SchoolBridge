/**
 * components/ui/Logo.tsx
 * SchoolBridge brand logo, rendered from the SVG assets in /public/logo-svg.
 *
 * - `kind="lockup"` → arch mark + "SchoolBridge" wordmark (wide).
 * - `kind="mark"`   → arch mark only (square).
 * - `color`         → 'brand' (blue), 'white' (reversed, for dark backgrounds),
 *                     or 'mono' (single-colour ink; mark only).
 *
 * Size is controlled by `height` (px); width is derived from each asset's
 * intrinsic aspect ratio so the logo never distorts.
 */
import Image from 'next/image';

type Kind = 'lockup' | 'mark';
type Color = 'brand' | 'white' | 'mono';

// Intrinsic viewBox aspect ratios from the source SVGs.
const ASPECT: Record<Kind, number> = {
  lockup: 472 / 116,
  mark: 1,
};

function src(kind: Kind, color: Color): string {
  if (kind === 'mark') {
    const file =
      color === 'white'
        ? 'schoolbridge-mark-white'
        : color === 'mono'
          ? 'schoolbridge-mark-mono'
          : 'schoolbridge-mark';
    return `/logo-svg/${file}.svg`;
  }
  // lockup — only brand + white exist; fall back to brand for 'mono'.
  return color === 'white'
    ? '/logo-svg/schoolbridge-logo-white.svg'
    : '/logo-svg/schoolbridge-logo.svg';
}

export function Logo({
  kind = 'lockup',
  color = 'brand',
  height = 32,
  className,
  priority = false,
}: {
  kind?: Kind;
  color?: Color;
  /** Rendered height in px; width follows the asset aspect ratio. */
  height?: number;
  className?: string;
  /** Pass for above-the-fold logos (nav, login) to skip lazy-loading. */
  priority?: boolean;
}) {
  const width = Math.round(height * ASPECT[kind]);
  return (
    <Image
      src={src(kind, color)}
      alt="SchoolBridge"
      width={width}
      height={height}
      className={className}
      priority={priority}
      // SVGs aren't processed by Next's image optimizer; serve the raw asset.
      unoptimized
    />
  );
}
