import PageLayout from "@/components/layout/PageLayout";

const Privacy = () => {
  const lastUpdated = "April 19, 2026";

  return (
    <PageLayout>
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12">
            <h1 className="font-heading text-5xl text-foreground mb-3">Privacy Policy</h1>
            <p className="font-body text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-10 font-body text-foreground/80 leading-relaxed">
            <p className="text-sm italic text-muted-foreground">
              This Privacy Policy is a placeholder draft and does not constitute legal advice.
              Please have it reviewed by qualified counsel before going live.
            </p>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">1. Who We Are</h2>
              <p className="text-sm">
                Opulence Talent Collective ("OTC", "we") operates a private membership platform connecting
                vetted Talent with Employers in hospitality, private estates, and family offices. This
                policy explains how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">2. Information We Collect</h2>
              <ul className="text-sm list-disc pl-5 space-y-2">
                <li><strong>Account data:</strong> name, email, password (hashed), role.</li>
                <li><strong>Profile data:</strong> headline, bio, location, years of experience, work authorization, job titles, specialty tags, availability, avatar, and (for Employers) company details.</li>
                <li><strong>Resume &amp; documents:</strong> resumes you upload and any AI-generated summaries derived from them.</li>
                <li><strong>Verification documents:</strong> government-issued ID submitted for identity verification.</li>
                <li><strong>Payment data:</strong> billing information is collected and stored by our payment processor (Stripe). We store only subscription metadata (status, period, customer ID).</li>
                <li><strong>Communications:</strong> messages you send through the platform, contact form submissions, and email correspondence.</li>
                <li><strong>Usage data:</strong> log data, device info, and basic analytics needed to operate and secure the service.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="text-sm list-disc pl-5 space-y-2">
                <li>To operate the platform — create accounts, display profiles to approved Employers, facilitate messaging and interview requests.</li>
                <li>To verify identity and admit members to the network.</li>
                <li>To process subscription payments and send transactional emails (verification, password resets, notifications).</li>
                <li>To improve the platform, prevent fraud, and enforce our Terms.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">4. How Information Is Shared</h2>
              <p className="text-sm">
                Talent profiles are visible only to <strong>approved Employer members</strong> with active
                subscriptions. Resume files are released only when you approve an Employer's resume access
                request. We do not sell your personal information. We share data with service providers
                that help us run the platform (hosting, payments, email, analytics) under contractual
                obligations to protect it.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">5. Verification Documents</h2>
              <p className="text-sm">
                Government-issued IDs are stored in a private, access-controlled storage bucket. They are
                viewable only by authorized OTC administrators for the purpose of reviewing your
                application. We retain verification documents only as long as reasonably necessary and
                will delete them upon request, subject to any legal retention requirements.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">6. Resumes &amp; AI Processing</h2>
              <p className="text-sm">
                Resumes you upload may be processed by AI services to generate a short professional
                summary that helps Employers evaluate fit. AI processing is performed under provider
                agreements that prohibit using your data to train public models. You can remove your
                resume at any time from your profile.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">7. Data Retention</h2>
              <p className="text-sm">
                We retain account and profile data while your account is active. If you deactivate your
                account, certain data is scheduled for purge after a defined window. Some records (e.g.,
                billing, audit logs) may be retained longer to comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">8. Your Rights</h2>
              <p className="text-sm">
                Depending on your jurisdiction, you may have rights to access, correct, export, or delete
                your personal information, and to object to or restrict certain processing. To exercise
                these rights, contact us via the Contact page.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">9. Security</h2>
              <p className="text-sm">
                We use industry-standard safeguards including encryption in transit, hashed passwords,
                row-level security on member data, and access controls on private files. No system is
                perfectly secure, but we work continuously to protect your information.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">10. International Users</h2>
              <p className="text-sm">
                Your information may be processed in countries other than your own. By using OTC you
                consent to such transfers, subject to appropriate safeguards.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">11. Children</h2>
              <p className="text-sm">
                OTC is not intended for individuals under 18, and we do not knowingly collect data from
                children.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">12. Changes</h2>
              <p className="text-sm">
                We may update this Privacy Policy from time to time. Material changes will be communicated
                by email or via the platform.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-foreground mb-3">13. Contact</h2>
              <p className="text-sm">
                Privacy questions or requests? Reach us via the{" "}
                <a href="/contact" className="text-gold hover:underline">Contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Privacy;
