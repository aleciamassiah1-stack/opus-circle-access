import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const EmployerStatusPanel = () => {
  const { profile } = useAuth();
  const active = profile?.subscription_active === true;

  return (
    <Card className="p-6 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${active ? "text-emerald-500" : "text-amber-500"}`}>
            {active ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
              Membership
            </p>
            <div className="flex items-center gap-2">
              <p className="font-heading text-xl">
                {active ? "Active" : "Inactive"}
              </p>
              <Badge variant={active ? "default" : "outline"} className="capitalize">
                {active ? "Subscribed" : "Subscription required"}
              </Badge>
            </div>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {active
                ? "Full access to vetted candidates, messaging, and interview coordination."
                : "Activate your membership to unlock the talent directory."}
            </p>
          </div>
        </div>
        <Button variant={active ? "outline" : "gold"} asChild>
          <Link to="/membership">
            <CreditCard size={14} />
            {active ? "Manage Billing" : "Activate Membership"}
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default EmployerStatusPanel;
