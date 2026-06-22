/**
 * src/design/Icon.tsx
 * 24px stroke icon set ported from the mockup's ICON_PATHS (data.jsx).
 * Rendered with react-native-svg. Each icon is a list of primitives so we can
 * mix paths / rects / circles exactly as the original SVGs did.
 */
import React from 'react';
import Svg, { Path, Rect, Circle, type NumberProp } from 'react-native-svg';

type Prim =
  | { t: 'path'; d: string; fill?: boolean }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill?: boolean }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: boolean };

const p = (d: string, fill = false): Prim => ({ t: 'path', d, fill });

export const ICONS: Record<string, Prim[]> = {
  home: [p('M3 10.5 12 3l9 7.5'), p('M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5'), p('M9.5 21v-6h5v6')],
  report: [{ t: 'rect', x: 5, y: 3, w: 14, h: 18, rx: 2.5 }, p('M9 8h6M9 12h6M9 16h4')],
  homework: [p('M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 1.5z'), p('M20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 1.5z')],
  chat: [p('M21 11.5a7.5 7.5 0 0 1-10.6 6.8L4 20l1.7-5.1A7.5 7.5 0 1 1 21 11.5Z')],
  user: [{ t: 'circle', cx: 12, cy: 8, r: 4 }, p('M4.5 20a7.5 7.5 0 0 1 15 0')],
  bell: [p('M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z'), p('M10 19a2 2 0 0 0 4 0')],
  mic: [{ t: 'rect', x: 9, y: 3, w: 6, h: 11, rx: 3 }, p('M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7')],
  play: [p('M7 5.5 18 12 7 18.5z', true)],
  pause: [{ t: 'rect', x: 7, y: 5, w: 3.5, h: 14, rx: 1.2, fill: true }, { t: 'rect', x: 13.5, y: 5, w: 3.5, h: 14, rx: 1.2, fill: true }],
  check: [p('M4.5 12.5 9.5 17.5 19.5 6.5')],
  checkCircle: [{ t: 'circle', cx: 12, cy: 12, r: 9 }, p('M8 12.2l2.8 2.8L16.2 9')],
  star: [p('M12 3.5 14.6 9l6 .7-4.4 4 1.2 5.9L12 16.8 6.6 19.6 7.8 13.7 3.4 9.7l6-.7z')],
  starFill: [p('M12 3.5 14.6 9l6 .7-4.4 4 1.2 5.9L12 16.8 6.6 19.6 7.8 13.7 3.4 9.7l6-.7z', true)],
  chevR: [p('M9 5l7 7-7 7')],
  chevL: [p('M15 5l-7 7 7 7')],
  chevD: [p('M5 9l7 7 7-7')],
  plus: [p('M12 5v14M5 12h14')],
  calendar: [{ t: 'rect', x: 4, y: 5, w: 16, h: 16, rx: 2.5 }, p('M4 9.5h16M8 3v4M16 3v4')],
  send: [p('M5 12 20 5l-4 15-4.5-6L5 12z')],
  camera: [p('M4 8.5A2 2 0 0 1 6 6.5h1.5L9 4.5h6l1.5 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z'), { t: 'circle', cx: 12, cy: 13, r: 3.2 }],
  sparkle: [p('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', true)],
  trophy: [p('M7 4h10v4a5 5 0 0 1-10 0z'), p('M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9.5 14h5l.5 4h-6z'), p('M8 21h8')],
  clock: [{ t: 'circle', cx: 12, cy: 12, r: 8.5 }, p('M12 7.5V12l3 2')],
  pin: [p('M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z'), { t: 'circle', cx: 12, cy: 10, r: 2.5 }],
  money: [{ t: 'rect', x: 3, y: 6, w: 18, h: 12, rx: 2.5 }, { t: 'circle', cx: 12, cy: 12, r: 2.8 }, p('M6.5 9.5v5M17.5 9.5v5')],
  dots: [{ t: 'circle', cx: 5, cy: 12, r: 1.6, fill: true }, { t: 'circle', cx: 12, cy: 12, r: 1.6, fill: true }, { t: 'circle', cx: 19, cy: 12, r: 1.6, fill: true }],
  edit: [p('M16.5 4.5l3 3L8 19l-4 1 1-4z')],
  search: [{ t: 'circle', cx: 11, cy: 11, r: 6.5 }, p('M20 20l-4-4')],
  smile: [{ t: 'circle', cx: 12, cy: 12, r: 9 }, p('M8.5 14.5a4.5 4.5 0 0 0 7 0'), p('M9 9.5h.01M15 9.5h.01')],
  flag: [p('M6 21V4M6 4h11l-2 4 2 4H6')],
  arrowUp: [p('M12 19V6M6 11l6-6 6 6')],
  book: [p('M4 5.5A2 2 0 0 1 6 4h12v14H6a2 2 0 0 0-2 1.5z'), p('M4 19.5A2 2 0 0 1 6 18h12v2')],
  beaker: [p('M9 3v6l-4.5 8A2 2 0 0 0 6.3 20h11.4a2 2 0 0 0 1.8-3L15 9V3'), p('M8 3h8M6.5 14h11')],
  globe: [{ t: 'circle', cx: 12, cy: 12, r: 9 }, p('M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18')],
  abc: [p('M3 17l2.5-7 2.5 7M3.8 14.5h3.4M12 17V8h2.6a2.2 2.2 0 0 1 0 4.4H12m0 0h2.9a2.3 2.3 0 0 1 0 4.6H12M21 10a2.5 2.5 0 0 0-4 2v0a2.5 2.5 0 0 0 4 2')],
  shield: [p('M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z'), p('M9 12l2 2 4-4')],
  paperclip: [p('M19 11l-7.5 7.5a4 4 0 0 1-5.7-5.7l8-8a2.6 2.6 0 0 1 3.7 3.7l-8 8a1.2 1.2 0 0 1-1.7-1.7L15 9')],
};

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 22, color = '#000', stroke = 1.8 }: IconProps) {
  const prims = ICONS[name] ?? [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {prims.map((prim, i) => {
        const stroked: { stroke?: string; strokeWidth?: NumberProp; fill: string } = prim.fill
          ? { fill: color }
          : { stroke: color, strokeWidth: stroke, fill: 'none' };
        if (prim.t === 'path') {
          return (
            <Path
              key={i}
              d={prim.d}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...stroked}
            />
          );
        }
        if (prim.t === 'rect') {
          return (
            <Rect
              key={i}
              x={prim.x}
              y={prim.y}
              width={prim.w}
              height={prim.h}
              rx={prim.rx}
              strokeLinejoin="round"
              {...stroked}
            />
          );
        }
        return <Circle key={i} cx={prim.cx} cy={prim.cy} r={prim.r} {...stroked} />;
      })}
    </Svg>
  );
}
