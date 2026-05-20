import { isNativePlatform } from "@/lib/platform";

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

type HapticsModule = typeof import("@capacitor/haptics");

let hapticsModulePromise: Promise<HapticsModule | null> | null = null;

const loadHaptics = async () => {
  if (!isNativePlatform()) return null;
  hapticsModulePromise ??= import("@capacitor/haptics").catch((err) => {
    console.warn("[haptics] plugin unavailable", err);
    return null;
  });
  return hapticsModulePromise;
};

export const haptics = {
  tap: async () => {
    try {
      const mod = await loadHaptics();
      if (!mod) return;
      await mod.Haptics.impact({ style: mod.ImpactStyle.Medium });
    } catch {
      // Ignore — some devices may not support haptics.
    }
  },
  select: async () => {
    try {
      const mod = await loadHaptics();
      if (!mod) return;
      await mod.Haptics.impact({ style: mod.ImpactStyle.Light });
    } catch {
      // Ignore.
    }
  },
  success: async () => {
    try {
      const mod = await loadHaptics();
      if (!mod) return;
      await mod.Haptics.notification({ type: mod.NotificationType.Success });
    } catch {
      // Ignore.
    }
  },
  warning: async () => {
    try {
      const mod = await loadHaptics();
      if (!mod) return;
      await mod.Haptics.notification({ type: mod.NotificationType.Warning });
    } catch {
      // Ignore.
    }
  },
  error: async () => {
    try {
      const mod = await loadHaptics();
      if (!mod) return;
      await mod.Haptics.notification({ type: mod.NotificationType.Error });
    } catch {
      // Ignore.
    }
  },
};
