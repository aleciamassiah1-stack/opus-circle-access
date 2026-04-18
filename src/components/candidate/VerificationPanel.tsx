import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Upload,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Doc = {
  id: string;
  user_id: string;
  document_type: "government_id";
  file_path: string;
  file_name: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const ACCEPT = "image/jpeg,image/png,image/heic,application/pdf";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const STATUS_BADGE: Record<Doc["status"], { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending review", className: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
};

const VerificationPanel = () => {
  const { user, profile } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("verification_documents" as never)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load documents", description: error.message, variant: "destructive" });
    } else {
      setDocs((data ?? []) as unknown as Doc[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const hasPending = docs.some((d) => d.status === "pending");

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Maximum size is 8 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("verification-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setUploading(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }

    const { error: insErr } = await supabase.from("verification_documents" as never).insert({
      user_id: user.id,
      document_type: "government_id",
      file_path: path,
      file_name: file.name,
    } as never);
    if (insErr) {
      await supabase.storage.from("verification-documents").remove([path]);
      setUploading(false);
      toast({ title: "Submission failed", description: insErr.message, variant: "destructive" });
      return;
    }

    setUploading(false);
    toast({ title: "Document submitted", description: "An admin will review it shortly." });
    load();
  };

  const removePending = async (doc: Doc) => {
    if (!confirm("Remove this pending document?")) return;
    await supabase.storage.from("verification-documents").remove([doc.file_path]);
    const { error } = await supabase.from("verification_documents" as never).delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Remove failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Document removed" });
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-xl font-heading text-foreground">Identity verification</h3>
              {profile?.verified && (
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Upload a clear photo of a government-issued ID (passport or driver's license).
              Reviewed privately by our team — never shown to employers.
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || hasPending || profile?.verified}
          className="bg-gold text-primary-foreground hover:bg-gold/90"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {profile?.verified
            ? "Verified — no action needed"
            : hasPending
            ? "Awaiting review"
            : "Upload Government ID"}
        </Button>
        <p className="text-xs text-muted-foreground mt-3 font-body">
          Accepted: JPG, PNG, HEIC, PDF · Max 8 MB
        </p>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : docs.length === 0 ? null : (
        <div className="space-y-3">
          <h4 className="text-sm uppercase tracking-wide text-muted-foreground font-body">
            Submission history
          </h4>
          {docs.map((d) => {
            const cfg = STATUS_BADGE[d.status];
            const Icon = cfg.icon;
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {d.file_name ?? "Government ID"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                        {d.reviewed_at && (
                          <> · reviewed {formatDistanceToNow(new Date(d.reviewed_at), { addSuffix: true })}</>
                        )}
                      </p>
                      {d.status === "rejected" && d.reviewer_notes && (
                        <p className="text-xs text-destructive mt-2 whitespace-pre-wrap">
                          Reason: {d.reviewer_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cfg.className}>
                      <Icon className="w-3 h-3 mr-1" /> {cfg.label}
                    </Badge>
                    {d.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => removePending(d)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerificationPanel;
