import { useEffect, useMemo, useState } from "react";
import { useRefreshToken } from "@/contexts/RefreshBus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, Check, X, Loader2, Building2, Video, CalendarPlus, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { sendNotificationEmail } from "@/lib/notifications";
import { buildIcs, icsDataUrl, googleCalendarUrl, slotsOverlap } from "@/lib/meeting";

type Slot = { start: string; duration_minutes: number };

type Request = {
  id: string;
  employer_user_id: string;
  status: string;
  note: string | null;
  created_at: string;
  proposed_slots: Slot[] | null;
  selected_slot: Slot | null;
  meeting_url: string | null;
  meeting_provider: string | null;
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
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<Record<string, number>>({});
  const [conflictPrompt, setConflictPrompt] = useState<{ request: Request; slot: Slot } | null>(null);

  // All slots already confirmed for this candidate — used to flag double-bookings.
  const confirmedSlots = useMemo<Slot[]>(
    () =>
      requests
        .filter((r) => r.status === "accepted" && r.selected_slot)
        .map((r) => r.selected_slot as Slot),
    [requests],
  );

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
      data.map(async (r: any) => {
        const { data: emp } = await supabase
          .from("profiles")
          .select("first_name, last_name, company_name, company_logo_url")
          .eq("user_id", r.employer_user_id)
          .maybeSingle();
        return {
          ...r,
          proposed_slots: r.proposed_slots ?? null,
          selected_slot: r.selected_slot ?? null,
          meeting_url: r.meeting_url ?? null,
          meeting_provider: r.meeting_provider ?? null,
          employer_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || "Employer" : "Employer",
          company_name: (emp as any)?.company_name ?? null,
          company_logo_url: (emp as any)?.company_logo_url ?? null,
        } as Request;
      })
    );
    setRequests(enriched);
    setLoading(false);
  };

  const refreshToken = useRefreshToken();
  useEffect(() => {
    load();
  }, [user, refreshToken]);

  const accept = async (r: Request) => {
    if (!r.proposed_slots || r.proposed_slots.length === 0) {
      // Legacy request without slots — accept without scheduling.
      return respondLegacy(r.id, "accepted", r.employer_user_id);
    }
    const idx = pickedSlot[r.id];
    if (idx === undefined) {
      toast({ title: "Pick a time slot first", variant: "destructive" });
      return;
    }
    const chosen = r.proposed_slots[idx];

    // Soft warn if this slot overlaps another already-confirmed interview.
    const conflict = confirmedSlots.some((existing) => slotsOverlap(existing, chosen));
    if (conflict) {
      setConflictPrompt({ request: r, slot: chosen });
      return;
    }
    await performAccept(r, chosen);
  };

  const performAccept = async (r: Request, chosen: Slot) => {
    setActing(r.id);
    const { error } = await supabase
      .from("interview_requests")
      .update({
        status: "accepted",
        selected_slot: chosen,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", r.id);
    setActing(null);

    if (error) {
      toast({ title: "Could not accept", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Interview confirmed" });

    const startStr = format(new Date(chosen.start), "PPP 'at' p");
    const linkLine = r.meeting_url ? `\nMeeting link: ${r.meeting_url}` : "";
    const detail = `Confirmed time: ${startStr} (${chosen.duration_minutes} min)${linkLine}`;
    sendNotificationEmail({
      recipientUserId: r.employer_user_id,
      kind: "interview_response",
      intro: `${profile?.first_name || "A talent"} accepted your interview request.`,
      detail,
      ctaPath: "/employer",
    });
    load();
  };

  const decline = async (r: Request) => {
    setActing(r.id);
    const { error } = await supabase
      .from("interview_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", r.id);
    setActing(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request declined" });
    sendNotificationEmail({
      recipientUserId: r.employer_user_id,
      kind: "interview_response",
      intro: "A talent has declined your interview request.",
      ctaPath: "/employer",
    });
    load();
  };

  const respondLegacy = async (id: string, status: "accepted" | "declined", employerUserId: string) => {
    setActing(id);
    const { error } = await supabase
      .from("interview_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setActing(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Request ${status}` });
    sendNotificationEmail({
      recipientUserId: employerUserId,
      kind: "interview_response",
      intro:
        status === "accepted"
          ? "A talent has accepted your interview request."
          : "A talent has declined your interview request.",
      ctaPath: "/employer",
    });
    load();
  };

  const downloadIcs = (r: Request) => {
    if (!r.selected_slot || !r.meeting_url) return;
    const ics = buildIcs({
      uid: r.id,
      startISO: r.selected_slot.start,
      durationMinutes: r.selected_slot.duration_minutes,
      title: `Interview — ${r.company_name || r.employer_name || "Employer"}`,
      description: `Interview via Opulence Talent Collective.\n\nJoin: ${r.meeting_url}`,
      location: r.meeting_url,
    });
    const a = document.createElement("a");
    a.href = icsDataUrl(ics);
    a.download = `interview-${r.id.slice(0, 8)}.ics`;
    a.click();
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

          {/* Confirmed interview view */}
          {r.status === "accepted" && r.selected_slot && (() => {
            const url = r.meeting_url ?? "";
            const isBroken =
              !url ||
              url === "https://meet.google.com/new" ||
              /meet\.google\.com\/lookup\//i.test(url);
            return (
              <div className="border border-gold/30 bg-gold/5 rounded-md p-4 mb-2">
                <p className="text-xs uppercase tracking-wider text-foreground font-body font-semibold mb-2">
                  Confirmed Interview
                </p>
                <p className="font-body text-sm text-foreground mb-1">
                  {format(new Date(r.selected_slot.start), "EEEE, MMMM d 'at' p")}
                </p>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  {r.selected_slot.duration_minutes} minutes
                </p>
                {isBroken ? (
                  <div className="rounded-md border border-border bg-muted p-3 mb-2">
                    <p className="font-body text-xs text-foreground">
                      The employer hasn't shared a meeting link yet. Send them a message to confirm where to meet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="gold" size="sm" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Video size={14} /> Join Meeting
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={googleCalendarUrl({
                          startISO: r.selected_slot.start,
                          durationMinutes: r.selected_slot.duration_minutes,
                          title: `Interview — ${r.company_name || r.employer_name || "Employer"}`,
                          description: `Interview via Opulence Talent Collective.\n\nJoin: ${url}`,
                          location: url,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <CalendarPlus size={14} /> Add to Google Calendar
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadIcs(r)}>
                      Download .ics
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pending: pick a slot */}
          {r.status === "pending" && r.proposed_slots && r.proposed_slots.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">
                Proposed times — pick one
              </p>
              {r.proposed_slots.map((slot, i) => {
                const isPicked = pickedSlot[r.id] === i;
                const isPast = new Date(slot.start).getTime() < Date.now();
                const hasConflict =
                  !isPast &&
                  confirmedSlots.some((existing) => slotsOverlap(existing, slot));
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isPast}
                    onClick={() => setPickedSlot({ ...pickedSlot, [r.id]: i })}
                    className={`w-full text-left p-3 rounded-md border font-body text-sm transition ${
                      isPast
                        ? "opacity-40 cursor-not-allowed border-border"
                        : isPicked
                        ? "border-gold bg-gold/10 text-foreground"
                        : hasConflict
                        ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                        : "border-border hover:border-gold/50 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{format(new Date(slot.start), "EEE, MMM d 'at' p")}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {hasConflict && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle size={12} /> Conflict
                          </span>
                        )}
                        {slot.duration_minutes} min{isPast && " • past"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {r.status === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => accept(r)}
                disabled={acting === r.id}
              >
                <Check size={14} /> Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => decline(r)}
                disabled={acting === r.id}
              >
                <X size={14} /> Decline
              </Button>
            </div>
          )}
        </Card>
      ))}

      <AlertDialog
        open={conflictPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setConflictPrompt(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              You already have an interview at this time
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conflictPrompt
                ? `${format(new Date(conflictPrompt.slot.start), "EEE, MMM d 'at' p")} (${conflictPrompt.slot.duration_minutes} min) overlaps with another confirmed interview. Are you sure you want to accept this one too?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!conflictPrompt) return;
                const { request, slot } = conflictPrompt;
                setConflictPrompt(null);
                await performAccept(request, slot);
              }}
            >
              Accept anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InterviewRequests;
