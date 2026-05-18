import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativePlatform } from "./lib/native";
import AppErrorBoundary from "./components/AppErrorBoundary";

// Last-resort safety net: if anything throws synchronously during render
// (missing env var, broken module, etc.) we surface a visible fallback
// instead of leaving the iOS WebView blank — which is what got the app
// rejected by App Review (Guideline 2.1(a)).
createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);

// Native (iOS/Android) bootstrap — no-op on web. Wrapped so a failure
// inside a native plugin can't prevent the React tree from mounting.
initNativePlatform().catch((err) => {
  console.warn("[main] initNativePlatform failed:", err);
});

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
