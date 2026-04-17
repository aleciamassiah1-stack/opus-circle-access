import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { hasRole, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading, refresh } = useSubscription();
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    if (isActive) return;
    const interval = setInterval(() => {
      refresh();
      setWaited((w) => w + 1);
    }, 2000);
    const stop = setTimeout(() => clearInterval(interval), 20000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [isActive, refresh]);

  const dashboardPath = hasRole("employer") ? "/employer" : "/dashboard";
  const loading = authLoading || subLoading;

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-24 max-w-xl text-center">
        {loading || (!isActive && waited < 8) ? (
          <>
            <Loader2 className="mx-auto mb-6 animate-spin text-gold" size={48} />
            <h1 className="font-heading text-4xl mb-3">Confirming your membership…</h1>
            <p className="text-muted-foreground font-body">
              We're syncing your subscription. This usually takes just a moment.
            </p>
          </>
        ) : isActive ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/15 flex items-center justify-center">
              <Check className="text-gold" size={32} />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">
              Membership active
            </p>
            <h1 className="font-heading text-5xl text-foreground mb-4">Welcome to OTC</h1>
            <p className="text-muted-foreground font-body mb-8">
              Your subscription is live. You can now access your dashboard.
            </p>
            <Button variant="gold" size="lg" asChild>
              <Link to={dashboardPath}>Go to Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-4xl mb-3">Almost there</h1>
            <p className="text-muted-foreground font-body mb-8">
              Your payment is being processed. Refresh in a moment, or check your dashboard.
            </p>
            <Button variant="gold" asChild>
              <Link to={dashboardPath}>Go to Dashboard</Link>
            </Button>
          </>
        )}
        {sessionId && (
          <p className="text-xs text-muted-foreground/60 mt-12 font-mono">
            Session: {sessionId.substring(0, 24)}…
          </p>
        )}
      </div>
    </PageLayout>
  );
};

export default CheckoutReturn;
