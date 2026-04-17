import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Heart, MapPin, Briefcase, Search, Loader2, MessageSquare, CalendarCheck } from "lucide-react";
import CandidateProfileDialog from "./CandidateProfileDialog";

type DirectoryCandidate = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  years_experience: number | null;
  availability_status: string | null;
  job_titles: string[];
  tags: string[];
};

type Props = { onMessage: (candidateUserId: string) => void };

const TalentDirectory = ({ onMessage }: Props) => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<DirectoryCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [titleFilter, setTitleFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [allTitles, setAllTitles] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadDirectory = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: titles }, { data: tags }, { data: favs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, title, headline, location, bio, avatar_url, years_experience, availability_status")
        .eq("approval_status", "approved")
        .eq("subscription_active", true)
        .eq("visibility_status", "visible"),
      supabase.from("job_titles").select("id, name").order("sort_order"),
      supabase.from("specialty_tags").select("id, name").order("sort_order"),
      user
        ? supabase.from("favorites").select("candidate_profile_id").eq("employer_user_id", user.id)
        : Promise.resolve({ data: [] as { candidate_profile_id: string }[] }),
    ]);

    setAllTitles(titles ?? []);
    setAllTags(tags ?? []);
    setFavorites(new Set((favs ?? []).map((f: any) => f.candidate_profile_id)));

    if (!profiles?.length) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const profileIds = profiles.map((p) => p.id);
    const [{ data: cjt }, { data: cst }] = await Promise.all([
      supabase
        .from("candidate_job_titles")
        .select("profile_id, job_titles(name)")
        .in("profile_id", profileIds),
      supabase
        .from("candidate_specialty_tags")
        .select("profile_id, specialty_tags(name)")
        .in("profile_id", profileIds),
    ]);

    const titleMap = new Map<string, string[]>();
    (cjt ?? []).forEach((row: any) => {
      const arr = titleMap.get(row.profile_id) ?? [];
      if (row.job_titles?.name) arr.push(row.job_titles.name);
      titleMap.set(row.profile_id, arr);
    });
    const tagMap = new Map<string, string[]>();
    (cst ?? []).forEach((row: any) => {
      const arr = tagMap.get(row.profile_id) ?? [];
      if (row.specialty_tags?.name) arr.push(row.specialty_tags.name);
      tagMap.set(row.profile_id, arr);
    });

    setCandidates(
      profiles.map((p) => ({
        ...p,
        job_titles: titleMap.get(p.id) ?? [],
        tags: tagMap.get(p.id) ?? [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadDirectory();
  }, [user]);

  const toggleFavorite = async (profileId: string) => {
    if (!user) return;
    if (favorites.has(profileId)) {
      await supabase.from("favorites").delete().eq("employer_user_id", user.id).eq("candidate_profile_id", profileId);
      const next = new Set(favorites);
      next.delete(profileId);
      setFavorites(next);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ employer_user_id: user.id, candidate_profile_id: profileId });
      if (error) {
        toast({ title: "Could not save favorite", description: error.message, variant: "destructive" });
      } else {
        setFavorites(new Set([...favorites, profileId]));
      }
    }
  };

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const fullName = `${c.first_name ?? ""} ${c.last_name ?? ""} ${c.title ?? ""} ${c.headline ?? ""} ${c.location ?? ""}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) return false;
      if (titleFilter !== "all" && !c.job_titles.includes(titleFilter)) return false;
      if (tagFilter !== "all" && !c.tags.includes(tagFilter)) return false;
      if (availabilityFilter !== "all" && c.availability_status !== availabilityFilter) return false;
      return true;
    });
  }, [candidates, search, titleFilter, tagFilter, availabilityFilter]);

  return (
    <div>
      {/* Filters */}
      <Card className="p-5 mb-6 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search by name, title, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={titleFilter} onValueChange={setTitleFilter}>
            <SelectTrigger><SelectValue placeholder="Job title" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All titles</SelectItem>
              {allTitles.map((t) => (
                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger><SelectValue placeholder="Specialty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3">
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="md:w-60"><SelectValue placeholder="Availability" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any availability</SelectItem>
              <SelectItem value="available">Available now</SelectItem>
              <SelectItem value="open">Open to opportunities</SelectItem>
              <SelectItem value="not_looking">Not actively looking</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center shadow-card">
          <Loader2 className="animate-spin mx-auto text-muted-foreground" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center shadow-card">
          <p className="font-heading text-2xl mb-2">No candidates match</p>
          <p className="font-body text-muted-foreground text-sm">Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const initials = `${c.first_name?.[0] ?? ""}${c.last_name?.[0] ?? ""}`.toUpperCase() || "?";
            const isFav = favorites.has(c.id);
            return (
              <Card key={c.id} className="p-5 shadow-card hover:shadow-elevated transition-shadow flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-14 w-14 border border-border">
                    <AvatarImage src={c.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-secondary font-body text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-lg leading-tight truncate">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="font-body text-sm text-muted-foreground truncate">{c.title ?? c.headline ?? "—"}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    className={`p-2 rounded-full transition-colors ${isFav ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                    aria-label="Favorite"
                  >
                    <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-body mb-3">
                  {c.location && (
                    <span className="flex items-center gap-1"><MapPin size={12} />{c.location}</span>
                  )}
                  {c.years_experience != null && (
                    <span className="flex items-center gap-1"><Briefcase size={12} />{c.years_experience} yrs</span>
                  )}
                </div>

                {c.bio && (
                  <p className="font-body text-sm text-muted-foreground line-clamp-2 mb-3">{c.bio}</p>
                )}

                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {c.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] font-body">{t}</Badge>
                    ))}
                    {c.tags.length > 3 && (
                      <Badge variant="outline" className="text-[10px] font-body">+{c.tags.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="mt-auto flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedId(c.id)}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onMessage(c.user_id)} aria-label="Message">
                    <MessageSquare size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedId && (
        <CandidateProfileDialog
          candidate={candidates.find((c) => c.id === selectedId)!}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onMessage={onMessage}
          isFavorite={favorites.has(selectedId)}
          onToggleFavorite={() => toggleFavorite(selectedId)}
        />
      )}
    </div>
  );
};

export default TalentDirectory;
