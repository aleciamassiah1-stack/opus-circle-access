import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="font-heading text-3xl text-background mb-4">
              Opulence<span className="text-gold-light">.</span>
            </h3>
            <p className="font-body text-sm text-background/60 max-w-sm leading-relaxed">
              A private network connecting exceptional talent with discerning employers 
              in hospitality, private estates, and family offices.
            </p>
          </div>
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-widest text-background/40 mb-4">
              Platform
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/how-it-works" className="text-sm text-background/60 hover:text-gold-light transition-colors">
                How It Works
              </Link>
              <Link to="/membership" className="text-sm text-background/60 hover:text-gold-light transition-colors">
                Membership
              </Link>
              <Link to="/contact" className="text-sm text-background/60 hover:text-gold-light transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-widest text-background/40 mb-4">
              Access
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/login" className="text-sm text-background/60 hover:text-gold-light transition-colors">
                Sign In
              </Link>
              <Link to="/login" className="text-sm text-background/60 hover:text-gold-light transition-colors">
                Apply as Talent
              </Link>
              <Link to="/login" className="text-sm text-background/60 hover:text-gold-light transition-colors">
                Employer Access
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} Opulence Talent Collective. All rights reserved.
          </p>
          <p className="text-xs text-background/40">
            Private & Confidential
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
