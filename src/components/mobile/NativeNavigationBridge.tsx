import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Bridges native Capacitor navigation events into React Router.
 *
 *  1. Hardware back button (Android): pops React Router history when there's
 *     somewhere to go back to; otherwise lets Capacitor exit the app cleanly.
 *
 *  2. Deep link / Universal Link / custom-scheme open: when iOS or Android
 *     hands the app a URL (https://opulencetalentcollective.com/talent/123
 *     or otc://talent/123), strip the host and navigate to the path in React
 *     Router so the user lands on the right screen.
 *
 * Web build: this hook is a no-op — Capacitor.isNativePlatform() is false in
 * the browser and no listeners are registered.
 */
export function NativeNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Track listener handles so we can detach on unmount.
    const handles: Array<{ remove: () => Promise<void> }> = [];

    // ---------- Hardware back button (Android) ----------
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        // There's React Router history — go back one step.
        navigate(-1);
      } else {
        // We're at the root of the app's history. Per the user's preference,
        // exit immediately (standard Android behavior) instead of trapping
        // them with a "press back twice" prompt.
        App.exitApp();
      }
    }).then((h) => handles.push(h));

    // ---------- Deep link handler ----------
    // Fires for both Universal Links (https://opulencetalentcollective.com/...)
    // and custom-scheme URLs (otc://...). We normalize both to a path + search
    // string and feed it into React Router.
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        const incoming = new URL(event.url);

        // Recognized hosts/schemes for this app. Anything else is ignored so
        // we don't accidentally navigate on unrelated intents.
        const isUniversalLink =
          incoming.protocol === "https:" &&
          (incoming.hostname === "opulencetalentcollective.com" ||
            incoming.hostname === "www.opulencetalentcollective.com" ||
            incoming.hostname.endsWith(".lovable.app"));
        const isCustomScheme = incoming.protocol === "otc:";

        if (!isUniversalLink && !isCustomScheme) return;

        // For custom-scheme URLs like "otc://talent/123", URL parses the host
        // as "talent" and pathname as "/123". Reconstruct a single path.
        let path: string;
        if (isCustomScheme) {
          const host = incoming.hostname; // e.g. "talent"
          const rest = incoming.pathname; // e.g. "/123"
          path = `/${host}${rest === "/" ? "" : rest}`;
        } else {
          path = incoming.pathname || "/";
        }

        const fullPath = `${path}${incoming.search}${incoming.hash}`;
        navigate(fullPath);
      } catch (err) {
        // Malformed URL — log and ignore so the app stays stable.
        console.warn("[NativeNavigationBridge] Could not parse deep link:", event.url, err);
      }
    }).then((h) => handles.push(h));

    return () => {
      // Detach all listeners on unmount to avoid duplicates during HMR.
      handles.forEach((h) => h.remove().catch(() => undefined));
    };
  }, [navigate]);

  return null;
}
