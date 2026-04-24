import { useCallback, useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployerStatusPanel from "@/components/employer/EmployerStatusPanel";
import TalentDirectory from "@/components/employer/TalentDirectory";
import EmployerMessaging from "@/components/employer/EmployerMessaging";
import EmployerInterviewRequests from "@/components/employer/EmployerInterviewRequests";
import EmployerFavorites from "@/components/employer/EmployerFavorites";
import Paywall from "@/components/employer/Paywall";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RefreshBusProvider } from "@/contexts/RefreshBus";
import PullToRefresh from "@/components/layout/PullToRefresh";

const EmployerDashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const isPaid = isAdmin || profile?.subscription_active === true;
  const [tab, setTab] = useState("directory");
  const [unread, setUnread] = useState(0);
  const [pendingResponses, setPendingResponses] = useState(0);
  const [pendingMessageTo, setPendingMessageTo] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .eq("employer_user_id", user.id);
    const ids = convos?.map((c) => c.id) ?? [];
    if (ids.length) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", user.id)
        .is("read_at", null);
      setUnread(count ?? 0);
    } else {
      setUnread(0);
    }
    const { count: pc } = await supabase
      .from("interview_requests")
      .select("*", { count: "exact", head: true })
      .eq("employer_user_id", user.id)
      .eq("status", "pending");
    setPendingResponses(pc ?? 0);
  }, [user]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const startMessage = (candidateUserId: string) => {
    if (!isPaid) return;
    setPendingMessageTo(candidateUserId);
    setTab("messages");
  };

  return (
    <PageLayout>
      <RefreshBusProvider>
        <PullToRefresh onRefresh={loadCounts}>
          <div className="container mx-auto px-6 py-12 max-w-6xl">
            <div className="mb-10 animate-fade-in">
              <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">
                Welcome, {profile?.first_name || "Member"}
              </p>
              <h1 className="text-5xl md:text-6xl font-heading text-foreground mb-2">
                Talent Directory
              </h1>
              <p className="text-muted-foreground font-body">
                Discover vetted talent and coordinate interviews privately.
              </p>
            </div>

            <EmployerStatusPanel />

            <Tabs value={tab} onValueChange={setTab} className="mt-10">
              <TabsList className="bg-card border border-border h-auto p-1 mb-6 flex-wrap">
                <TabsTrigger value="directory" className="font-body data-[state=active]:bg-background">
                  Talent Directory
                </TabsTrigger>
                <TabsTrigger value="favorites" className="font-body data-[state=active]:bg-background">
                  Saved
                </TabsTrigger>
                <TabsTrigger value="messages" className="font-body data-[state=active]:bg-background">
                  Messages {unread > 0 && (
                    <span className="ml-2 bg-gold text-primary-foreground text-xs px-2 py-0.5 rounded-full">{unread}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="interviews" className="font-body data-[state=active]:bg-background">
                  Interviews {pendingResponses > 0 && (
                    <span className="ml-2 bg-gold text-primary-foreground text-xs px-2 py-0.5 rounded-full">{pendingResponses}</span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="directory">
                {isPaid ? <TalentDirectory onMessage={startMessage} /> : <Paywall />}
              </TabsContent>
              <TabsContent value="favorites">
                {isPaid ? <EmployerFavorites onMessage={startMessage} /> : <Paywall />}
              </TabsContent>
              <TabsContent value="messages">
                {isPaid ? (
                  <EmployerMessaging
                    initialCandidateUserId={pendingMessageTo}
                    onConsumed={() => setPendingMessageTo(null)}
                  />
                ) : (
                  <Paywall />
                )}
              </TabsContent>
              <TabsContent value="interviews">
                {isPaid ? <EmployerInterviewRequests /> : <Paywall />}
              </TabsContent>
            </Tabs>
          </div>
        </PullToRefresh>
      </RefreshBusProvider>
    </PageLayout>
  );
};

export default EmployerDashboard;
