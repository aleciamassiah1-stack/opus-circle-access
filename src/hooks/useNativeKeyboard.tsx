/**
 * Native keyboard handling for iOS/Android.
 *
 * Capacitor's keyboard plugin emits show/hide events. We use them to:
 *   1. Set a CSS variable --kb-h with the keyboard height so layouts can
 *      shift content up (e.g. message composer above the keyboard).
 *   2. Scroll the focused input into view after the keyboard opens.
 *
 * Mount this once at the App root.
 */
import { useEffect } from "react";
import { isNativePlatform, isIosNative } from "@/lib/platform";

export function useNativeKeyboard() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        // Dynamic import so a missing/misconfigured @capacitor/keyboard pod
        // can never take down the whole JS bundle at module-load time —
        // which would manifest as a blank screen on launch (the exact issue
        // Apple App Review flagged under Guideline 2.1(a)).
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        if (cancelled) return;

        Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
        if (isIosNative()) {
          Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
        }

        const onShow = (info: { keyboardHeight: number }) => {
          document.documentElement.style.setProperty("--kb-h", `${info.keyboardHeight}px`);
          document.body.classList.add("kb-open");
          requestAnimationFrame(() => {
            const el = document.activeElement as HTMLElement | null;
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
              el.scrollIntoView({ block: "center", behavior: "smooth" });
            }
          });
        };

        const onHide = () => {
          document.documentElement.style.setProperty("--kb-h", "0px");
          document.body.classList.remove("kb-open");
        };

        const showSub = Keyboard.addListener("keyboardWillShow", onShow);
        const hideSub = Keyboard.addListener("keyboardWillHide", onHide);

        cleanup = () => {
          showSub.then((s) => s.remove()).catch(() => {});
          hideSub.then((s) => s.remove()).catch(() => {});
        };
      } catch (err) {
        console.warn("[useNativeKeyboard] plugin unavailable", err);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}

export function NativeKeyboardBridge() {
  useNativeKeyboard();
  return null;
}
