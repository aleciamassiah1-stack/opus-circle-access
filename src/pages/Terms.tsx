import PageLayout from "@/components/layout/PageLayout";

const Terms = () => {
  const lastUpdated = "April 19, 2026";

  return (
    <PageLayout>
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12">
            <h1 className="font-heading text-5xl text-foreground mb-3">Terms of Service</h1>
            <p className="font-body text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-10 font-body text-foreground/80 leading-relaxed">
            <p className="text-sm italic text-muted-foreground">
              These Terms of Service ("Terms") are a placeholder draft and do not constitute legal advice.
              Please have them reviewed by qualified counsel before going live.
            </p>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm">
                By creating an account, accessing, or using Opulence Talent Collective ("OTC", "we", "us"),
                you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may
                not use the platform.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">2. Eligibility &amp; Membership</h2>
              <p className="text-sm">
                OTC is a private, invitation- and application-based network. All accounts — both Talent
                and Employer — are subject to admin review and approval. We reserve the right to deny,
                suspend, or revoke access at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">3. Subscriptions &amp; Billing</h2>
              <p className="text-sm">
                Paid memberships are billed monthly via our payment processor (Stripe). Talent membership
                is $14.99/month and Employer membership is $49.99/month. Subscriptions renew automatically
                until cancelled. You may cancel at any time from your account; cancellation takes effect at
                the end of the current billing period and prior charges are non-refundable except where
                required by law.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">4. Identity Verification</h2>
              <p className="text-sm">
                To maintain the integrity of the network, we may require government-issued identification
                or other verification documents. By submitting these documents, you represent that they
                are authentic and lawfully yours to provide. Verification documents are stored securely,
                accessed only by authorized administrators for review purposes, and retained no longer
                than reasonably necessary.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">5. Resumes &amp; Profile Content</h2>
              <p className="text-sm">
                You retain ownership of resumes, photos, and other content you upload. By uploading, you
                grant OTC a limited, non-exclusive license to host, display, and share that content with
                approved Employer members for the purpose of facilitating introductions. You are
                responsible for the accuracy of your profile and for not uploading content you do not
                have rights to share.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">6. Acceptable Use</h2>
              <p className="text-sm">
                You agree not to: (a) misrepresent your identity or credentials; (b) harass, discriminate
                against, or solicit other members outside the platform's intended use; (c) scrape,
                resell, or republish member data; (d) attempt to circumvent verification, payment, or
                access controls; (e) use the platform for unlawful purposes.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">7. Confidentiality</h2>
              <p className="text-sm">
                Member profiles, communications, and directory information are confidential to the OTC
                network. You agree not to disclose member information to non-members without consent.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">8. Termination</h2>
              <p className="text-sm">
                We may suspend or terminate your account at any time for breach of these Terms, fraudulent
                activity, or conduct harmful to the network. You may close your account at any time; some
                data may be retained as required by law or for legitimate record-keeping.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">9. Disclaimers</h2>
              <p className="text-sm">
                OTC is a connection platform. We do not employ Talent, do not guarantee placements, and
                are not a party to any engagement entered into between Talent and Employers. The platform
                is provided "as is" without warranties of any kind.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">10. Limitation of Liability</h2>
              <p className="text-sm">
                To the maximum extent permitted by law, OTC's aggregate liability arising out of or
                relating to these Terms or the platform shall not exceed the amounts you paid to OTC in
                the twelve months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">11. Changes to These Terms</h2>
              <p className="text-sm">
                We may update these Terms from time to time. Material changes will be communicated by
                email or via the platform. Continued use after changes take effect constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">12. Contact</h2>
              <p className="text-sm">
                Questions about these Terms? Reach us via the{" "}
                <a href="/contact" className="text-gold hover:underline">Contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Terms;
