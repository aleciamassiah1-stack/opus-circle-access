import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isNativePlatform, getPlatform } from "@/lib/platform";

/**
 * Registers the device for push notifications on native platforms (iOS/Android),
 * stores the resulting APNs/FCM token in the `device_tokens` table tied to the
 * current user, and routes incoming pushes back into the in-app notifications UI.
 *
 * No-op on web. Safe to mount once at the top of the app.
 *
 * Requirements (handled outside React):
 * - iOS: APNs key uploaded in Apple Developer + push entitlement in Xcode
 * - Android: FCM (Firebase Cloud Messaging) project + google-services.json
 * - Edge function `send-push-notification` configured with APNs/FCM credentials
 */
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Ask the user for permission. On iOS this triggers the system prompt
        // the first time; subsequent runs return the previously chosen value.
        const perm = await PushNotifications.checkPermissions();
        let receive = perm.receive;
        if (receive === "prompt" || receive === "prompt-with-rationale") {
          const requested = await PushNotifications.requestPermissions();
          receive = requested.receive;
        }
        if (receive !== "granted" || cancelled) return;

        // Save the token whenever APNs/FCM hands us one (initial + refresh).
        const regHandle = await PushNotifications.addListener("registration", async (token) => {
          if (cancelled) return;
          const platform = getPlatform();
          if (platform !== "ios" && platform !== "android") return;
          try {
            await supabase
              .from("device_tokens")
              .upsert(
                {
                  user_id: user.id,
                  token: token.value,
                  platform,
                  last_seen_at: new Date().toISOString(),
                },
                { onConflict: "user_id,token" },
              );
          } catch (err) {
            console.warn("device token upsert failed", err);
          }
        });

        const errHandle = await PushNotifications.addListener("registrationError", (err) => {
          console.warn("push registration error", err);
        });

        // Foreground push: surface as an in-app toast/notification refresh.
        const recvHandle = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            // Notifications are already persisted server-side in the
            // `notifications` table — realtime subscribers will pick them up.
            console.log("push received in foreground", notification);
          },
        );

        // Background tap: deep-link to the relevant area of the app.
        const actionHandle = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const path = (action.notification.data as Record<string, string> | undefined)?.path;
            if (path && typeof window !== "undefined") {
              window.location.assign(path);
            }
          },
        );

        // Now actually subscribe to APNs/FCM.
        await PushNotifications.register();

        cleanup = () => {
          regHandle.remove();
          errHandle.remove();
          recvHandle.remove();
          actionHandle.remove();
        };
      } catch (err) {
        console.warn("push notifications setup failed", err);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user]);
}

/**
 * Mountable component wrapper for routes that already use other hooks.
 */
export const PushNotificationRegistrar = () => {
  usePushNotifications();
  return null;
};
