import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, Check, X, Loader2, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Request = {
  id: string;
  employer_user_id: string;
  status: string;
  note: string | null;
  created_at: string;
  employer_name?: string;
  company_name?: string | null;
  company_logo_url?: string | null;
};

const statusColor: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  accepted: "text-green-700 bg-green-50 border-green-200",
  declined: "text-destructive bg-red-50 border-red-200",
  withdrawn: "text-muted-foreground bg-muted border-border",
};

const InterviewRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("interview_requests")
      .select("*")
      .eq("candidate_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }
    const enriched = await Promise.all(
      data.map(async (r) => {
        const { data: emp } = await supabase
          .from("profiles")
          .select("first_name, last_name, company_name, company_logo_url")
          .eq("user_id", r.employer_user_id)
          .maybeSingle();
        return {
          ...r,
          employer_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || "Employer" : "Employer",
          company_name: (emp as any)?.company_name ?? null,
          company_logo_url: (emp as any)?.company_logo_url ?? null,
        };
      })
    );
    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const respond = async (id: string, status: "accepted" | "declined") => {
    setActing(id);
    const target = requests.find((r) => r.id === id);
    const { error } = await supabase
      .from("interview_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setActing(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Request ${status}` });
      if (target?.employer_user_id) {
        sendNotificationEmail({
          recipientUserId: target.employer_user_id,
          kind: "interview_response",
          intro:
            status === "accepted"
              ? "A candidate has accepted your interview request."
              : "A candidate has declined your interview request.",
          ctaPath: "/employer",
        });
      }
      load();
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Loader2 className="animate-spin mx-auto text-muted-foreground" />
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <CalendarClock size={40} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="font-heading text-2xl mb-2">No interview requests</h3>
        <p className="text-muted-foreground font-body text-sm">
          When employers request interviews, they'll appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {requests.map((r) => (
        <Card key={r.id} className="p-6 shadow-card">
          <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={r.company_logo_url ?? undefined} />
                <AvatarFallback className="bg-secondary"><Building2 size={18} /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading text-xl text-foreground leading-tight">
                  {r.company_name || r.employer_name}
                </p>
                {r.company_name && (
                  <p className="text-xs text-muted-foreground font-body">from {r.employer_name}</p>
                )}
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`${statusColor[r.status]} font-body capitalize`}>
              {r.status}
            </Badge>
          </div>
          {r.note && (
            <p className="text-sm text-foreground font-body bg-muted/50 p-3 rounded-md mb-4 italic">
              "{r.note}"
            </p>
          )}
          {r.status === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => respond(r.id, "accepted")}
                disabled={acting === r.id}
              >
                <Check size={14} className="mr-1" /> Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => respond(r.id, "declined")}
                disabled={acting === r.id}
              >
                <X size={14} className="mr-1" /> Decline
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default InterviewRequests;
