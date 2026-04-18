import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileEditor from "@/components/candidate/ProfileEditor";
import VerificationPanel from "@/components/candidate/VerificationPanel";
import EmployerProfileEditor from "@/components/employer/EmployerProfileEditor";
import BillingPanel from "@/components/BillingPanel";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Profile = () => {
  const { user, loading, hasRole, profile } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-20 text-center font-body text-muted-foreground">
          Loading...
        </div>
      </PageLayout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isCandidate = hasRole("candidate");
  const isEmployer = hasRole("employer");
  const plan: "candidate" | "employer" = isEmployer ? "employer" : "candidate";

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-10 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">
            Account
          </p>
          <h1 className="text-5xl md:text-6xl font-heading text-foreground mb-2">
            My Profile
          </h1>
          <p className="text-muted-foreground font-body">
            {profile?.first_name ? `Hi ${profile.first_name}, ` : ""}manage your profile, verification, and subscription.
          </p>
        </div>

        {isCandidate && (
          <Tabs defaultValue="profile">
            <TabsList className="bg-card border border-border h-auto p-1 mb-6">
              <TabsTrigger value="profile" className="font-body data-[state=active]:bg-background">
                Profile
              </TabsTrigger>
              <TabsTrigger value="verification" className="font-body data-[state=active]:bg-background">
                Verification
              </TabsTrigger>
              <TabsTrigger value="billing" className="font-body data-[state=active]:bg-background">
                Subscription
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <ProfileEditor />
            </TabsContent>
            <TabsContent value="verification">
              <VerificationPanel />
            </TabsContent>
            <TabsContent value="billing">
              <BillingPanel plan="candidate" />
            </TabsContent>
          </Tabs>
        )}

        {isEmployer && !isCandidate && (
          <Tabs defaultValue="profile">
            <TabsList className="bg-card border border-border h-auto p-1 mb-6">
              <TabsTrigger value="profile" className="font-body data-[state=active]:bg-background">
                Company Profile
              </TabsTrigger>
              <TabsTrigger value="billing" className="font-body data-[state=active]:bg-background">
                Subscription
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <EmployerProfileEditor />
            </TabsContent>
            <TabsContent value="billing">
              <BillingPanel plan="employer" />
            </TabsContent>
          </Tabs>
        )}

        {!isCandidate && !isEmployer && (
          <div className="bg-card border border-border rounded-lg p-8 text-center font-body text-muted-foreground">
            No profile settings available for your account.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Profile;
