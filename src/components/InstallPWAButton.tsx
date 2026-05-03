import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share, Plus, MoreVertical } from "lucide-react";
import { isNativePlatform } from "@/lib/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface InstallPWAButtonProps {
  variant?: "gold" | "hero-outline" | "ghost" | "outline";
  size?: "sm" | "lg" | "default";
  className?: string;
  label?: string;
}

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

  if (isIOS && isSafari) return "ios-safari";
  if (isIOS) return "ios-safari"; // iOS only installs via Safari, guide them anyway
  if (isAndroid && isChrome) return "android-chrome";
  if (isFirefox) return "firefox";
  if (isSafari) return "desktop-safari";
  if (isChrome || isEdge) return "desktop-chrome";
  return "other";
};

const InstallPWAButton = ({
  variant = "gold",
  size = "lg",
  className,
  label = "Install OTC",
}: InstallPWAButtonProps) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [browser, setBrowser] = useState<Browser>("other");

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setBrowser(detectBrowser());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isNativePlatform() || installed) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      setDeferredPrompt(null);
      return;
    }
    setShowSheet(true);
  };

  const renderInstructions = () => {
    switch (browser) {
      case "ios-safari":
        return (
          <ol className="space-y-4 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">
                Tap the <Share className="inline mx-1" size={16} /> Share button in Safari's toolbar.
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
          <ol className="space-y-4 mt-2 font-body text-sm text-foreground">
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
          <ol className="space-y-4 mt-2 font-body text-sm text-foreground">
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
          <ol className="space-y-4 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">In Safari's menu bar, choose <span className="font-semibold">File → Add to Dock</span>.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">2.</span>
              <span className="flex-1">Confirm to add OTC to your Dock as an app.</span>
            </li>
          </ol>
        );
      case "firefox":
        return (
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Firefox doesn't support installing this site as an app. Open OTC in Chrome, Edge, or Safari to install it to your home screen or dock.
          </p>
        );
      default:
        return (
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Your browser doesn't expose an install option here. Open this page in Chrome, Edge, or Safari, then look for "Install app" or "Add to Home Screen" in the browser menu.
          </p>
        );
    }
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={handleClick}>
        <Download size={16} />
        {label}
      </Button>

      <Dialog open={showSheet} onOpenChange={setShowSheet}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Install Opulence Talent Collective
            </DialogTitle>
            <DialogDescription className="font-body">
              Add OTC for a full-screen, app-like experience.
            </DialogDescription>
          </DialogHeader>
          {renderInstructions()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPWAButton;
