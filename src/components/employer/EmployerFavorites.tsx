import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Heart, Loader2, MapPin, MessageSquare } from "lucide-react";

type Fav = {
  id: string;
  candidate_profile_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  location: string | null;
  avatar_url: string | null;
};

type Props = { onMessage: (userId: string) => void };

const EmployerFavorites = ({ onMessage }: Props) => {
  const { user } = useAuth();
  const [favs, setFavs] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("favorites")
      .select("id, candidate_profile_id")
      .eq("employer_user_id", user.id);
    if (!rows?.length) {
      setFavs([]);
      setLoading(false);
      return;
    }
    const ids = rows.map((r) => r.candidate_profile_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, first_name, last_name, title, location, avatar_url")
      .in("id", ids);

    setFavs(
      rows
        .map((r) => {
          const p = profiles?.find((pp) => pp.id === r.candidate_profile_id);
          if (!p) return null;
          return {
            id: r.id,
            candidate_profile_id: r.candidate_profile_id,
            user_id: p.user_id,
            first_name: p.first_name,
            last_name: p.last_name,
            title: p.title,
            location: p.location,
            avatar_url: p.avatar_url,
          };
        })
        .filter(Boolean) as Fav[]
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (favId: string, profileId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favId)
      .eq("employer_user_id", user.id);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    } else {
      setFavs(favs.filter((f) => f.id !== favId));
    }
  };

  if (loading) {
    return <Card className="p-12 text-center shadow-card"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></Card>;
  }

  if (favs.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card">
        <Heart size={40} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="font-heading text-2xl mb-2">No saved talent</h3>
        <p className="text-muted-foreground font-body text-sm">
          Tap the heart icon on a profile to save it for later.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {favs.map((f) => {
        const initials = `${f.first_name?.[0] ?? ""}${f.last_name?.[0] ?? ""}`.toUpperCase() || "?";
        return (
          <Card key={f.id} className="p-4 shadow-card flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={f.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-body font-medium truncate">
                {f.first_name} {f.last_name}
              </p>
              <p className="text-xs text-muted-foreground font-body truncate">{f.title ?? "—"}</p>
              {f.location && (
                <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />{f.location}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => onMessage(f.user_id)}>
                <MessageSquare size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(f.id, f.candidate_profile_id)}>
                <Heart size={14} fill="currentColor" className="text-gold" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default EmployerFavorites;
