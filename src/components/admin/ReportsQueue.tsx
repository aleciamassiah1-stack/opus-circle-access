import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/auditLog";
import { Flag, Loader2, Trash2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Report = {
  id: string;
  reporter_user_id: string;
  reported_user_id: string;
  conversation_id: string | null;
  category: string;
  message: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

type ProfileLite = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  harassment: "Harassment",
  spam: "Spam",
  fake_profile: "Fake profile",
  inappropriate_content: "Inappropriate content",
  scam: "Scam",
  other: "Other",
};

const STATUS_VARIANT: Record<Report["status"], string> = {
  open: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  under_review: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

type Props = { onChange?: () => void };

const ReportsQueue = ({ onChange }: Props) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [active, setActive] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter as Report["status"]);
    const { data, error } = await query;
    if (error) {
      toast({ title: "Failed to load reports", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Report[];
    setReports(rows);

    const ids = Array.from(new Set(rows.flatMap((r) => [r.reporter_user_id, r.reported_user_id])));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, company_name")
        .in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p) => {
        map[p.user_id] = p as ProfileLite;
      });
      setProfilesById(map);
    } else {
      setProfilesById({});
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const nameFor = (uid: string) => {
    const p = profilesById[uid];
    if (!p) return "Unknown user";
    const full = [p.first_name, p.last_name].filter(Boolean).join(" ");
    return full || p.company_name || p.email || "Unknown user";
  };

  const openReport = (r: Report) => {
    setActive(r);
    setAdminNotes(r.admin_notes ?? "");
  };

  const updateStatus = async (
    next: Report["status"],
    auditAction: "report_status_change" | "report_resolve" | "report_dismiss"
  ) => {
    if (!active) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const isFinal = next === "resolved" || next === "dismissed";
    const patch = {
      status: next,
      admin_notes: adminNotes.trim() || null,
      resolved_by: isFinal ? u.user?.id ?? null : null,
      resolved_at: isFinal ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("reports").update(patch).eq("id", active.id);
    if (error) {
      setSaving(false);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    await logAdminAction(auditAction, active.reported_user_id, {
      report_id: active.id,
      from_status: active.status,
      to_status: next,
      category: active.category,
    });
    setSaving(false);
    setActive(null);
    toast({ title: "Report updated" });
    load();
    onChange?.();
  };

  const deleteReport = async (r: Report) => {
    if (!confirm("Delete this report permanently?")) return;
    const { error } = await supabase.from("reports").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    await logAdminAction("report_delete", r.reported_user_id, {
      report_id: r.id,
      category: r.category,
    });
    toast({ title: "Report deleted" });
    load();
    onChange?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-body">
            {loading ? "Loading…" : `${reports.length} report${reports.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-body">No reports in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className={STATUS_VARIANT[r.status]}>
                      {r.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="secondary">{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-body mb-1">
                    <span className="text-muted-foreground">Reported:</span>{" "}
                    <span className="font-medium">{nameFor(r.reported_user_id)}</span>
                  </p>
                  <p className="text-sm font-body mb-2">
                    <span className="text-muted-foreground">By:</span>{" "}
                    <span className="font-medium">{nameFor(r.reporter_user_id)}</span>
                  </p>
                  <p className="text-sm text-foreground/80 line-clamp-2">{r.message}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openReport(r)}>
                    <Eye className="w-4 h-4 mr-1" /> Review
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteReport(r)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Review report</DialogTitle>
            <DialogDescription>
              {active && CATEGORY_LABEL[active.category]} ·{" "}
              {active && formatDistanceToNow(new Date(active.created_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reported</p>
                  <p className="font-medium">{nameFor(active.reported_user_id)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reporter</p>
                  <p className="font-medium">{nameFor(active.reporter_user_id)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Message</p>
                <p className="text-sm whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3">
                  {active.message}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Admin notes (internal)
                </p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Outcome, actions taken, communication sent…"
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => updateStatus("under_review", "report_status_change")}
              disabled={saving || active?.status === "under_review"}
            >
              Mark under review
            </Button>
            <Button
              variant="outline"
              onClick={() => updateStatus("dismissed", "report_dismiss")}
              disabled={saving}
            >
              <XCircle className="w-4 h-4 mr-1" /> Dismiss
            </Button>
            <Button onClick={() => updateStatus("resolved", "report_resolve")} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsQueue;
