/**
 * components/ui/Loader.tsx
 * Animated SchoolBridge logo used as a full-screen loading/splash screen.
 *
 * Reproduces the brand intro animation on a loop: the feet pop in, the arch
 * draws, a keystone drops with a ripple, and the "SchoolBridge" wordmark wipes
 * in — then the whole sequence replays every `interval` ms for as long as the
 * loader is mounted. Keyframes live in globals.css (`.sb-stage.run …`).
 * Honours prefers-reduced-motion by rendering the resting (visible) logo.
 *
 * Use `<Loader />` for a full-screen overlay (e.g. route loading.tsx), or
 * `<Loader fullScreen={false} />` to drop it inside a smaller container.
 */
'use client';

import { useEffect, useRef } from 'react';

type LoaderProps = {
  /** Cover the whole viewport with the dark brand background. Default true. */
  fullScreen?: boolean;
  /** Mark height in px; the wordmark scales with it. Default 148. */
  size?: number;
  /** Milliseconds between replays of the intro. Default 4800 (matches brand). */
  interval?: number;
  className?: string;
};

export function Loader({
  fullScreen = true,
  size = 148,
  interval = 4800,
  className,
}: LoaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Restart the CSS keyframe timeline by toggling `run` with a forced reflow,
    // mirroring the standalone logo's replay loop.
    const play = () => {
      stage.classList.remove('run');
      void stage.offsetWidth; // force reflow so the animation restarts
      stage.classList.add('run');
    };

    play();
    let timer = window.setInterval(() => {
      if (!document.hidden) play();
    }, interval);

    // A backgrounded tab pauses CSS animations; resync on return.
    const onVisible = () => {
      if (!document.hidden) {
        play();
        window.clearInterval(timer);
        timer = window.setInterval(() => {
          if (!document.hidden) play();
        }, interval);
      } else {
        window.clearInterval(timer);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [interval]);

  return (
    <div
      ref={stageRef}
      role="status"
      aria-live="polite"
      aria-label="Loading SchoolBridge"
      className={[
        'sb-stage run',
        fullScreen
          ? 'fixed inset-0 z-50 flex h-screen w-screen'
          : 'flex h-full w-full',
        'items-center justify-center overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="sb-lockup flex items-center gap-[26px]">
        <svg
          className="sb-mark block overflow-visible"
          viewBox="0 0 100 100"
          style={{ width: size, height: size }}
          aria-hidden="true"
        >
          <path className="sb-arch" pathLength={100} d="M22 67 C22 33 78 33 78 67" />
          <circle className="sb-foot sb-footL" cx="22" cy="67" r="9" />
          <circle className="sb-foot sb-footR" cx="78" cy="67" r="9" />
          <circle className="sb-ring" cx="50" cy="31" r="7" />
          <circle className="sb-key" cx="50" cy="31" r="7" />
        </svg>
        <div
          className="sb-wm font-extrabold leading-none whitespace-nowrap"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          <span className="sb-wm-s">School</span>
          <span className="sb-wm-b">Bridge</span>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
