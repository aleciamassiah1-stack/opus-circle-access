import { ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WEB_SUBSCRIPTION_URL } from "@/lib/platform";

/**
 * Notice shown in place of any "Subscribe / Upgrade / Start Membership"
 * CTA when the app is running on iOS native. Apple requires digital
 * subscriptions to use In-App Purchase, so we direct users to the web.
 */
const IosWebSubscriptionNotice = ({
  title = "Manage your membership on the web",
  body = "To keep things simple, OTC memberships are managed on our website. Sign in there to start, pause, or cancel your subscription — your account stays the same.",
  className,
}: {
  title?: string;
  body?: string;
  className?: string;
}) => {
  const open = () => {
    // Open in the system browser (Safari) — never embed an iframe of the
    // billing page inside the iOS app, that would re-trigger the IAP rule.
    window.open(WEB_SUBSCRIPTION_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={
        "rounded-lg border border-gold/20 bg-gradient-to-br from-background to-secondary/30 p-6 text-center " +
        (className ?? "")
      }
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
        <Globe size={20} className="text-gold" />
      </div>
      <h3 className="font-heading text-xl text-foreground mb-2">{title}</h3>
      <p className="font-body text-sm text-muted-foreground max-w-sm mx-auto mb-5">{body}</p>
      <Button variant="gold" size="sm" onClick={open}>
        <ExternalLink size={14} className="mr-2" />
        Open in browser
      </Button>
    </div>
  );
};

export default IosWebSubscriptionNotice;
