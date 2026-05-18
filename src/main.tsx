import { createRoot } from "react-dom/client";
import "./index.css";

// Inline fallback that renders directly to the DOM without React, so even
// if the App module itself fails to import (e.g. a module-level throw inside
// a dependency), the iOS WebView is never blank on launch.
function renderInlineFallback(message: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;background:#26221E;color:#F5EFE6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
      <h1 style="font-size:22px;margin:0 0 12px;letter-spacing:0.02em;">Opulence Talent Collective</h1>
      <p style="max-width:32ch;margin:0 0 24px;opacity:0.8;line-height:1.5;">${message}</p>
      <button id="otc-reload" type="button" style="padding:12px 24px;border-radius:999px;border:1px solid #C9A961;background:#C9A961;color:#26221E;font-weight:600;cursor:pointer;">Reload</button>
    </div>`;
  document.getElementById("otc-reload")?.addEventListener("click", () => {
    window.location.assign("/");
  });
}

// Global handlers so unhandled errors surface in Xcode logs during
// review instead of silently leaving a blank screen.
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    console.error("[window.error]", e.message, e.error);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[unhandledrejection]", e.reason);
  });
}

// Dynamic imports so a module-load error (e.g. supabase client constructed
// with undefined env vars) becomes a catchable promise rejection instead of
// taking down the entire bundle and leaving a blank WebView.
(async () => {
  try {
    const [{ default: App }, { default: AppErrorBoundary }] = await Promise.all([
      import("./App.tsx"),
      import("./components/AppErrorBoundary"),
    ]);

    createRoot(document.getElementById("root")!).render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // Native bootstrap — no-op on web. Failure inside a native plugin must
    // never prevent the React tree from mounting.
    try {
      const { initNativePlatform } = await import("./lib/native");
      initNativePlatform().catch((err) => {
        console.warn("[main] initNativePlatform failed:", err);
      });
    } catch (err) {
      console.warn("[main] native bootstrap import failed:", err);
    }
  } catch (err) {
    console.error("[main] Fatal: app failed to load", err);
    renderInlineFallback("We couldn't load the app. Please check your connection and try again.");
  }
})();
