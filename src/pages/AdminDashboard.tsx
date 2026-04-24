import { useEffect, useState, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMetrics from "@/components/admin/AdminMetrics";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import UserManagementTable from "@/components/admin/UserManagementTable";
import AdminRoleGrant from "@/components/admin/AdminRoleGrant";
import AuditLog from "@/components/admin/AuditLog";
import DeactivatedAccounts from "@/components/admin/DeactivatedAccounts";
import ReportsQueue from "@/components/admin/ReportsQueue";
import VerificationQueue from "@/components/admin/VerificationQueue";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Clock, Eye, CreditCard, MessageSquare, Briefcase, Building2, Flag, ShieldCheck } from "lucide-react";
import { RefreshBusProvider } from "@/contexts/RefreshBus";
import PullToRefresh from "@/components/layout/PullToRefresh";

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
    deactivatedCount: 0,
    openReports: 0,
    pendingDocs: 0,
  });

  const loadMetrics = useCallback(async () => {
    const results = await Promise.all([
      supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "employer"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "pending").is("deactivated_at", null),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "approved")
        .eq("subscription_active", true)
        .eq("visibility_status", "visible")
        .is("deactivated_at", null),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("interview_requests").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).not("deactivated_at", "is", null),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("verification_documents" as never).select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const [candidatesRoles, employersRoles, pending, visible, convos, interviews, deactivated, openReports, pendingDocs] = results;

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
      deactivatedCount: deactivated.count ?? 0,
      openReports: openReports.count ?? 0,
      pendingDocs: pendingDocs.count ?? 0,
    });
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  return (
    <PageLayout>
      <RefreshBusProvider>
        <PullToRefresh onRefresh={loadMetrics}>
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
            { label: "Talent", value: metrics.totalCandidates, icon: Briefcase, color: "text-foreground" },
            { label: "Employers", value: metrics.totalEmployers, icon: Building2, color: "text-foreground" },
            { label: "Pending Approvals", value: metrics.pendingApprovals, icon: Clock, color: "text-amber-500" },
            { label: "Live Profiles", value: metrics.visibleCandidates, icon: Eye, color: "text-emerald-500" },
            { label: "Talent Subs", value: metrics.activeCandidateSubs, icon: CreditCard, color: "text-gold" },
            { label: "Employer Subs", value: metrics.activeEmployerSubs, icon: CreditCard, color: "text-gold" },
            { label: "Conversations", value: metrics.totalConversations, icon: MessageSquare, color: "text-foreground" },
            { label: "Interview Requests", value: metrics.totalInterviews, icon: UserCheck, color: "text-foreground" },
            { label: "Open Reports", value: metrics.openReports, icon: Flag, color: metrics.openReports > 0 ? "text-destructive" : "text-foreground" },
            { label: "Pending Documents", value: metrics.pendingDocs, icon: ShieldCheck, color: metrics.pendingDocs > 0 ? "text-amber-500" : "text-foreground" },
          ]}
        />

        <Tabs defaultValue="queue" className="mt-10">
          <TabsList className="bg-card border border-border h-auto p-1 mb-6 flex-wrap">
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
            <TabsTrigger value="deactivated" className="font-body data-[state=active]:bg-background">
              Deactivated
              {metrics.deactivatedCount > 0 && (
                <span className="ml-2 bg-muted text-foreground text-xs px-2 py-0.5 rounded-full">
                  {metrics.deactivatedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="font-body data-[state=active]:bg-background">
              Reports
              {metrics.openReports > 0 && (
                <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {metrics.openReports}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="font-body data-[state=active]:bg-background">
              Verifications
              {metrics.pendingDocs > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {metrics.pendingDocs}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="font-body data-[state=active]:bg-background">
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <ApprovalQueue onChange={loadMetrics} />
          </TabsContent>
          <TabsContent value="users">
            <AdminRoleGrant onGranted={loadMetrics} />
            <UserManagementTable onChange={loadMetrics} />
          </TabsContent>
          <TabsContent value="deactivated">
            <DeactivatedAccounts onChange={loadMetrics} />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsQueue onChange={loadMetrics} />
          </TabsContent>
          <TabsContent value="verifications">
            <VerificationQueue onChange={loadMetrics} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>
        </Tabs>
          </div>
        </PullToRefresh>
      </RefreshBusProvider>
    </PageLayout>
  );
};

export default AdminDashboard;
