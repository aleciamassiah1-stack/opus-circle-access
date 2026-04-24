import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

/**
 * Haptics helper — wraps Capacitor Haptics so calls are safe on web.
 *
 * On native (iOS/Android) this triggers real device vibration.
 * On web, the calls no-op silently — no try/catch noise in the console,
 * no Web Vibration API fallback (which feels jarring on desktop browsers).
 *
 * Use these for moments that benefit from physical confirmation:
 *  - tap()      → primary buttons (Apply, Send, Sign In)
 *  - select()   → tab switches, list-row selects, toggles
 *  - success()  → completed mutations (form submitted, message sent)
 *  - warning()  → destructive confirmations
 *  - error()    → failed mutations / validation errors
 */

const isNative = Capacitor.isNativePlatform();

export const haptics = {
  tap: async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Ignore — some devices may not support haptics.
    }
  },
  select: async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore.
    }
  },
  success: async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Ignore.
    }
  },
  warning: async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      // Ignore.
    }
  },
  error: async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Ignore.
    }
  },
};
