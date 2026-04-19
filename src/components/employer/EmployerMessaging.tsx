import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send, MessageSquare, Loader2, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReportDialog from "@/components/ReportDialog";
import { sendNotificationEmail } from "@/lib/notifications";

type Conversation = {
  id: string;
  employer_user_id: string;
  candidate_user_id: string;
  updated_at: string;
  candidate_name?: string;
  last_message?: string;
  unread?: number;
};

type Message = {
  id: string;
  body: string;
  sender_id: string;
  sent_at: string;
  read_at: string | null;
};

type Props = { initialCandidateUserId?: string | null; onConsumed?: () => void };

const EmployerMessaging = ({ initialCandidateUserId, onConsumed }: Props) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .eq("employer_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!convos) {
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      convos.map(async (c) => {
        const { data: cand } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", c.candidate_user_id)
          .maybeSingle();
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("body")
          .eq("conversation_id", c.id)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const { count: unread } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", user.id)
          .is("read_at", null);
        return {
          ...c,
          candidate_name: cand ? `${cand.first_name ?? ""} ${cand.last_name ?? ""}`.trim() || "Candidate" : "Candidate",
          last_message: lastMsg?.body ?? "",
          unread: unread ?? 0,
        };
      })
    );
    setConversations(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  // Open or create conversation with initialCandidateUserId
  useEffect(() => {
    const openWith = async () => {
      if (!initialCandidateUserId || !user) return;
      const existing = conversations.find((c) => c.candidate_user_id === initialCandidateUserId);
      if (existing) {
        setActiveId(existing.id);
        onConsumed?.();
        return;
      }
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ employer_user_id: user.id, candidate_user_id: initialCandidateUserId })
        .select("*")
        .single();
      if (error) {
        toast({ title: "Could not start conversation", description: error.message, variant: "destructive" });
      } else if (newConvo) {
        await loadConversations();
        setActiveId(newConvo.id);
      }
      onConsumed?.();
    };
    openWith();
  }, [initialCandidateUserId, conversations.length, user]);

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("sent_at", { ascending: true });
    setMessages(data ?? []);
    if (user) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .is("read_at", null);
    }
  };

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`emp-messages-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  const sendReply = async () => {
    if (!reply.trim() || !activeId || !user) return;
    setSending(true);
    const body = reply.trim();
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      body,
    });
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setReply("");
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeId);
      const convo = conversations.find((c) => c.id === activeId);
      if (convo?.candidate_user_id) {
        sendNotificationEmail({
          recipientUserId: convo.candidate_user_id,
          kind: "new_message",
          intro: "You have a new message from an employer on Opulence Talent Collective.",
          detail: body.length > 280 ? `${body.slice(0, 280)}…` : body,
          ctaPath: "/dashboard",
        });
      }
    }
    setSending(false);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Loader2 className="animate-spin mx-auto text-muted-foreground" />
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <MessageSquare size={40} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="font-heading text-2xl mb-2">No conversations yet</h3>
        <p className="text-muted-foreground font-body text-sm">
          Browse the directory and reach out to talent to start a conversation.
        </p>
      </Card>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <Card className="shadow-card overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
        <div className="border-r border-border bg-muted/30">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading text-lg">Conversations</h3>
          </div>
          <div className="overflow-y-auto max-h-[450px]">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-4 border-b border-border/50 hover:bg-background transition-colors ${
                  activeId === c.id ? "bg-background" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-body font-medium text-sm text-foreground">{c.candidate_name}</p>
                  {c.unread! > 0 && (
                    <span className="bg-gold text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-body truncate">{c.last_message || "—"}</p>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col">
          {active ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <p className="font-heading text-lg">{active.candidate_name}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReportOpen(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Flag className="w-4 h-4 mr-1" /> Report
                </Button>
              </div>
              {active && (
                <ReportDialog
                  open={reportOpen}
                  onOpenChange={setReportOpen}
                  reportedUserId={active.candidate_user_id}
                  reportedUserName={active.candidate_name}
                  conversationId={active.id}
                />
              )}
              <div className="flex-1 p-4 overflow-y-auto max-h-[400px] space-y-3">
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl font-body text-sm ${
                          mine
                            ? "bg-gold text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(m.sent_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                  maxLength={2000}
                />
                <Button variant="gold" onClick={sendReply} disabled={sending || !reply.trim()}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-body text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EmployerMessaging;
