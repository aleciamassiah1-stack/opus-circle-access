import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

type Props = { onGranted?: () => void };

const AdminRoleGrant = ({ onGranted }: Props) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const grant = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    const { data: uid, error: lookupErr } = await supabase.rpc("find_user_id_by_email", { _email: trimmed });
    if (lookupErr) {
      toast({ title: "Lookup failed", description: lookupErr.message, variant: "destructive" });
      setBusy(false);
      return;
    }
    if (!uid) {
      toast({ title: "No user found", description: `No account with email ${trimmed}.`, variant: "destructive" });
      setBusy(false);
      return;
    }
    const { error: insertErr } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    if (insertErr && !insertErr.message.includes("duplicate")) {
      toast({ title: "Could not grant role", description: insertErr.message, variant: "destructive" });
    } else {
      toast({ title: "Admin role granted", description: trimmed });
      setEmail("");
      onGranted?.();
    }
    setBusy(false);
  };

  return (
    <Card className="p-5 mb-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gold/10 rounded-md text-gold">
          <Shield size={18} />
        </div>
        <div className="flex-1">
          <p className="font-heading text-lg leading-tight">Grant admin access</p>
          <p className="text-sm text-muted-foreground font-body mb-3">
            Enter the email of an existing user to give them admin privileges.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && grant()}
              disabled={busy}
            />
            <Button onClick={grant} disabled={busy || !email.trim()} variant="gold">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Grant Admin
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AdminRoleGrant;
