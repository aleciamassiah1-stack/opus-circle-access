import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw, Trash2, UserMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Profile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  deactivated_at: string;
  scheduled_purge_at: string | null;
};

type Props = { onChange?: () => void };

const DeactivatedAccounts = ({ onChange }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmHard, setConfirmHard] = useState<Profile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, first_name, last_name, email, deactivated_at, scheduled_purge_at")
      .not("deactivated_at", "is", null)
      .order("deactivated_at", { ascending: false });
    setRows((data ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const restore = async (uid: string) => {
    setBusyId(uid);
    const { error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: uid, mode: "restore" },
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account restored" });
      load();
      onChange?.();
    }
  };

  const hardDelete = async (uid: string) => {
    setBusyId(uid);
    const { error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: uid, mode: "hard" },
    });
    setBusyId(null);
    setConfirmHard(null);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account permanently deleted" });
      load();
      onChange?.();
    }
  };

  return (
    <div>
      <Card className="shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-body text-sm flex flex-col items-center gap-2">
            <UserMinus size={20} />
            No deactivated accounts.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Deactivated</TableHead>
                <TableHead>Auto-purges</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const purgeDate = u.scheduled_purge_at ? new Date(u.scheduled_purge_at) : null;
                const purgeSoon = purgeDate && purgeDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(u.deactivated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {purgeDate ? (
                        <Badge variant={purgeSoon ? "destructive" : "outline"} className="text-[10px]">
                          {formatDistanceToNow(purgeDate, { addSuffix: true })}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restore(u.user_id)}
                          disabled={busyId === u.user_id}
                          title="Restore account"
                        >
                          {busyId === u.user_id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                          <span className="ml-1">Restore</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmHard(u)}
                          disabled={busyId === u.user_id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete permanently now"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!confirmHard} onOpenChange={(o) => !o && setConfirmHard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This skips the 30-day recovery window and immediately removes <strong>{confirmHard?.first_name} {confirmHard?.last_name}</strong> ({confirmHard?.email}) and all of their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmHard) hardDelete(confirmHard.user_id); }}
              disabled={!!busyId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busyId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeactivatedAccounts;
