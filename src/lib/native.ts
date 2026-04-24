/**
 * Native platform initialization for Capacitor (iOS/Android).
 * Safely no-ops on web — all imports are dynamic so web bundles stay lean.
 */
export async function initNativePlatform() {
  // Capacitor injects this global; if absent, we're on web.
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return;

  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);

    // Match the OTC charcoal brand on the status bar.
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    // Android-only; harmless on iOS.
    await StatusBar.setBackgroundColor({ color: "#26221E" }).catch(() => {});

    // Hide splash once React has hydrated.
    await SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});
  } catch {
    // Plugins may not be installed in a given build; ignore.
  }
}
