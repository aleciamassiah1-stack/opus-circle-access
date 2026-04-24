import { useCallback, useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusPanel from "@/components/candidate/StatusPanel";
import MessagingInbox from "@/components/candidate/MessagingInbox";
import InterviewRequests from "@/components/candidate/InterviewRequests";
import ResumeAccessRequests from "@/components/candidate/ResumeAccessRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RefreshBusProvider } from "@/contexts/RefreshBus";
import PullToRefresh from "@/components/layout/PullToRefresh";

const TalentDashboard = () => {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingResumeRequests, setPendingResumeRequests] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .eq("candidate_user_id", user.id);
    const ids = convos?.map((c) => c.id) ?? [];
    if (ids.length) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", user.id)
        .is("read_at", null);
      setUnreadCount(count ?? 0);
    } else {
      setUnreadCount(0);
    }
    const { count: rc } = await supabase
      .from("interview_requests")
      .select("*", { count: "exact", head: true })
      .eq("candidate_user_id", user.id)
      .eq("status", "pending");
    setPendingRequests(rc ?? 0);
    const { count: rrc } = await supabase
      .from("resume_access_requests" as any)
      .select("*", { count: "exact", head: true })
      .eq("candidate_user_id", user.id)
      .eq("status", "pending");
    setPendingResumeRequests(rrc ?? 0);
  }, [user]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return (
    <PageLayout>
      <RefreshBusProvider>
        <PullToRefresh onRefresh={loadCounts}>
          <div className="container mx-auto px-6 py-12 max-w-6xl">
            <div className="mb-10 animate-fade-in">
              <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">
                Candidate Dashboard
              </p>
              <h1 className="text-5xl md:text-6xl font-heading text-foreground mb-2">
                Welcome, {profile?.first_name || "Member"}
              </h1>
              <p className="text-muted-foreground font-body">
                Manage your profile, monitor your visibility, and connect with employers.
              </p>
            </div>

            <StatusPanel />

            <Tabs defaultValue="messages" className="mt-10">
              <TabsList className="bg-card border border-border h-auto p-1 mb-6">
                <TabsTrigger value="messages" className="font-body data-[state=active]:bg-background">
                  Messages {unreadCount > 0 && (
                    <span className="ml-2 bg-gold text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="interviews" className="font-body data-[state=active]:bg-background">
                  Interview Requests {pendingRequests > 0 && (
                    <span className="ml-2 bg-gold text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {pendingRequests}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="resume-requests" className="font-body data-[state=active]:bg-background">
                  Resume Requests {pendingResumeRequests > 0 && (
                    <span className="ml-2 bg-gold text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {pendingResumeRequests}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="messages">
                <MessagingInbox />
              </TabsContent>
              <TabsContent value="interviews">
                <InterviewRequests />
              </TabsContent>
              <TabsContent value="resume-requests">
                <ResumeAccessRequests />
              </TabsContent>
            </Tabs>
          </div>
        </PullToRefresh>
      </RefreshBusProvider>
    </PageLayout>
  );
};

export default TalentDashboard;
