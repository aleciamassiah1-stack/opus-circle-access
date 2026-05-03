import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share, Plus } from "lucide-react";
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
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

const isIosSafari = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
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
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [iosCapable, setIosCapable] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (isIosSafari()) setIosCapable(true);

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

  // Hide entirely inside the native Capacitor shell or once installed.
  if (isNativePlatform() || installed) return null;
  // Nothing to install — no Android prompt available and not iOS Safari.
  if (!deferredPrompt && !iosCapable) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      setDeferredPrompt(null);
      return;
    }
    if (iosCapable) setShowIosSheet(true);
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={handleClick}>
        <Download size={16} />
        {label}
      </Button>

      <Dialog open={showIosSheet} onOpenChange={setShowIosSheet}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Install Opulence Talent Collective
            </DialogTitle>
            <DialogDescription className="font-body">
              Add OTC to your Home Screen for a full-screen, app-like experience.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-4 mt-2 font-body text-sm text-foreground">
            <li className="flex gap-3">
              <span className="font-heading text-gold">1.</span>
              <span className="flex-1">
                Tap the <Share className="inline mx-1" size={16} /> Share button
                in Safari's toolbar.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">2.</span>
              <span className="flex-1">
                Scroll and choose{" "}
                <span className="font-semibold">
                  Add to Home Screen <Plus className="inline ml-1" size={14} />
                </span>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-heading text-gold">3.</span>
              <span className="flex-1">
                Tap <span className="font-semibold">Add</span> in the top-right
                corner.
              </span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPWAButton;
