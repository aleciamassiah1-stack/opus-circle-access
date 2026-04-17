import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  plan: "candidate" | "employer";
}

const BillingPanel = ({ plan }: Props) => {
  const { subscription, isActive, loading } = useSubscription();
  const [opening, setOpening] = useState(false);

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.href,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open billing portal");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Could not open billing portal");
    } finally {
      setOpening(false);
    }
  };

  const planLabel = plan === "candidate" ? "Talent Membership" : "Employer Membership";
  const planPrice = plan === "candidate" ? "$14.99" : "$49.99";

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <CreditCard size={18} className="text-gold" />
          </div>
          <div>
            <h3 className="font-heading text-xl text-foreground">{planLabel}</h3>
            <p className="text-xs text-muted-foreground font-body">{planPrice}/month</p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={16} />
        ) : isActive ? (
          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 border-emerald-500/20">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-700 border-amber-500/40">
            Inactive
          </Badge>
        )}
      </div>

      {subscription?.current_period_end && (
        <p className="text-sm text-muted-foreground font-body mb-4">
          {subscription.cancel_at_period_end ? "Cancels on " : "Renews on "}
          {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
        </p>
      )}

      {!isActive && (
        <p className="text-sm text-muted-foreground font-body mb-4">
          {plan === "candidate"
            ? "Your profile becomes visible in the directory once your subscription is active and admin-approved."
            : "Activate your subscription to unlock the talent directory and messaging."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {isActive ? (
          <Button variant="outline" size="sm" onClick={openPortal} disabled={opening}>
            {opening ? <Loader2 size={14} className="animate-spin mr-2" /> : <ExternalLink size={14} className="mr-2" />}
            Manage Billing
          </Button>
        ) : (
          <Button variant="gold" size="sm" asChild>
            <Link to={`/checkout?plan=${plan}`}>Start Membership</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default BillingPanel;
