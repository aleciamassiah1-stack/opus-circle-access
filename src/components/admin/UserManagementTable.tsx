import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, EyeOff, Search, Loader2, BadgeCheck, Shield } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];
type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

interface UserRow extends Profile {
  role: AppRole | null;
}

type Props = { onChange?: () => void };

const UserManagementTable = ({ onChange }: Props) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("all");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    setUsers((profiles ?? []).map((p) => ({ ...p, role: (map.get(p.user_id) ?? null) as AppRole | null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateApproval = async (userId: string, status: ApprovalStatus) => {
    const update: any = { approval_status: status };
    if (status === "approved") update.visibility_status = "visible";
    if (status === "rejected") update.visibility_status = "hidden";
    const { error } = await supabase.from("profiles").update(update).eq("user_id", userId);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: `User ${status}` });
      load();
      onChange?.();
    }
  };

  const toggleVisibility = async (userId: string, current: string | null) => {
    const next = current === "visible" ? "hidden" : "visible";
    const { error } = await supabase.from("profiles").update({ visibility_status: next }).eq("user_id", userId);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: `Profile ${next}` }); load(); onChange?.(); }
  };

  const toggleVerified = async (userId: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ verified: !current }).eq("user_id", userId);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: !current ? "Marked verified" : "Verification removed" }); load(); onChange?.(); }
  };

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) toast({ title: "Could not grant admin", description: error.message, variant: "destructive" });
    else { toast({ title: "Admin role granted" }); load(); onChange?.(); }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.approval_status !== statusFilter) return false;
    if (search) {
      const haystack = `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.email ?? ""} ${u.title ?? ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const statusBadge = (s: ApprovalStatus) => {
    const cfg = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    } as const;
    return <Badge variant={cfg[s]} className="capitalize">{s}</Badge>;
  };

  const roleBadge = (r: AppRole | null) => {
    if (!r) return <span className="text-muted-foreground text-xs">—</span>;
    return <Badge variant="outline" className="capitalize">{r}</Badge>;
  };

  return (
    <div>
      <Card className="p-4 mb-4 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="candidate">Candidates</SelectItem>
              <SelectItem value="employer">Employers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-body text-sm">No users match.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sub</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {u.first_name} {u.last_name}
                      {u.verified && <BadgeCheck size={14} className="text-gold" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>{statusBadge(u.approval_status)}</TableCell>
                  <TableCell>
                    {u.subscription_active ? (
                      <Badge variant="default" className="text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.verified ? (
                      <Badge className="text-[10px] bg-gold text-primary-foreground hover:bg-gold/90">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">
                    {u.visibility_status ?? "hidden"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {u.approval_status !== "approved" && (
                        <Button size="sm" variant="outline" onClick={() => updateApproval(u.user_id, "approved")} title="Approve">
                          <CheckCircle size={12} />
                        </Button>
                      )}
                      {u.approval_status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApproval(u.user_id, "rejected")}
                          className="text-destructive border-destructive/20"
                          title="Reject"
                        >
                          <XCircle size={12} />
                        </Button>
                      )}
                      {u.role === "candidate" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleVerified(u.user_id, !!u.verified)}
                          title={u.verified ? "Remove verification" : "Mark verified"}
                          className={u.verified ? "text-gold" : ""}
                        >
                          <BadgeCheck size={12} />
                        </Button>
                      )}
                      {u.role === "candidate" && (
                        <Button size="sm" variant="ghost" onClick={() => toggleVisibility(u.user_id, u.visibility_status)} title="Toggle visibility">
                          {u.visibility_status === "visible" ? <EyeOff size={12} /> : <Eye size={12} />}
                        </Button>
                      )}
                      {u.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => promoteToAdmin(u.user_id)}
                          title="Promote to admin"
                        >
                          <Shield size={12} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default UserManagementTable;
