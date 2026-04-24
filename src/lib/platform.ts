/**
 * Platform detection helpers for Capacitor (iOS / Android / web).
 *
 * Apple's App Store guidelines (3.1.1) require digital subscriptions sold
 * inside an iOS app to use Apple's In-App Purchase system. Stripe is not
 * permitted for digital subscriptions on iOS. To stay compliant we hide
 * all subscribe / upgrade CTAs when the app is running on iOS native and
 * direct users to manage their subscription on the web instead.
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => "ios" | "android" | "web";
};

function getCap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNativePlatform(): boolean {
  return !!getCap()?.isNativePlatform?.();
}

export function getPlatform(): "ios" | "android" | "web" {
  return getCap()?.getPlatform?.() ?? "web";
}

export function isIosNative(): boolean {
  return isNativePlatform() && getPlatform() === "ios";
}

export function isAndroidNative(): boolean {
  return isNativePlatform() && getPlatform() === "android";
}

/**
 * Where to point users when subscription management is hidden in-app
 * (iOS web-only subscription model). Always opens the public website.
 */
export const WEB_SUBSCRIPTION_URL = "https://opulencetalentcollective.com/membership";
