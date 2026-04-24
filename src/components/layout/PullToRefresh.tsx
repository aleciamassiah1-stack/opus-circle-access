import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTriggerRefresh } from "@/contexts/RefreshBus";

interface PullToRefreshProps {
  /** Called when the user completes a pull gesture. Should refetch data. */
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  /** Distance (px) to drag before a refresh fires. */
  threshold?: number;
  /** Maximum drag distance (px) before resistance maxes out. */
  maxPull?: number;
}

/**
 * PullToRefresh — touch-driven pull-to-refresh wrapper.
 *
 * Works on iOS/Android (web + Capacitor) by listening to touch events on the
 * window and only activating when the page is scrolled to the very top.
 * Mouse/desktop users see no UI — they can keep using the browser's reload.
 *
 * Also fires the global RefreshBus token so individual child fetchers
 * (e.g. MessagingInbox, TalentDirectory) can refetch in lockstep.
 */
export const PullToRefresh = ({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 140,
}: PullToRefreshProps) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);
  const triggerBus = useTriggerRefresh();

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Only start tracking when the page is scrolled to the very top.
      if (window.scrollY > 0 || refreshing) {
        startY.current = null;
        tracking.current = false;
        return;
      }
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        // User started scrolling up — abandon the pull.
        setPull(0);
        tracking.current = false;
        return;
      }
      // Apply rubber-band resistance so the pull feels native.
      const resisted = Math.min(maxPull, delta * 0.5);
      setPull(resisted);
    };

    const onTouchEnd = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      const shouldRefresh = pull >= threshold;
      if (shouldRefresh) {
        setRefreshing(true);
        setPull(threshold); // hold the indicator at the trigger line
        try {
          // Fan out: dashboard-level refetch + per-child bus signal.
          triggerBus();
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pull, refreshing, threshold, maxPull, onRefresh, triggerBus]);

  const opacity = Math.min(1, pull / threshold);
  const armed = pull >= threshold;

  return (
    <>
      {/* Pull indicator — fixed below the navbar so it appears to come from the top edge. */}
      <div
        aria-hidden={pull === 0 && !refreshing}
        className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
        style={{
          top: `calc(env(safe-area-inset-top) + 4rem)`,
          transform: `translateY(${pull - 40}px)`,
          opacity,
          transition: refreshing || tracking.current ? "none" : "transform 200ms ease, opacity 200ms ease",
        }}
      >
        <div className="bg-background border border-border rounded-full shadow-card h-10 w-10 flex items-center justify-center">
          <Loader2
            size={18}
            className={`text-gold ${refreshing ? "animate-spin" : ""}`}
            style={{
              transform: refreshing ? undefined : `rotate(${armed ? 180 : pull * 2}deg)`,
              transition: "transform 120ms ease",
            }}
          />
        </div>
      </div>
      {children}
    </>
  );
};

export default PullToRefresh;
