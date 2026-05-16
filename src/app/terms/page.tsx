export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-16" style={{ background: "#07070d", color: "#e5e5e5" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-neutral-400">

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using LeadMine (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
            <p>LeadMine is a software platform that helps real estate professionals identify, qualify, and follow up with property leads using AI-driven automation and data sources including county assessor records, public listing data, and skip-trace enrichment.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Account Registration</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Subscription & Billing</h2>
            <p>Paid plans are billed in advance on a recurring basis through Stripe. Subscriptions automatically renew until canceled. You may cancel at any time from your account settings; cancellation takes effect at the end of the current billing period. No refunds are issued for partial billing periods.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Acceptable Use</h2>
            <p>You agree to use the Service in compliance with all applicable laws, including but not limited to the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, state Do Not Call regulations, and Fair Housing laws. You are solely responsible for ensuring that any outreach you conduct through the Service complies with these laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Lead Data & Third-Party Sources</h2>
            <p>Lead data made available through the Service is sourced from public records and licensed third-party providers. We do not guarantee the accuracy, completeness, or current status of any lead. You are responsible for verifying lead information before contacting any individual.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. AI-Generated Content</h2>
            <p>The Service uses AI to draft outreach messages, summaries, and other content. You are responsible for reviewing all AI-generated content before sending or publishing it. We make no warranty about the accuracy or appropriateness of AI-generated output.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Intellectual Property</h2>
            <p>All software, branding, and content created by LeadMine remain our property. You retain ownership of any data, leads, or content you upload to the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Limitation of Liability</h2>
            <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, LeadMine is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the twelve months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Termination</h2>
            <p>We may suspend or terminate your account if you violate these Terms, abuse the Service, or use it for unlawful purposes. You may terminate your account at any time by canceling your subscription and contacting support.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be communicated via email or in-app notice. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">12. Contact</h2>
            <p>Questions about these Terms? Email us at <a href="mailto:support@leadmineapp.com" className="text-emerald-400 hover:underline">support@leadmineapp.com</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-neutral-600">© 2026 LeadMine. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}