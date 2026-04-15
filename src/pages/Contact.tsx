import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Message sent",
        description: "We'll get back to you within 24 hours.",
      });
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <PageLayout>
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="font-heading text-5xl text-foreground mb-6">
              Get in <span className="text-gradient-gold">Touch</span>
            </h1>
            <p className="font-body text-muted-foreground text-lg leading-relaxed mb-10">
              Have questions about the platform, membership, or partnership opportunities? 
              We'd love to hear from you.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Mail size={16} className="text-gold" />
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">Email</p>
                  <p className="font-body text-sm text-foreground">hello@opulencetalent.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin size={16} className="text-gold" />
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">Location</p>
                  <p className="font-body text-sm text-foreground">By appointment only</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 shadow-card space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs font-medium text-foreground mb-1.5 block">First Name</label>
                <Input required placeholder="Jane" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Last Name</label>
                <Input required placeholder="Doe" />
              </div>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Email</label>
              <Input required type="email" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">I am a...</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-body text-foreground">
                <option>Candidate / Talent</option>
                <option>Employer / Family Office</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea required placeholder="How can we help?" rows={4} />
            </div>
            <Button variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
