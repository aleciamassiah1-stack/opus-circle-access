import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMetrics from "@/components/admin/AdminMetrics";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import UserManagementTable from "@/components/admin/UserManagementTable";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, Clock, Eye, CreditCard, MessageSquare, Briefcase, Building2 } from "lucide-react";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    totalEmployers: 0,
    pendingApprovals: 0,
    visibleCandidates: 0,
    activeCandidateSubs: 0,
    activeEmployerSubs: 0,
    totalConversations: 0,
    totalInterviews: 0,
  });

  const loadMetrics = useCallback(async () => {
    const [
      candidatesRoles,
      employersRoles,
      pending,
      visible,
      activeCandSubs,
      activeEmpSubs,
      convos,
      interviews,
    ] = await Promise.all([
      supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "employer"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "approved")
        .eq("subscription_active", true)
        .eq("visibility_status", "visible"),
      // Active candidate subs: profile.subscription_active true AND role candidate (approximated via join)
      supabase.from("profiles").select("id, user_id", { count: "exact", head: true }).eq("subscription_active", true),
      // We split below
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("interview_requests").select("id", { count: "exact", head: true }),
    ]);

    // Refine active subscription split by role
    const { data: activeSubs } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("subscription_active", true);
    const activeIds = (activeSubs ?? []).map((p) => p.user_id);
    let activeCand = 0;
    let activeEmp = 0;
    if (activeIds.length) {
      const { data: rolesRows } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", activeIds);
      activeCand = (rolesRows ?? []).filter((r) => r.role === "candidate").length;
      activeEmp = (rolesRows ?? []).filter((r) => r.role === "employer").length;
    }

    setMetrics({
      totalCandidates: candidatesRoles.count ?? 0,
      totalEmployers: employersRoles.count ?? 0,
      pendingApprovals: pending.count ?? 0,
      visibleCandidates: visible.count ?? 0,
      activeCandidateSubs: activeCand,
      activeEmployerSubs: activeEmp,
      totalConversations: convos.count ?? 0,
      totalInterviews: interviews.count ?? 0,
    });
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3 font-body">Admin Dashboard</p>
          <h1 className="text-5xl md:text-6xl font-heading text-foreground mb-2">Platform Overview</h1>
          <p className="text-muted-foreground font-body">
            Approve members, monitor activity, and manage the collective.
          </p>
        </div>

        <AdminMetrics
          stats={[
            { label: "Candidates", value: metrics.totalCandidates, icon: Briefcase, color: "text-foreground" },
            { label: "Employers", value: metrics.totalEmployers, icon: Building2, color: "text-foreground" },
            { label: "Pending Approvals", value: metrics.pendingApprovals, icon: Clock, color: "text-amber-500" },
            { label: "Live Profiles", value: metrics.visibleCandidates, icon: Eye, color: "text-emerald-500" },
            { label: "Candidate Subs", value: metrics.activeCandidateSubs, icon: CreditCard, color: "text-gold" },
            { label: "Employer Subs", value: metrics.activeEmployerSubs, icon: CreditCard, color: "text-gold" },
            { label: "Conversations", value: metrics.totalConversations, icon: MessageSquare, color: "text-foreground" },
            { label: "Interview Requests", value: metrics.totalInterviews, icon: UserCheck, color: "text-foreground" },
          ]}
        />

        <Tabs defaultValue="queue" className="mt-10">
          <TabsList className="bg-card border border-border h-auto p-1 mb-6">
            <TabsTrigger value="queue" className="font-body data-[state=active]:bg-background">
              Approval Queue
              {metrics.pendingApprovals > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {metrics.pendingApprovals}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="font-body data-[state=active]:bg-background">
              All Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <ApprovalQueue onChange={loadMetrics} />
          </TabsContent>
          <TabsContent value="users">
            <UserManagementTable onChange={loadMetrics} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;
