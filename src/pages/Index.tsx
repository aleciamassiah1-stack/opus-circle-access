import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import heroImage from "@/assets/hero-professionals.jpg";
import { Shield, Users, Eye, ArrowRight, Star, Lock, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading, hasRole } = useAuth();

  if (!loading && user) {
    if (hasRole("admin")) return <Navigate to="/admin" replace />;
    if (hasRole("employer")) return <Navigate to="/employer" replace />;
    if (hasRole("candidate")) return <Navigate to="/talent" replace />;
  }

  return (
    <PageLayout>
      {/* Hero — Split Screen */}
      <section className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2">
        {/* Left Content */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-20 animate-slide-in-left">
          <p className="font-heading text-xl text-gold mb-4 tracking-wide">Opulence Talent Collective</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-body font-medium tracking-widest uppercase mb-8 w-fit">
            <Crown size={14} className="text-gold" />
            Members-Only Network
          </div>
          <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl text-foreground leading-[1.05] mb-6">
            Where Elite Talent
            <br />
            Meets <span className="text-gradient-gold">Distinction</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg max-w-md leading-relaxed mb-10">
            A private, talent-first platform for hospitality, private estate, and family office professionals—<strong className="text-foreground">individually vetted</strong> and positioned for visibility with employers who expect nothing less.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="gold" size="lg" asChild>
              <Link to="/login">
                Apply as Talent
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/login">Employer Access</Link>
            </Button>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative hidden lg:block animate-slide-in-right">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/20 z-10" />
          <img
            src={heroImage}
            alt="Luxury private estate interior"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-secondary/50">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, label: "Every Talent Vetted", desc: "Resumes, credentials, and identity reviewed" },
              { icon: Lock, label: "Private & Secure", desc: "Not indexed, not public, invitation-grade" },
              { icon: Star, label: "Premium Talent", desc: "UHNW, estates, yachts & hospitality" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <item.icon size={20} className="text-gold" />
                <span className="font-body text-sm font-semibold text-foreground">{item.label}</span>
                <span className="font-body text-xs text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center mb-16">
          <h2 className="font-heading text-4xl lg:text-5xl text-foreground mb-4">
            A Private Network, <span className="text-gradient-gold">Curated With Care</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">
            We connect discerning employers with exceptional talent — no public listings, 
            no noise, just meaningful connections.
          </p>
        </div>

        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          {[
            {
              icon: Users,
              title: "Apply & Get Vetted",
              description: "Submit your application. Our team reviews every applicant to ensure quality and discretion.",
              step: "01",
            },
            {
              icon: Eye,
              title: "Showcase Your Profile",
              description: "Create a rich profile highlighting your experience, specialties, and availability for the right roles.",
              step: "02",
            },
            {
              icon: Shield,
              title: "Connect Privately",
              description: "Approved employers browse talent and send direct inquiries. Everything stays confidential.",
              step: "03",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group relative bg-card rounded-lg p-8 shadow-card hover:shadow-elevated transition-all duration-300"
            >
              <span className="font-heading text-6xl text-gold/10 absolute top-4 right-6">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-5">
                <item.icon size={18} className="text-gold" />
              </div>
              <h3 className="font-heading text-xl text-foreground mb-3">{item.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-hero py-24 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-4xl lg:text-5xl text-background mb-4">
            Ready to Join?
          </h2>
          <p className="font-body text-background/60 text-lg mb-10 max-w-xl mx-auto">
            Whether you're exceptional talent seeking visibility or an employer 
            seeking the extraordinary — your place is here.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="gold" size="lg" asChild>
              <Link to="/login">
                Get Started
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="text-background/80 hover:text-background hover:bg-background/10" asChild>
              <Link to="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
