import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, Building2 } from "lucide-react";
import { pickNativeImage } from "@/lib/native-image-picker";

const EmployerProfileEditor = () => {
  const { user, profile } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    company_website: "",
    company_industry: "",
    company_size: "",
    company_description: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      company_name: (profile as any).company_name ?? "",
      company_website: (profile as any).company_website ?? "",
      company_industry: (profile as any).company_industry ?? "",
      company_size: (profile as any).company_size ?? "",
      company_description: (profile as any).company_description ?? "",
    });
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        company_name: form.company_name.trim() || null,
        company_website: form.company_website.trim() || null,
        company_industry: form.company_industry.trim() || null,
        company_size: form.company_size || null,
        company_description: form.company_description.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
      window.location.reload();
    }
  };

  const uploadLogoFile = async (file: File) => {
    if (!user) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 3MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("company-logos").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ company_logo_url: url }).eq("user_id", user.id);
    setUploading(false);
    toast({ title: "Logo updated" });
    window.location.reload();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadLogoFile(file);
  };

  const handleLogoClick = async () => {
    const picked = await pickNativeImage({ maxDimension: 800, quality: 90 });
    if (picked) {
      await uploadLogoFile(picked.file);
    } else {
      logoRef.current?.click();
    }
  };

  if (!profile) return null;
  const logoUrl = (profile as any).company_logo_url as string | null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 shadow-card">
        <h2 className="font-heading text-2xl mb-6 text-foreground">Your Name</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-body text-sm">First Name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} maxLength={80} />
          </div>
          <div>
            <Label className="font-body text-sm">Last Name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} maxLength={80} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-heading text-2xl mb-6 text-foreground">Company Profile</h2>
        <p className="text-sm text-muted-foreground font-body mb-6">
          Talent will see this information when you reach out. Adding a complete profile builds trust.
        </p>

        <div className="mb-6">
          <Label className="font-body text-sm mb-2 block">Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-md bg-muted border border-border overflow-hidden flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={28} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button variant="outline" size="sm" onClick={handleLogoClick} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                {logoUrl ? "Change" : "Upload"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 font-body">JPG, PNG · Max 3MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="font-body text-sm">Company Name</Label>
            <Input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="e.g. Sterling Family Office"
              maxLength={120}
            />
          </div>
          <div>
            <Label className="font-body text-sm">Industry</Label>
            <Input
              value={form.company_industry}
              onChange={(e) => setForm({ ...form, company_industry: e.target.value })}
              placeholder="e.g. Family Office"
              maxLength={80}
            />
          </div>
          <div>
            <Label className="font-body text-sm">Company Size</Label>
            <Select value={form.company_size} onValueChange={(v) => setForm({ ...form, company_size: v })}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1–10</SelectItem>
                <SelectItem value="11-50">11–50</SelectItem>
                <SelectItem value="51-200">51–200</SelectItem>
                <SelectItem value="200+">200+</SelectItem>
                <SelectItem value="private_household">Private Household</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="font-body text-sm">Website</Label>
            <Input
              value={form.company_website}
              onChange={(e) => setForm({ ...form, company_website: e.target.value })}
              placeholder="https://example.com"
              maxLength={200}
            />
          </div>
          <div className="md:col-span-2">
            <Label className="font-body text-sm">About Your Company</Label>
            <Textarea
              value={form.company_description}
              onChange={(e) => setForm({ ...form, company_description: e.target.value })}
              rows={5}
              maxLength={2000}
              placeholder="Share what makes your organization unique. Talent will see this when you reach out."
            />
            <p className="text-xs text-muted-foreground mt-1 font-body">{form.company_description.length}/2000</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end sticky bottom-4 z-10">
        <Button variant="gold" size="lg" onClick={save} disabled={saving} className="shadow-elevated">
          {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default EmployerProfileEditor;
