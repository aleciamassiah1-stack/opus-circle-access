import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, Loader2, Clock, MapPin, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Pending = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  title: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  years_experience: number | null;
  profile_completion: number | null;
  subscription_active: boolean;
  created_at: string;
};

const ApprovalQueue = ({ onChange }: { onChange?: () => void }) => {
  const [rows, setRows] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, first_name, last_name, email, title, location, bio, avatar_url, resume_url, years_experience, profile_completion, subscription_active, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Failed to load queue", description: error.message, variant: "destructive" });
    }
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (userId: string, status: "approved" | "rejected") => {
    setBusy(userId);
    const update: any = { approval_status: status };
    if (status === "approved") update.visibility_status = "visible";
    const { error } = await supabase.from("profiles").update(update).eq("user_id", userId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Candidate ${status}` });
      load();
      onChange?.();
    }
    setBusy(null);
  };

  const viewResume = async (resumePath: string | null) => {
    if (!resumePath) {
      toast({ title: "No resume uploaded" });
      return;
    }
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(resumePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast({ title: "Could not access resume", variant: "destructive" });
    } else {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (loading) {
    return <Card className="p-12 text-center shadow-card"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></Card>;
  }

  if (rows.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <CheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
        <h3 className="font-heading text-2xl mb-2">All caught up</h3>
        <p className="text-muted-foreground font-body text-sm">No candidates pending approval.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const initials = `${r.first_name?.[0] ?? ""}${r.last_name?.[0] ?? ""}`.toUpperCase() || "?";
        return (
          <Card key={r.id} className="p-5 shadow-card">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={r.avatar_url ?? undefined} />
                <AvatarFallback className="bg-secondary text-sm">{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-heading text-lg">{r.first_name} {r.last_name}</p>
                  <Badge variant="outline" className="text-[10px]"><Clock size={10} className="mr-1" />Pending</Badge>
                  <Badge variant={r.subscription_active ? "default" : "outline"} className="text-[10px]">
                    {r.subscription_active ? "Subscription active" : "Not subscribed"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Profile {r.profile_completion ?? 0}%
                  </Badge>
                  <Badge variant={r.resume_url ? "default" : "outline"} className="text-[10px]">
                    {r.resume_url ? "Resume on file" : "No resume"}
                  </Badge>
                </div>
                <p className="font-body text-sm text-muted-foreground mb-2">{r.email}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-body mb-2">
                  {r.title && <span className="flex items-center gap-1"><Briefcase size={12} />{r.title}</span>}
                  {r.location && <span className="flex items-center gap-1"><MapPin size={12} />{r.location}</span>}
                  {r.years_experience != null && <span>{r.years_experience} yrs</span>}
                  <span>Applied {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                </div>
                {r.bio && (
                  <p className="font-body text-sm text-muted-foreground line-clamp-3">{r.bio}</p>
                )}
              </div>

              <div className="flex md:flex-col gap-2 md:w-40">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewResume(r.resume_url)}
                  disabled={!r.resume_url}
                  className="flex-1"
                >
                  <FileText size={14} />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => decide(r.user_id, "approved")}
                  disabled={busy === r.user_id}
                  className="flex-1"
                >
                  <CheckCircle size={14} />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide(r.user_id, "rejected")}
                  disabled={busy === r.user_id}
                  className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/5"
                >
                  <XCircle size={14} />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ApprovalQueue;
