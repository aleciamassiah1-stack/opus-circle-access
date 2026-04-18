import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Flag } from "lucide-react";
import { z } from "zod";

const REPORT_CATEGORIES = [
  { value: "harassment", label: "Harassment or abusive behavior" },
  { value: "spam", label: "Spam or unsolicited promotion" },
  { value: "fake_profile", label: "Fake or impersonated profile" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "scam", label: "Scam or fraudulent activity" },
  { value: "other", label: "Other" },
] as const;

const reportSchema = z.object({
  category: z.enum([
    "harassment",
    "spam",
    "fake_profile",
    "inappropriate_content",
    "scam",
    "other",
  ]),
  message: z
    .string()
    .trim()
    .min(10, "Please provide at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName?: string;
  conversationId?: string;
};

const ReportDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  conversationId,
}: Props) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory("");
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = reportSchema.safeParse({ category, message });
    if (!parsed.success) {
      toast({
        title: "Cannot submit",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_user_id: user.id,
      reported_user_id: reportedUserId,
      conversation_id: conversationId ?? null,
      category: parsed.data.category,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Could not submit report",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Report submitted",
      description: "Our team will review this within 48 hours.",
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report {reportedUserName ?? "this user"}
          </DialogTitle>
          <DialogDescription>
            Reports are confidential. Our team reviews every submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-category">Reason</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="report-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-message">What happened?</Label>
            <Textarea
              id="report-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share specifics — dates, messages, behaviors. Avoid sharing private contact info."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !category || message.trim().length < 10}
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
