import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Heart, MapPin, Briefcase, MessageSquare, CalendarCheck, Loader2, FileText, BadgeCheck, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { sendNotificationEmail } from "@/lib/notifications";
import PdfPreview from "@/components/admin/PdfPreview";

type Candidate = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  years_experience: number | null;
  availability_status: string | null;
  verified?: boolean | null;
  job_titles: string[];
  tags: string[];
};

type Props = {
  candidate: Candidate;
  open: boolean;
  onClose: () => void;
  onMessage: (userId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const renderMarkdown = (text: string) => {
  // Simple markdown rendering for headings + bullets
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      return <h3 key={i} className="font-heading text-base text-foreground mt-4 mb-2 first:mt-0">{trimmed.slice(3)}</h3>;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return <li key={i} className="font-body text-sm text-foreground ml-5 list-disc">{trimmed.slice(2)}</li>;
    }
    if (!trimmed) return <div key={i} className="h-2" />;
    return <p key={i} className="font-body text-sm text-foreground mb-2">{trimmed}</p>;
  });
};

const CandidateProfileDialog = ({ candidate, open, onClose, onMessage, isFavorite, onToggleFavorite }: Props) => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [interviewNote, setInterviewNote] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [resumeSummary, setResumeSummary] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<"none" | "pending" | "approved" | "denied">("none");
  const [loadingResume, setLoadingResume] = useState(true);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [openingResume, setOpeningResume] = useState(false);

  const initials = `${candidate.first_name?.[0] ?? ""}${candidate.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  useEffect(() => {
    if (!open || !user) return;
    const loadResumeData = async () => {
      setLoadingResume(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("resume_url, resume_summary")
        .eq("id", candidate.id)
        .maybeSingle();
      setResumeSummary((prof as any)?.resume_summary ?? null);
      setHasResume(!!prof?.resume_url);
      setResumePath(prof?.resume_url ?? null);

      const { data: req } = await supabase
        .from("resume_access_requests" as any)
        .select("status")
        .eq("employer_user_id", user.id)
        .eq("candidate_profile_id", candidate.id)
        .maybeSingle();
      if (req) setAccessStatus((req as any).status);
      else setAccessStatus("none");
      setLoadingResume(false);
    };
    loadResumeData();
  }, [open, user, candidate.id]);

  const sendInterviewRequest = async () => {
    if (!user) return;
    setSending(true);
    const note = interviewNote.trim();
    const { error } = await supabase.from("interview_requests").insert({
      employer_user_id: user.id,
      candidate_user_id: candidate.user_id,
      note: note || null,
      status: "pending",
    });
    if (error) {
      toast({ title: "Could not send request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Interview request sent" });
      sendNotificationEmail({
        recipientUserId: candidate.user_id,
        kind: "new_interview_request",
        intro: "An employer on Opulence Talent Collective has requested an interview with you.",
        detail: note || undefined,
        ctaPath: "/talent",
      });
      setInterviewNote("");
    }
    setSending(false);
  };

  const viewFullResume = async () => {
    if (!resumePath) return;
    setOpeningResume(true);
    const { data: signed, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resumePath, 60 * 5);
    setOpeningResume(false);
    if (error || !signed?.signedUrl) {
      toast({ title: "Could not access resume", description: error?.message, variant: "destructive" });
      return;
    }
    setResumePreviewUrl(signed.signedUrl);
  };

  const requestResumeAccess = async () => {
    if (!user) return;
    setRequestingAccess(true);
    const note = requestMessage.trim();
    // Auto-grant access. The candidate is notified that their resume was viewed.
    const { error } = await supabase.from("resume_access_requests" as any).insert({
      employer_user_id: user.id,
      candidate_user_id: candidate.user_id,
      candidate_profile_id: candidate.id,
      message: note || null,
      status: "approved",
      responded_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: "Could not access resume", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resume unlocked", description: "The candidate has been notified that you viewed it." });
      sendNotificationEmail({
        recipientUserId: candidate.user_id,
        kind: "new_resume_request",
        intro: "An employer on Opulence Talent Collective viewed your full resume.",
        detail: note ? `Their note: ${note}` : undefined,
        ctaPath: "/talent",
      });
      setAccessStatus("approved");
      setRequestMessage("");
      // Immediately open the resume for the employer.
      await viewFullResume();
    }
    setRequestingAccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Talent Profile</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage src={candidate.avatar_url ?? undefined} />
            <AvatarFallback className="bg-secondary font-body">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-heading text-2xl flex items-center gap-2">
              {candidate.first_name} {candidate.last_name}
              {candidate.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-body text-gold border border-gold/30 bg-gold/10 px-2 py-0.5 rounded-full">
                  <BadgeCheck size={12} />
                  Verified
                </span>
              )}
            </h2>
            <p className="font-body text-muted-foreground">{candidate.title ?? candidate.headline}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground font-body">
              {candidate.location && <span className="flex items-center gap-1"><MapPin size={12} />{candidate.location}</span>}
              {candidate.years_experience != null && (
                <span className="flex items-center gap-1"><Briefcase size={12} />{candidate.years_experience} years experience</span>
              )}
              {candidate.availability_status && (
                <Badge variant="outline" className="capitalize text-[10px]">
                  {candidate.availability_status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-full ${isFavorite ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {candidate.bio && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">About</p>
            <p className="font-body text-sm text-foreground whitespace-pre-wrap">{candidate.bio}</p>
          </div>
        )}

        {candidate.job_titles.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.job_titles.map((t) => (
                <Badge key={t} variant="secondary" className="font-body">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {candidate.tags.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">Specialties</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.tags.map((t) => (
                <Badge key={t} variant="outline" className="font-body">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Resume section */}
        <div className="border border-gold/30 bg-gold/5 rounded-md p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-gold" />
            <p className="text-xs uppercase tracking-wider text-foreground font-body font-semibold">
              AI-Anonymized Resume Summary
            </p>
          </div>
          {loadingResume ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : !hasResume ? (
            <p className="font-body text-sm text-muted-foreground italic">This talent hasn't uploaded a resume yet.</p>
          ) : !resumeSummary ? (
            <p className="font-body text-sm text-muted-foreground italic">
              Summary is being generated. Check back shortly.
            </p>
          ) : (
            <div className="space-y-1">{renderMarkdown(resumeSummary)}</div>
          )}

          {hasResume && (
            <div className="mt-4 pt-4 border-t border-gold/20">
              {isAdmin || accessStatus === "approved" ? (
                <div className="space-y-2">
                  <Button variant="gold" size="sm" onClick={viewFullResume} disabled={openingResume}>
                    {openingResume ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    View Full Resume
                    {isAdmin && <span className="ml-2 text-[10px] uppercase tracking-wider opacity-70">Admin</span>}
                  </Button>
                  {!isAdmin && accessStatus === "approved" && (
                    <p className="text-[11px] font-body text-muted-foreground italic">
                      The talent is notified each time you view their full resume.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs font-body text-muted-foreground mb-2 flex items-center gap-1">
                    <Lock size={12} />
                    Unlock the full resume — the talent will be notified that you viewed it.
                  </p>
                  <Textarea
                    placeholder="Optional note to the talent (visible to them)..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="mb-2"
                  />
                  <Button variant="gold" size="sm" onClick={requestResumeAccess} disabled={requestingAccess}>
                    {requestingAccess ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Unlock Full Resume
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onMessage(candidate.user_id)}>
              <MessageSquare size={14} />
              Message
            </Button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">
              Send Interview Request
            </p>
            <Textarea
              placeholder="Optional note to introduce yourself or share scheduling details..."
              value={interviewNote}
              onChange={(e) => setInterviewNote(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <Button variant="gold" className="mt-2" onClick={sendInterviewRequest} disabled={sending}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>

      <Dialog open={!!resumePreviewUrl} onOpenChange={(v) => !v && setResumePreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {candidate.first_name} {candidate.last_name} — Resume
            </DialogTitle>
          </DialogHeader>
          {resumePreviewUrl && <PdfPreview url={resumePreviewUrl} />}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default CandidateProfileDialog;
