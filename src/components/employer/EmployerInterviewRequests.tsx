import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarCheck, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Row = {
  id: string;
  candidate_user_id: string;
  status: string;
  note: string | null;
  created_at: string;
  candidate_name: string;
};

const EmployerInterviewRequests = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("interview_requests")
      .select("*")
      .eq("employer_user_id", user.id)
      .order("created_at", { ascending: false });
    if (!data) {
      setRows([]);
      setLoading(false);
      return;
    }
    const enriched = await Promise.all(
      data.map(async (r) => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", r.candidate_user_id)
          .maybeSingle();
        return {
          id: r.id,
          candidate_user_id: r.candidate_user_id,
          status: r.status,
          note: r.note,
          created_at: r.created_at,
          candidate_name: prof ? `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim() || "Candidate" : "Candidate",
        };
      })
    );
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const withdraw = async (id: string) => {
    const { error } = await supabase
      .from("interview_requests")
      .update({ status: "withdrawn" })
      .eq("id", id);
    if (error) {
      toast({ title: "Could not withdraw", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request withdrawn" });
      load();
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      declined: { variant: "destructive", label: "Declined" },
      withdrawn: { variant: "secondary", label: "Withdrawn" },
    };
    const c = map[s] ?? { variant: "outline", label: s };
    return <Badge variant={c.variant} className="capitalize">{c.label}</Badge>;
  };

  if (loading) {
    return <Card className="p-12 text-center shadow-card"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></Card>;
  }

  if (rows.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <CalendarCheck size={40} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="font-heading text-2xl mb-2">No interview requests yet</h3>
        <p className="text-muted-foreground font-body text-sm">
          Send a request from a talent's profile to start the conversation.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="font-heading text-lg">{r.candidate_name}</p>
                {statusBadge(r.status)}
              </div>
              <p className="text-xs text-muted-foreground font-body mb-2">
                Sent {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </p>
              {r.note && <p className="font-body text-sm text-muted-foreground">{r.note}</p>}
            </div>
            {r.status === "pending" && (
              <Button size="sm" variant="ghost" onClick={() => withdraw(r.id)}>
                <X size={14} />
                Withdraw
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EmployerInterviewRequests;
