/**
 * components/ui/SplashGate.tsx
 * Holds the animated SchoolBridge splash on screen for a minimum duration on
 * first load, then fades to reveal the app. This guarantees the full logo
 * intro is seen instead of flashing past as soon as the route is ready.
 *
 * Honours prefers-reduced-motion: motion-sensitive users skip the hold and
 * see the app immediately.
 */
'use client';

import { useEffect, useState } from 'react';
import { Loader } from './Loader';

export function SplashGate({
  children,
  /** Minimum time the splash stays up, in ms. Default 2600 (~one full cycle). */
  minDuration = 2600,
}: {
  children: React.ReactNode;
  minDuration?: number;
}) {
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      setDone(true);
      return;
    }

    const fadeAt = window.setTimeout(() => setFading(true), minDuration);
    const hideAt = window.setTimeout(() => setDone(true), minDuration + 450);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(hideAt);
    };
  }, [minDuration]);

  return (
    <>
      {children}
      {!done && (
        <div
          className={[
            'fixed inset-0 z-[100] transition-opacity duration-[450ms] ease-out',
            fading ? 'pointer-events-none opacity-0' : 'opacity-100',
          ].join(' ')}
        >
          <Loader />
        </div>
      )}
    </>
  );
}
