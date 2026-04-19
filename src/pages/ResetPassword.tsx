import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase recovery flow: the link contains tokens in the URL hash and
    // onAuthStateChange fires PASSWORD_RECOVERY. We just wait for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    toast({ title: "Password updated" });
    setTimeout(() => navigate("/login", { replace: true }), 2000);
  };

  return (
    <PageLayout>
      <section className="py-24 px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl text-foreground mb-2">New Password</h1>
            <p className="font-body text-sm text-muted-foreground">Choose a new password for your account</p>
          </div>

          {done ? (
            <div className="bg-card rounded-lg p-8 shadow-card text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
                <CheckCircle2 className="text-gold" size={24} />
              </div>
              <h2 className="font-heading text-2xl text-foreground">Password updated</h2>
              <p className="font-body text-sm text-muted-foreground">Redirecting you to sign in…</p>
            </div>
          ) : !ready ? (
            <div className="bg-card rounded-lg p-8 shadow-card text-center">
              <p className="font-body text-sm text-muted-foreground">
                Verifying your reset link… If nothing happens, request a new link from the
                {" "}
                <a href="/forgot-password" className="text-gold hover:underline">forgot password</a> page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 shadow-card space-y-5">
              <div>
                <label className="font-body text-xs font-medium text-foreground mb-1.5 block">New password</label>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Confirm password</label>
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button variant="gold" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default ResetPassword;
