import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { isIosNative } from "@/lib/platform";
import IosWebSubscriptionNotice from "@/components/IosWebSubscriptionNotice";

const Paywall = () => {
  if (isIosNative()) {
    return (
      <Card className="p-8 shadow-card border-gold/20 bg-gradient-to-br from-background to-secondary/20">
        <IosWebSubscriptionNotice
          title="Activate your employer membership on the web"
          body="To keep pricing fair across platforms, OTC memberships are handled on our website. Sign in there to start your $49.99/mo employer access, then return to the app to browse vetted talent."
        />
      </Card>
    );
  }

  return (
    <Card className="p-12 text-center shadow-card border-gold/20 bg-gradient-to-br from-background to-secondary/20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
        <Lock className="text-gold" size={28} />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">Subscription Required</p>
      <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-3">Unlock the Talent Collective</h2>
      <p className="font-body text-muted-foreground max-w-md mx-auto mb-6">
        An active employer membership grants access to vetted talent profiles, direct messaging, and interview
        coordination.
      </p>
      <Button variant="gold" size="lg" asChild>
        <Link to="/checkout?plan=employer">
          <Sparkles size={16} />
          Activate Membership
        </Link>
      </Button>
      <p className="font-body text-xs text-muted-foreground mt-4">$49.99/mo · cancel anytime</p>
    </Card>
  );
};

export default Paywall;
