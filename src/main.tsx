import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativePlatform } from "./lib/native";

createRoot(document.getElementById("root")!).render(<App />);

// Native (iOS/Android) bootstrap — no-op on web.
initNativePlatform();
