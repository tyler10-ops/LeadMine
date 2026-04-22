export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-16" style={{ background: "#07070d", color: "#e5e5e5" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-neutral-400">

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account, including your name, email address, and business information. We also collect usage data to improve the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve LeadMine services, process payments, send product updates, and communicate with you about your account. We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Data Storage</h2>
            <p>Your data is stored securely using industry-standard encryption. We use Supabase for database storage and Vercel for hosting, both of which maintain high security standards.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Third-Party Services</h2>
            <p>LeadMine integrates with third-party services including Stripe (payments), Google (authentication), Resend (email), and VAPI (AI calling). Each service has its own privacy policy governing their use of data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Cookies</h2>
            <p>We use cookies to maintain your session and improve your experience. You can disable cookies in your browser settings, though this may affect platform functionality.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal data at any time. To request data deletion, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Contact</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@leadmineapp.com" className="text-emerald-400 hover:underline">support@leadmineapp.com</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-neutral-600">© 2026 LeadMine. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}