import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Building2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Request = {
  id: string;
  employer_user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  employer_name?: string;
  company_name?: string | null;
  company_logo_url?: string | null;
};

const ResumeAccessRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resume_access_requests" as any)
      .select("*")
      .eq("candidate_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      (data as any[]).map(async (r) => {
        const { data: emp } = await supabase
          .from("profiles")
          .select("first_name, last_name, company_name, company_logo_url")
          .eq("user_id", r.employer_user_id)
          .maybeSingle();
        return {
          ...r,
          employer_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : "Employer",
          company_name: (emp as any)?.company_name ?? null,
          company_logo_url: (emp as any)?.company_logo_url ?? null,
        };
      })
    );
    setRequests(enriched as Request[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

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
        <FileText className="mx-auto text-muted-foreground mb-3" size={28} />
        <p className="font-body text-muted-foreground">No resume views yet.</p>
        <p className="text-xs text-muted-foreground font-body mt-1">
          You'll see a record here whenever a vetted employer views your full resume.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-body text-muted-foreground italic">
        Verified employers on Opulence Talent Collective can unlock your full resume. Each view is logged below.
      </p>
      {requests.map((r) => (
        <Card key={r.id} className="p-5 shadow-card">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={r.company_logo_url ?? undefined} />
              <AvatarFallback className="bg-secondary"><Building2 size={18} /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-heading text-lg text-foreground">
                  {r.company_name || r.employer_name}
                </p>
                {r.company_name && (
                  <span className="text-xs text-muted-foreground font-body">via {r.employer_name}</span>
                )}
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Eye size={10} />
                  Viewed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-1">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </p>
              {r.message && (
                <p className="font-body text-sm text-foreground mt-3 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  "{r.message}"
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ResumeAccessRequests;
