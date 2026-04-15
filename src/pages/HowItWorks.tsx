import PageLayout from "@/components/layout/PageLayout";
import { Shield, UserCheck, Search, MessageSquare, CreditCard, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: UserCheck,
    title: "Apply for Membership",
    candidateDesc: "Submit your application with your background, experience, and specialties. Our team reviews every submission personally.",
    employerDesc: "Tell us about your organization and staffing needs. We verify all employers to maintain platform integrity.",
  },
  {
    icon: Shield,
    title: "Get Approved",
    candidateDesc: "Once vetted, you'll receive access to create your full profile and become visible to approved employers.",
    employerDesc: "After verification, you'll gain access to our curated talent directory of pre-vetted professionals.",
  },
  {
    icon: CreditCard,
    title: "Activate Your Membership",
    candidateDesc: "Subscribe to make your profile visible. Your profile stays private until your membership is active.",
    employerDesc: "Subscribe to browse and connect with talent. Access the full directory and send inquiries directly.",
  },
  {
    icon: Eye,
    title: "Build Your Profile",
    candidateDesc: "Craft a compelling profile with your experience, skills, certifications, and availability status.",
    employerDesc: "Set up your organization profile so candidates know who they're connecting with.",
  },
  {
    icon: Search,
    title: "Get Discovered / Discover Talent",
    candidateDesc: "Sit back as verified employers browse your profile. You're in control of your visibility and responses.",
    employerDesc: "Search and filter candidates by role, experience type, location, and availability.",
  },
  {
    icon: MessageSquare,
    title: "Connect Privately",
    candidateDesc: "Receive inquiries from employers. Accept or decline at your discretion — always on your terms.",
    employerDesc: "Send interview requests directly. Candidates respond at their pace, ensuring genuine interest.",
  },
];

const HowItWorks = () => {
  return (
    <PageLayout>
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center mb-20">
          <h1 className="font-heading text-5xl lg:text-6xl text-foreground mb-6">
            How It <span className="text-gradient-gold">Works</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            A simple, intentional process designed to maintain the exclusivity 
            and quality our members expect.
          </p>
        </div>

        <div className="container mx-auto max-w-5xl space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-6 md:gap-10 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <step.icon size={20} className="text-gold" />
                </div>
                <span className="font-heading text-sm text-muted-foreground">Step {i + 1}</span>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-card">
                <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gold mb-2">For Talent</h3>
                <h4 className="font-heading text-xl text-foreground mb-2">{step.title}</h4>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.candidateDesc}</p>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-card">
                <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gold mb-2">For Employers</h3>
                <h4 className="font-heading text-xl text-foreground mb-2">{step.title}</h4>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.employerDesc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-hero py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-4xl text-background mb-4">Begin Your Journey</h2>
          <p className="font-body text-background/60 mb-8">Apply today and join a network built on trust, discretion, and excellence.</p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/login">Apply Now</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default HowItWorks;
