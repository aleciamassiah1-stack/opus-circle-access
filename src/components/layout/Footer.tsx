import { Link } from "react-router-dom";
import logo from "@/assets/otc-mark-light.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 pb-safe pl-safe pr-safe">
      <div className="container mx-auto px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          <div className="md:col-span-2">
            <img src={logo} alt="Opulence Talent Collective" className="h-16 w-16 mb-4 object-contain" />
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
        <div className="border-t border-background/10 mt-10 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40 text-center md:text-left">
            © {new Date().getFullYear()} Opulence Talent Collective. All rights reserved.
          </p>
          <div className="flex items-center gap-4 md:gap-5 flex-wrap justify-center">
            <Link to="/terms" className="text-xs text-background/60 hover:text-gold-light transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-xs text-background/60 hover:text-gold-light transition-colors">
              Privacy Policy
            </Link>
            <span className="text-xs text-background/40">Private &amp; Confidential</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
