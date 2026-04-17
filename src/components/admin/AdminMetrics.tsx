import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type Stat = { label: string; value: number | string; icon: LucideIcon; color?: string };

const AdminMetrics = ({ stats }: { stats: Stat[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {stats.map((s) => (
      <Card key={s.label} className="p-5 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <s.icon size={16} className={s.color ?? "text-foreground"} />
          <span className="font-body text-xs text-muted-foreground">{s.label}</span>
        </div>
        <p className={`font-heading text-3xl ${s.color ?? "text-foreground"}`}>{s.value}</p>
      </Card>
    ))}
  </div>
);

export default AdminMetrics;
