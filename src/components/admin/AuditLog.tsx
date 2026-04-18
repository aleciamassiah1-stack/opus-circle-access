import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Search, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Row = {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type ProfileLite = { user_id: string; first_name: string | null; last_name: string | null; email: string | null };

const ACTION_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  approve: { label: "Approved", variant: "default" },
  reject: { label: "Rejected", variant: "destructive" },
  verify: { label: "Verified", variant: "default" },
  unverify: { label: "Unverified", variant: "outline" },
  promote_admin: { label: "Promoted to admin", variant: "secondary" },
  visibility_show: { label: "Made visible", variant: "outline" },
  visibility_hide: { label: "Hidden", variant: "outline" },
  soft_delete: { label: "Deactivated", variant: "secondary" },
  restore: { label: "Restored", variant: "default" },
  hard_delete: { label: "Deleted permanently", variant: "destructive" },
  doc_approve: { label: "Document approved", variant: "default" },
  doc_reject: { label: "Document rejected", variant: "destructive" },
  report_status_change: { label: "Report status changed", variant: "outline" },
  report_dismiss: { label: "Report dismissed", variant: "outline" },
  report_resolve: { label: "Report resolved", variant: "default" },
  report_delete: { label: "Report deleted", variant: "destructive" },
};

const AuditLog = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setRows((data ?? []) as Row[]);

      const ids = new Set<string>();
      (data ?? []).forEach((r) => {
        ids.add(r.admin_user_id);
        if (r.target_user_id) ids.add(r.target_user_id);
      });
      if (ids.size) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, email")
          .in("user_id", Array.from(ids));
        setProfiles(new Map((profs ?? []).map((p) => [p.user_id, p as ProfileLite])));
      }
      setLoading(false);
    })();
  }, []);

  const nameFor = (uid: string | null) => {
    if (!uid) return "—";
    const p = profiles.get(uid);
    if (!p) return uid.slice(0, 8) + "…";
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
    return name || p.email || uid.slice(0, 8) + "…";
  };

  const filtered = rows.filter((r) => {
    if (actionFilter !== "all" && r.action !== actionFilter) return false;
    if (search) {
      const hay = `${nameFor(r.admin_user_id)} ${nameFor(r.target_user_id)} ${r.action}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const renderAction = (action: string) => {
    const cfg = ACTION_CONFIG[action] ?? { label: action, variant: "outline" as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div>
      <Card className="p-4 mb-4 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search admin or target name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-body text-sm flex flex-col items-center gap-2">
            <FileText size={20} />
            No audit entries match.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{nameFor(r.admin_user_id)}</TableCell>
                  <TableCell>{renderAction(r.action)}</TableCell>
                  <TableCell className="text-sm">{nameFor(r.target_user_id)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {r.details && Object.keys(r.details).length > 0
                      ? JSON.stringify(r.details)
                      : "—"}
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

export default AuditLog;
