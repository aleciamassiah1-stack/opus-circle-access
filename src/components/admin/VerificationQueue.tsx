import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/auditLog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, Eye, ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Doc = {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  file_name: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type ProfileLite = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

const STATUS_VARIANT: Record<Doc["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

type Props = { onChange?: () => void };

const VerificationQueue = ({ onChange }: Props) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [active, setActive] = useState<Doc | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("verification_documents" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Failed to load documents", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as Doc[];
    setDocs(rows);
    const ids = Array.from(new Set(rows.map((d) => d.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p) => { map[p.user_id] = p as ProfileLite; });
      setProfilesById(map);
    } else {
      setProfilesById({});
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const nameFor = (uid: string) => {
    const p = profilesById[uid];
    if (!p) return "Unknown user";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "Unknown user";
  };

  const openDoc = async (d: Doc) => {
    setActive(d);
    setNotes(d.reviewer_notes ?? "");
    setPreviewUrl(null);
    const { data, error } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(d.file_path, 300);
    if (error) {
      toast({ title: "Could not load file", description: error.message, variant: "destructive" });
      return;
    }
    setPreviewUrl(data.signedUrl);
  };

  const review = async (next: "approved" | "rejected") => {
    if (!active) return;
    if (next === "rejected" && !notes.trim()) {
      toast({ title: "Add a reason", description: "Reviewer notes are required when rejecting.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("verification_documents" as never)
      .update({
        status: next,
        reviewer_notes: notes.trim() || null,
        reviewed_by: u.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", active.id);
    if (error) {
      setSaving(false);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    // On rejection, delete the underlying file from storage to protect PII.
    if (next === "rejected") {
      const { error: rmErr } = await supabase.storage
        .from("verification-documents")
        .remove([active.file_path]);
      if (rmErr) console.warn("Storage cleanup failed:", rmErr.message);
    }
    await logAdminAction(
      next === "approved" ? "doc_approve" : "doc_reject",
      active.user_id,
      { document_id: active.id, document_type: active.document_type, notes: notes.trim() || null }
    );
    setSaving(false);
    setActive(null);
    setPreviewUrl(null);
    toast({
      title: next === "approved" ? "Document approved" : "Document rejected",
      description: next === "approved" ? "Candidate is now verified." : "File has been deleted.",
    });
    load();
    onChange?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-body">
            {loading ? "Loading…" : `${docs.length} document${docs.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : docs.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-body">No documents in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className={STATUS_VARIANT[d.status]}>
                      {d.status}
                    </Badge>
                    <Badge variant="secondary">Government ID</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-body">
                    <span className="text-muted-foreground">Candidate:</span>{" "}
                    <span className="font-medium">{nameFor(d.user_id)}</span>
                  </p>
                  {d.file_name && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{d.file_name}</p>
                  )}
                  {d.status === "rejected" && d.reviewer_notes && (
                    <p className="text-xs text-destructive mt-2 whitespace-pre-wrap">
                      {d.reviewer_notes}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => openDoc(d)}>
                  <Eye className="w-4 h-4 mr-1" /> Review
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setPreviewUrl(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Review identity document</DialogTitle>
            <DialogDescription>
              {active && nameFor(active.user_id)}
              {active && <> · {formatDistanceToNow(new Date(active.created_at), { addSuffix: true })}</>}
            </DialogDescription>
          </DialogHeader>

          {active && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/40 overflow-hidden">
                {!previewUrl ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : /\.(pdf)$/i.test(active.file_path) ? (
                  <div className="space-y-2">
                    <iframe
                      src={previewUrl}
                      title="Identity document"
                      className="w-full h-[60vh] bg-background"
                    />
                    <div className="px-3 pb-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a href={previewUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Identity document" className="w-full max-h-[60vh] object-contain bg-background" />
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Reviewer notes {active.status === "pending" && "(required if rejecting)"}
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional for approval — required for rejection."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => review("rejected")} disabled={saving || active?.status !== "pending"}>
              <XCircle className="w-4 h-4 mr-1" /> Reject & delete
            </Button>
            <Button onClick={() => review("approved")} disabled={saving || active?.status !== "pending"}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Approve & verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationQueue;
