import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send reset email", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Check your email", description: "We sent you a password reset link." });
    }
  };

  return (
    <PageLayout>
      <section className="py-24 px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl text-foreground mb-2">Reset Password</h1>
            <p className="font-body text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="bg-card rounded-lg p-8 shadow-card text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
                <Mail className="text-gold" size={24} />
              </div>
              <h2 className="font-heading text-2xl text-foreground">Email sent</h2>
              <p className="font-body text-sm text-muted-foreground">
                If an account exists for <span className="text-foreground">{email}</span>, you'll receive a reset link shortly.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 shadow-card space-y-5">
              <div>
                <label className="font-body text-xs font-medium text-foreground mb-1.5 block">Email</label>
                <Input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button variant="gold" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
              <Link
                to="/login"
                className="block text-center font-body text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default ForgotPassword;
