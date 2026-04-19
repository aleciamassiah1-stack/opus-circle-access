import PageLayout from "@/components/layout/PageLayout";
import { UserCircle, CreditCard, ClipboardCheck, BadgeCheck, MessageSquare, Building2, Search, Handshake, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const candidateSteps = [
  {
    icon: UserCircle,
    title: "Create Your Profile",
    desc: "Sign up and build a professional profile that reflects your experience, specialties, and the environments you've worked in. Upload your resume, highlight your skills, and position yourself for the right opportunities.",
  },
  {
    icon: CreditCard,
    title: "Activate Your Membership",
    desc: "Talent join OTC through a monthly membership of $14.99, which enables profile visibility within our private network.",
  },
  {
    icon: ClipboardCheck,
    title: "Submit for Review",
    desc: "Each profile is reviewed to ensure quality and alignment with the standards of the platform. This includes resume review and verification checks where applicable.",
  },
  {
    icon: BadgeCheck,
    title: "Get Verified",
    desc: "Once approved, your profile becomes visible to employers and may receive a Verified designation, signaling credibility and trust within the network.",
  },
  {
    icon: MessageSquare,
    title: "Connect with Employers",
    desc: "Employers can discover your profile, reach out directly, and request interviews. You'll be able to manage conversations, respond to opportunities, and control your visibility at any time.",
  },
];

const employerSteps = [
  {
    icon: Building2,
    title: "Create an Account",
    desc: "Employers sign up with instant access to the platform. No vetting queue — your time matters. Talent on the other side of the network has been individually screened so you don't have to.",
  },
  {
    icon: CreditCard,
    title: "Unlock Access",
    desc: "Employers join OTC through a monthly membership of $49.99, which provides full access to the talent directory and communication features.",
  },
  {
    icon: Search,
    title: "Search & Discover Talent",
    desc: "Browse a refined database of talent and filter by role, experience, and specialty. Each profile is designed to give you a clear, concise understanding of a talent's background and capabilities.",
  },
  {
    icon: Handshake,
    title: "Connect Directly",
    desc: "Message talent, request interviews, and initiate conversations—all within the platform. OTC is designed to streamline communication and reduce friction in the hiring process.",
  },
  {
    icon: Users,
    title: "Build Your Team with Confidence",
    desc: "With structured profiles and a curated network, OTC allows you to identify, evaluate, and connect with talent efficiently and confidently.",
  },
];

const StepList = ({ steps, label }: { steps: typeof candidateSteps; label: string }) => (
  <div className="space-y-6">
    {steps.map((step, i) => (
      <div key={i} className="bg-card rounded-lg p-6 md:p-8 shadow-card hover:shadow-elevated transition-all duration-300 flex gap-5">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <step.icon size={20} className="text-gold" />
          </div>
          <span className="font-heading text-2xl text-gold/40">{i + 1}</span>
        </div>
        <div className="flex-1">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold mb-1">
            {label} · Step {i + 1}
          </p>
          <h4 className="font-heading text-xl md:text-2xl text-foreground mb-2">{step.title}</h4>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

const HowItWorks = () => {
  return (
    <PageLayout>
      {/* Intro */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-4 font-body">Opulence Talent Collective</p>
          <h1 className="font-heading text-5xl lg:text-6xl text-foreground mb-6">
            How It <span className="text-gradient-gold">Works</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Opulence Talent Collective is a private, membership-based platform designed to connect 
            vetted hospitality and private household professionals with families, estates, and employers 
            seeking exceptional talent.
          </p>
        </div>
      </section>

      {/* For Talent */}
      <section className="px-6 pb-20">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <UserCircle size={20} className="text-gold" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground">For Talent</h2>
          </div>
          <StepList steps={candidateSteps} label="Talent" />
        </div>
      </section>

      {/* For Employers */}
      <section className="bg-secondary/30 py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Building2 size={20} className="text-gold" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground">For Employers</h2>
          </div>
          <StepList steps={employerSteps} label="Employer" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-hero py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-4xl text-background mb-4">Begin Your Journey</h2>
          <p className="font-body text-background/60 mb-8">
            Apply today and join a network built on trust, discretion, and excellence.
          </p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/login">Apply Now</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default HowItWorks;
