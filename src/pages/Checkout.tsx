import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { PRICE_IDS } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  const { user, loading, hasRole } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();

  // Auto-detect plan from role if not specified
  const plan: "candidate" | "employer" =
    planParam === "employer" || planParam === "candidate"
      ? planParam
      : hasRole("employer")
        ? "employer"
        : "candidate";

  if (loading || subLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-24 text-center">
          <Loader2 className="mx-auto animate-spin text-gold" size={32} />
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=/checkout?plan=${plan}`} replace />;
  }

  if (isActive) {
    return <Navigate to={hasRole("employer") ? "/employer" : "/dashboard"} replace />;
  }

  const priceId = PRICE_IDS[plan];
  const planLabel = plan === "candidate" ? "Talent Membership" : "Employer Membership";
  const planPrice = plan === "candidate" ? "$14.99" : "$49.99";

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">
            Complete checkout
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2">
            {planLabel}
          </h1>
          <p className="text-muted-foreground font-body">
            {planPrice}/month · Cancel anytime
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-2 md:p-4 shadow-card">
          <StripeEmbeddedCheckout
            priceId={priceId}
            userId={user.id}
            customerEmail={user.email ?? undefined}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default Checkout;
