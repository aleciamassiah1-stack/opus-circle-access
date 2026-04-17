import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Shield, LayoutDashboard, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/opulence-logo.png";

const navLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Membership", href: "/membership" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, profile, hasRole, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Opulence Talent Collective" className="h-8 [filter:brightness(0.15)_contrast(1.2)]" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-body font-medium tracking-wide transition-colors hover:text-gold ${
                location.pathname === link.href ? "text-gold" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-4">
            {user ? (
              <>
                {hasRole("candidate") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard" className="gap-1">
                      <LayoutDashboard size={14} />
                      Dashboard
                    </Link>
                  </Button>
                )}
                {hasRole("employer") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/employer" className="gap-1">
                      <Building2 size={14} />
                      Dashboard
                    </Link>
                  </Button>
                )}
                {hasRole("admin") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin" className="gap-1">
                      <Shield size={14} />
                      Admin
                    </Link>
                  </Button>
                )}
                <span className="font-body text-sm text-muted-foreground">
                  {profile?.first_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
                  <LogOut size={14} />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="gold" size="sm" asChild>
                  <Link to="/login">Apply Now</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-6 animate-fade-in">
          <div className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-body font-medium text-muted-foreground hover:text-gold transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <>
                  {hasRole("candidate") && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        <LayoutDashboard size={14} className="mr-1" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  {hasRole("employer") && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/employer" onClick={() => setMobileOpen(false)}>
                        <Building2 size={14} className="mr-1" />
                        Employer Dashboard
                      </Link>
                    </Button>
                  )}
                  {hasRole("admin") && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/admin" onClick={() => setMobileOpen(false)}>
                        <Shield size={14} className="mr-1" />
                        Admin Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut size={14} className="mr-1" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button variant="gold" size="sm" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>Apply Now</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
