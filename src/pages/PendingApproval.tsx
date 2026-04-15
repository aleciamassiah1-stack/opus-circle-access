import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

const PendingApproval = () => {
  const { signOut, profile } = useAuth();

  return (
    <PageLayout>
      <section className="py-24 px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-lg p-10 shadow-card">
            <Clock className="mx-auto mb-4 text-gold" size={48} />
            <h1 className="font-heading text-3xl text-foreground mb-3">Application Under Review</h1>
            <p className="font-body text-sm text-muted-foreground mb-6">
              {profile?.approval_status === "rejected"
                ? "Unfortunately, your application was not approved at this time. Please contact us for more information."
                : "Your account is being reviewed by our team. You'll receive an email once you've been approved."}
            </p>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PendingApproval;
