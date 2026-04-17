import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Heart, MapPin, Briefcase, MessageSquare, CalendarCheck, Loader2, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

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

const CandidateProfileDialog = ({ candidate, open, onClose, onMessage, isFavorite, onToggleFavorite }: Props) => {
  const { user } = useAuth();
  const [interviewNote, setInterviewNote] = useState("");
  const [sending, setSending] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const initials = `${candidate.first_name?.[0] ?? ""}${candidate.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const sendInterviewRequest = async () => {
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("interview_requests").insert({
      employer_user_id: user.id,
      candidate_user_id: candidate.user_id,
      note: interviewNote.trim() || null,
      status: "pending",
    });
    if (error) {
      toast({ title: "Could not send request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Interview request sent" });
      setInterviewNote("");
    }
    setSending(false);
  };

  const fetchResume = async () => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("resume_url")
      .eq("id", candidate.id)
      .maybeSingle();
    if (!prof?.resume_url) {
      toast({ title: "No resume uploaded" });
      return;
    }
    const { data: signed } = await supabase.storage
      .from("resumes")
      .createSignedUrl(prof.resume_url, 60 * 5);
    if (signed?.signedUrl) {
      setResumeUrl(signed.signedUrl);
      window.open(signed.signedUrl, "_blank");
    } else {
      toast({ title: "Could not access resume", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Candidate Profile</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage src={candidate.avatar_url ?? undefined} />
            <AvatarFallback className="bg-secondary font-body">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-heading text-2xl">
              {candidate.first_name} {candidate.last_name}
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

        <div className="border-t border-border pt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onMessage(candidate.user_id)}>
              <MessageSquare size={14} />
              Message
            </Button>
            <Button variant="outline" onClick={fetchResume}>
              <FileText size={14} />
              View Resume
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
    </Dialog>
  );
};

export default CandidateProfileDialog;
