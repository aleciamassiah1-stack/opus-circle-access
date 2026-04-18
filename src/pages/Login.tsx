import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const destinationForRoles = (roles: string[]): string => {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("employer")) return "/employer";
  if (roles.includes("candidate")) return "/dashboard";
  return "/";
};

type AuthView = "login" | "signup-candidate" | "signup-employer";

const Login = () => {
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp, user, roles } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in — send to the right home for their role
  useEffect(() => {
    if (user) {
      navigate(destinationForRoles(roles), { replace: true });
    }
  }, [user, roles, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (view === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Welcome back!" });
        // Roles aren't yet hydrated in context — query directly so we route correctly.
        const { data: sessionData } = await supabase.auth.getUser();
        const uid = sessionData.user?.id;
        let dest = "/";
        if (uid) {
          const { data: roleRows } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", uid);
          dest = destinationForRoles((roleRows ?? []).map((r) => r.role));
        }
        navigate(dest, { replace: true });
      }
    } else {
      const role = view === "signup-candidate" ? "candidate" : "employer";
      const { error } = await signUp(email, password, { first_name: firstName, last_name: lastName, role });
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    }

    setSubmitting(false);
  };

  return (
    <PageLayout>
      <section className="py-24 px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl text-foreground mb-2">
              {view === "login" ? "Welcome Back" : view === "signup-candidate" ? "Apply as Talent" : "Employer Access"}
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              {view === "login"
                ? "Sign in to your account"
                : "Create your account to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 shadow-card space-y-5">
            {view !== "login" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs font-medium text-foreground mb-1.5 block">First Name</label>
                  <Input required placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Last Name</label>
                  <Input required placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Email</label>
              <Input required type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button variant="gold" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : view === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {view === "login" ? (
              <>
                <p className="font-body text-sm text-muted-foreground">
                  Don't have an account?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setView("signup-candidate")}>
                    Apply as Talent
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setView("signup-employer")}>
                    Employer Access
                  </Button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setView("login")}
                className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Login;
