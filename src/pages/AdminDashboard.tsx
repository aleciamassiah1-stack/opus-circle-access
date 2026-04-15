import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];
type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

interface UserWithRole extends Profile {
  role: AppRole | null;
}

const AdminDashboard = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ApprovalStatus>("all");

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
    const usersWithRoles: UserWithRole[] = (profiles ?? []).map((p) => ({
      ...p,
      role: roleMap.get(p.user_id) ?? null,
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    if (hasRole("admin")) {
      fetchUsers();
    }
  }, []);

  const updateApproval = async (userId: string, status: ApprovalStatus) => {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: status })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `User ${status}` });
      fetchUsers();
    }
  };

  const filteredUsers = filter === "all" ? users : users.filter((u) => u.approval_status === filter);

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.approval_status === "pending").length,
    approved: users.filter((u) => u.approval_status === "approved").length,
    rejected: users.filter((u) => u.approval_status === "rejected").length,
  };

  const statusBadge = (status: ApprovalStatus) => {
    const config = {
      pending: { variant: "outline" as const, icon: Clock, label: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" },
    };
    const { variant, icon: Icon, label } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon size={12} />
        {label}
      </Badge>
    );
  };

  const roleBadge = (role: AppRole | null) => {
    if (!role) return <span className="text-muted-foreground text-xs">—</span>;
    const colors: Record<AppRole, string> = {
      candidate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      employer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      admin: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
    return (
      <Badge variant="outline" className={`${colors[role]} border-0 capitalize`}>
        {role}
      </Badge>
    );
  };

  return (
    <PageLayout>
      <section className="py-24 px-6 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto max-w-6xl">
          <h1 className="font-heading text-4xl text-foreground mb-2">Admin Dashboard</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">
            Manage users, approve applications, and oversee the platform.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats.total, icon: Users, color: "text-foreground" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
              { label: "Approved", value: stats.approved, icon: UserCheck, color: "text-emerald-500" },
              { label: "Rejected", value: stats.rejected, icon: UserX, color: "text-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg p-5 shadow-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon size={16} className={stat.color} />
                  <span className="font-body text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`font-heading text-2xl ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-body text-sm text-muted-foreground">Filter:</span>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <p className="font-body text-sm text-muted-foreground animate-pulse">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-body text-sm text-muted-foreground">No users found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                      <TableCell>{roleBadge(user.role)}</TableCell>
                      <TableCell>{statusBadge(user.approval_status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {user.approval_status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => updateApproval(user.user_id, "approved")}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Approve
                            </Button>
                          )}
                          {user.approval_status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/20 hover:bg-destructive/5"
                              onClick={() => updateApproval(user.user_id, "rejected")}
                            >
                              <XCircle size={14} className="mr-1" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AdminDashboard;
