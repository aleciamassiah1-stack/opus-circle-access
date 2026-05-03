import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share, Plus, MoreVertical } from "lucide-react";
import { isNativePlatform } from "@/lib/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "otc-install-prompt-dismissed";
const DELAY_MS = 1500;

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

type Browser = "ios-safari" | "android-chrome" | "desktop-chrome" | "desktop-safari" | "firefox" | "other";

const detectBrowser = (): Browser => {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isChrome = /Chrome|CriOS/.test(ua) && !isEdge;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);

  if (isIOS) return "ios-safari";
  if (isAndroid && isChrome) return "android-chrome";
  if (isFirefox) return "firefox";
  if (isSafari) return "desktop-safari";
  if (isChrome || isEdge) return "desktop-chrome";
  return "other";
};

const InstallPWAPrompt = () => {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [browser, setBrowser] = useState<Browser>("other");

  useEffect(() => {
    if (isNativePlatform()) return;
    if (isStandalone()) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;

    setBrowser(detectBrowser());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const t = window.setTimeout(() => setOpen(true), DELAY_MS);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      setDeferredPrompt(null);
      dismiss();
    }
  };

  const renderInstructions = () => {
    switch (browser) {
      case "ios-safari":
        return (
          <ol className="space-y-3 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">
                Tap the <Share className="inline mx-1" size={16} /> Share button in Safari.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">2.</span>
              <span className="flex-1">
                Choose <span className="font-semibold">Add to Home Screen <Plus className="inline ml-1" size={14} /></span>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">3.</span>
              <span className="flex-1">Tap <span className="font-semibold">Add</span>.</span>
            </li>
          </ol>
        );
      case "android-chrome":
        return (
          <ol className="space-y-3 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">
                Tap the <MoreVertical className="inline mx-1" size={16} /> menu in Chrome.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">2.</span>
              <span className="flex-1">Choose <span className="font-semibold">Install app</span> or <span className="font-semibold">Add to Home screen</span>.</span>
            </li>
          </ol>
        );
      case "desktop-chrome":
        return (
          <ol className="space-y-3 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">Click the install icon in the address bar (right side).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">2.</span>
              <span className="flex-1">Or open the <MoreVertical className="inline mx-1" size={16} /> menu and choose <span className="font-semibold">Install Opulence Talent Collective…</span></span>
            </li>
          </ol>
        );
      case "desktop-safari":
        return (
          <ol className="space-y-3 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">In Safari's menu bar, choose <span className="font-semibold">File → Add to Dock</span>.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">2.</span>
              <span className="flex-1">Confirm to add OTC to your Dock.</span>
            </li>
          </ol>
        );
      case "firefox":
        return (
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Firefox doesn't support installing this site as an app. Open OTC in Chrome, Edge, or Safari.
          </p>
        );
      default:
        return (
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Open this page in Chrome, Edge, or Safari, then look for "Install app" or "Add to Home Screen" in the browser menu.
          </p>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Install Opulence Talent Collective
          </DialogTitle>
          <DialogDescription className="font-body">
            Add OTC to your home screen for a full-screen, app-like experience.
          </DialogDescription>
        </DialogHeader>
        {renderInstructions()}
        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={dismiss}>
            Not now
          </Button>
          {deferredPrompt && (
            <Button variant="gold" onClick={handleInstall}>
              <Download size={16} />
              Install
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPWAPrompt;
