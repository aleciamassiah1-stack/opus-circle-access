import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Crown, Briefcase } from "lucide-react";

const candidateFeatures = [
  "Full professional profile",
  "Visible to verified employers",
  "Direct inquiry notifications",
  "Skills & specialty tags",
  "Resume & document uploads",
  "Availability status control",
];

const employerFeatures = [
  "Access to fully vetted talent only",
  "Full talent directory access",
  "Advanced search & filters",
  "Save favorite talent",
  "Send interview requests",
  "Direct messaging",
  "Priority support",
];

const Membership = () => {
  return (
    <PageLayout>
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center mb-16">
          <h1 className="font-heading text-5xl lg:text-6xl text-foreground mb-6">
            Membership <span className="text-gradient-gold">Plans</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Simple, transparent pricing. Talent is individually vetted before profiles go live —
            employers pay for assured access to that curated network. Cancel anytime.
          </p>
        </div>

        <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Candidate Plan */}
          <div className="bg-card rounded-lg p-8 shadow-card border border-border flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Crown size={18} className="text-gold" />
              </div>
              <div>
                <h3 className="font-heading text-2xl text-foreground">Talent</h3>
                <p className="font-body text-xs text-muted-foreground">For professionals</p>
              </div>
            </div>
            <div className="mb-8">
              <span className="font-heading text-5xl text-foreground">$14.99</span>
              <span className="font-body text-muted-foreground text-sm">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {candidateFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check size={16} className="text-gold shrink-0" />
                  <span className="font-body text-sm text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="gold" size="lg" asChild>
              <Link to="/login?signup=candidate">Apply as Talent</Link>
            </Button>
          </div>

          {/* Employer Plan */}
          <div className="bg-foreground rounded-lg p-8 shadow-elevated flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gold/20 text-gold-light text-xs font-body font-medium">
              Full Access
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-charcoal-light/50 flex items-center justify-center">
                <Briefcase size={18} className="text-gold-light" />
              </div>
              <div>
                <h3 className="font-heading text-2xl text-background">Employer</h3>
                <p className="font-body text-xs text-background/50">For families & estates</p>
              </div>
            </div>
            <div className="mb-8">
              <span className="font-heading text-5xl text-background">$49.99</span>
              <span className="font-body text-background/50 text-sm">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {employerFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check size={16} className="text-gold-light shrink-0" />
                  <span className="font-body text-sm text-background/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="gold" size="lg" asChild>
              <Link to="/login?signup=employer">Apply as Employer</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-secondary/50 py-16 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl text-foreground mb-4">Questions about membership?</h2>
          <p className="font-body text-muted-foreground mb-6">
            We're happy to discuss which plan fits your needs.
          </p>
          <Button variant="outline" asChild>
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default Membership;
