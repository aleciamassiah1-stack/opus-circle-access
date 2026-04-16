import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Clock, XCircle, Eye, EyeOff, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const StatusPanel = () => {
  const { profile } = useAuth();
  if (!profile) return null;

  const completion = profile.profile_completion ?? 0;

  const approvalConfig = {
    approved: { icon: CheckCircle2, label: "Approved", color: "text-green-700 bg-green-50 border-green-200" },
    pending: { icon: Clock, label: "Pending Review", color: "text-amber-700 bg-amber-50 border-amber-200" },
    rejected: { icon: XCircle, label: "Not Approved", color: "text-destructive bg-red-50 border-red-200" },
  }[profile.approval_status];

  const ApprovalIcon = approvalConfig.icon;
  const isVisible = profile.visibility_status === "visible" && profile.subscription_active && profile.approval_status === "approved";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
      <Card className="p-5 shadow-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
              Approval Status
            </p>
            <Badge variant="outline" className={`${approvalConfig.color} border font-body font-medium`}>
              <ApprovalIcon size={12} className="mr-1" />
              {approvalConfig.label}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {profile.approval_status === "pending" && "Your profile is being reviewed by our team."}
          {profile.approval_status === "approved" && "You've been vetted and approved."}
          {profile.approval_status === "rejected" && "Please contact support for details."}
        </p>
      </Card>

      <Card className="p-5 shadow-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
              Subscription
            </p>
            <Badge
              variant="outline"
              className={`font-body font-medium border ${
                profile.subscription_active
                  ? "text-green-700 bg-green-50 border-green-200"
                  : "text-muted-foreground bg-muted border-border"
              }`}
            >
              <CreditCard size={12} className="mr-1" />
              {profile.subscription_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        {!profile.subscription_active && (
          <Button variant="gold" size="sm" className="w-full mt-2" asChild>
            <Link to="/membership">Activate Membership</Link>
          </Button>
        )}
        {profile.subscription_active && (
          <p className="text-xs text-muted-foreground font-body">$14.99/month · Renews automatically</p>
        )}
      </Card>

      <Card className="p-5 shadow-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
              Directory Visibility
            </p>
            <Badge
              variant="outline"
              className={`font-body font-medium border ${
                isVisible
                  ? "text-green-700 bg-green-50 border-green-200"
                  : "text-muted-foreground bg-muted border-border"
              }`}
            >
              {isVisible ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
              {isVisible ? "Live" : "Hidden"}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-body">
            <span className="text-muted-foreground">Profile Completion</span>
            <span className="text-foreground font-medium">{completion}%</span>
          </div>
          <Progress value={completion} className="h-1.5" />
        </div>
      </Card>
    </div>
  );
};

export default StatusPanel;
