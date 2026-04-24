import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, X, Sparkles } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  headline: z.string().trim().max(160).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  years_experience: z.number().int().min(0).max(80).optional(),
  availability_status: z.string().optional(),
  work_authorization: z.string().optional(),
});

type JobTitle = { id: string; name: string };
type Tag = { id: string; name: string };

const ProfileEditor = () => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    title: "",
    headline: "",
    location: "",
    phone: "",
    bio: "",
    years_experience: 0,
    availability_status: "available",
    work_authorization: "",
  });
  const [allTitles, setAllTitles] = useState<JobTitle[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const handleGenerateBio = async () => {
    if (!user) return;
    setGeneratingBio(true);
    const titleNames = allTitles.filter((t) => selectedTitles.includes(t.id)).map((t) => t.name);
    const tagNames = allTags.filter((t) => selectedTags.includes(t.id)).map((t) => t.name);
    const { data, error } = await supabase.functions.invoke("generate-bio", {
      body: {
        first_name: form.first_name,
        title: form.title,
        headline: form.headline,
        location: form.location,
        years_experience: form.years_experience,
        job_titles: titleNames,
        specialties: tagNames,
      },
    });
    setGeneratingBio(false);
    if (error || (data as any)?.error) {
      const msg = (data as any)?.error ?? error?.message ?? "Could not generate bio";
      toast({ title: "Bio generation failed", description: msg, variant: "destructive" });
      return;
    }
    const generated = (data as any)?.bio as string | undefined;
    if (!generated) {
      toast({ title: "No bio returned", variant: "destructive" });
      return;
    }
    setForm((prev) => ({ ...prev, bio: generated }));
    toast({ title: "Draft ready", description: "Review and edit before saving." });
  };

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        title: profile.title ?? "",
        headline: profile.headline ?? "",
        location: profile.location ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        years_experience: profile.years_experience ?? 0,
        availability_status: profile.availability_status ?? "available",
        work_authorization: profile.work_authorization ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    const load = async () => {
      const [{ data: titles }, { data: tags }] = await Promise.all([
        supabase.from("job_titles").select("id, name").order("sort_order"),
        supabase.from("specialty_tags").select("id, name").order("sort_order"),
      ]);
      setAllTitles(titles ?? []);
      setAllTags(tags ?? []);

      if (profile) {
        const [{ data: ct }, { data: cs }] = await Promise.all([
          supabase.from("candidate_job_titles").select("job_title_id").eq("profile_id", profile.id),
          supabase.from("candidate_specialty_tags").select("tag_id").eq("profile_id", profile.id),
        ]);
        setSelectedTitles(ct?.map((r) => r.job_title_id) ?? []);
        setSelectedTags(cs?.map((r) => r.tag_id) ?? []);
      }
    };
    load();
  }, [profile]);

  const calcCompletion = (data: typeof form, hasAvatar: boolean, hasResume: boolean, titlesN: number, tagsN: number) => {
    const checks = [
      !!data.first_name,
      !!data.last_name,
      !!data.title,
      !!data.headline,
      !!data.location,
      !!data.bio && data.bio.length > 50,
      data.years_experience > 0,
      hasAvatar,
      hasResume,
      titlesN > 0,
      tagsN > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      toast({ title: "Validation error", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSaving(true);
    const completion = calcCompletion(form, !!profile.avatar_url, !!profile.resume_url, selectedTitles.length, selectedTags.length);
    const { error } = await supabase
      .from("profiles")
      .update({ ...form, profile_completion: completion })
      .eq("user_id", user.id);

    // Sync titles
    await supabase.from("candidate_job_titles").delete().eq("profile_id", profile.id);
    if (selectedTitles.length) {
      await supabase.from("candidate_job_titles").insert(
        selectedTitles.map((job_title_id) => ({ profile_id: profile.id, job_title_id }))
      );
    }
    // Sync tags
    await supabase.from("candidate_specialty_tags").delete().eq("profile_id", profile.id);
    if (selectedTags.length) {
      await supabase.from("candidate_specialty_tags").insert(
        selectedTags.map((tag_id) => ({ profile_id: profile.id, tag_id }))
      );
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved", description: "Your changes have been saved." });
      window.location.reload();
    }
  };

  const uploadAvatarFile = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setUploadingAvatar(false);
    toast({ title: "Photo updated" });
    window.location.reload();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatarFile(file);
  };

  const handleAvatarClick = async () => {
    // On iOS/Android, prefer the native camera/library picker for better UX.
    const picked = await pickNativeImage({ maxDimension: 1200, quality: 85 });
    if (picked) {
      await uploadAvatarFile(picked.file);
    } else {
      // Web (or user is on native but cancelled the prompt below) — fall back to file input
      avatarRef.current?.click();
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "PDF only", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setUploadingResume(true);
    const path = `${user.id}/resume.pdf`;
    const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploadingResume(false);
      return;
    }
    await supabase.from("profiles").update({ resume_url: path, resume_summary: null }).eq("user_id", user.id);
    toast({ title: "Resume uploaded", description: "Generating private summary for employers..." });

    // Trigger AI summary generation in the background
    supabase.functions.invoke("summarize-resume").then(({ error }) => {
      if (error) {
        toast({ title: "Summary generation failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Resume summary ready", description: "Employers will see an anonymized AI summary." });
      }
    });

    setUploadingResume(false);
    window.location.reload();
  };

  const toggleTitle = (id: string) => {
    setSelectedTitles((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };
  const toggleTag = (id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Photo & Resume */}
      <Card className="p-6 shadow-card">
        <h2 className="font-heading text-2xl mb-6 text-foreground">Photo & Resume</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="font-body text-sm mb-2 block">Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={24} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                  {profile.avatar_url ? "Change" : "Upload"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 font-body">JPG, PNG · Max 5MB</p>
              </div>
            </div>
          </div>
          <div>
            <Label className="font-body text-sm mb-2 block">Resume (PDF)</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-md bg-muted border border-border flex items-center justify-center">
                <FileText size={28} className={profile.resume_url ? "text-gold" : "text-muted-foreground"} />
              </div>
              <div>
                <input
                  ref={resumeRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
                <Button variant="outline" size="sm" onClick={() => resumeRef.current?.click()} disabled={uploadingResume}>
                  {uploadingResume ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                  {profile.resume_url ? "Replace" : "Upload"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 font-body">
                  {profile.resume_url ? "Resume on file" : "PDF only · Max 10MB"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card className="p-6 shadow-card">
        <h2 className="font-heading text-2xl mb-6 text-foreground">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-body text-sm">First Name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} maxLength={80} />
          </div>
          <div>
            <Label className="font-body text-sm">Last Name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} maxLength={80} />
          </div>
          <div>
            <Label className="font-body text-sm">Professional Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Estate Manager"
              maxLength={120}
            />
          </div>
          <div>
            <Label className="font-body text-sm">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. New York, NY"
              maxLength={120}
            />
          </div>
          <div className="md:col-span-2">
            <Label className="font-body text-sm">Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="One-line summary of who you are"
              maxLength={160}
            />
          </div>
          <div>
            <Label className="font-body text-sm">Phone (optional)</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={40} />
          </div>
          <div>
            <Label className="font-body text-sm">Years of Experience</Label>
            <Input
              type="number"
              min={0}
              max={80}
              value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="font-body text-sm">Availability</Label>
            <Select value={form.availability_status} onValueChange={(v) => setForm({ ...form, availability_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Actively Seeking</SelectItem>
                <SelectItem value="open">Open to Opportunities</SelectItem>
                <SelectItem value="not_available">Not Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-body text-sm">Work Authorization</Label>
            <Select value={form.work_authorization} onValueChange={(v) => setForm({ ...form, work_authorization: v })}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="us_citizen">US Citizen</SelectItem>
                <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                <SelectItem value="visa">Visa Required</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <Label className="font-body text-sm">Bio</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="h-7 text-xs gap-1.5"
              >
                {generatingBio ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} className="text-gold" />
                )}
                {generatingBio ? "Drafting…" : (form.bio ? "Regenerate with AI" : "Generate with AI")}
              </Button>
            </div>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={5}
              maxLength={2000}
              placeholder="Share your background, expertise, and what makes you exceptional — or click 'Generate with AI' to draft from your profile."
            />
            <p className="text-xs text-muted-foreground mt-1 font-body">
              {form.bio.length}/2000 · AI drafts use your title, headline, job titles, specialties, and resume summary. Always review before saving.
            </p>
          </div>
        </div>
      </Card>

      {/* Job Titles */}
      <Card className="p-6 shadow-card">
        <h2 className="font-heading text-2xl mb-2 text-foreground">Job Titles</h2>
        <p className="text-sm text-muted-foreground font-body mb-4">Select roles you specialize in</p>
        <div className="flex flex-wrap gap-2">
          {allTitles.map((t) => (
            <Badge
              key={t.id}
              variant={selectedTitles.includes(t.id) ? "default" : "outline"}
              className={`cursor-pointer font-body py-1.5 px-3 ${
                selectedTitles.includes(t.id) ? "bg-gold text-primary-foreground hover:bg-gold/90" : "hover:bg-secondary"
              }`}
              onClick={() => toggleTitle(t.id)}
            >
              {t.name}
              {selectedTitles.includes(t.id) && <X size={12} className="ml-1" />}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Specialty Tags */}
      <Card className="p-6 shadow-card">
        <h2 className="font-heading text-2xl mb-2 text-foreground">Specialty Tags</h2>
        <p className="text-sm text-muted-foreground font-body mb-4">Highlight your expertise areas</p>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Badge
              key={t.id}
              variant={selectedTags.includes(t.id) ? "default" : "outline"}
              className={`cursor-pointer font-body py-1.5 px-3 ${
                selectedTags.includes(t.id) ? "bg-gold text-primary-foreground hover:bg-gold/90" : "hover:bg-secondary"
              }`}
              onClick={() => toggleTag(t.id)}
            >
              {t.name}
              {selectedTags.includes(t.id) && <X size={12} className="ml-1" />}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="flex justify-end sticky bottom-4 z-10">
        <Button variant="gold" size="lg" onClick={handleSave} disabled={saving} className="shadow-elevated">
          {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditor;
