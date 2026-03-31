import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground">Last updated: March 2026</p>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Apice Capital collects the following types of information to provide and improve our services:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-foreground font-medium">Email address</span> &mdash; Used for account creation, authentication, and communication.</li>
            <li><span className="text-foreground font-medium">Investment preferences</span> &mdash; Risk tolerance, investment goals, and profile quiz responses used to personalize your experience.</li>
            <li><span className="text-foreground font-medium">Exchange API keys</span> &mdash; Provided optionally to enable portfolio tracking and DCA automation via your exchange account.</li>
            <li><span className="text-foreground font-medium">Usage data</span> &mdash; Pages visited, features used, and interaction patterns to improve the platform.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">2. How API Keys Are Stored</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your exchange API keys are treated with the highest level of security:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li>API secrets are encrypted before being stored on our servers.</li>
            <li>Encryption is performed client-side before transmission and server-side at rest.</li>
            <li>API keys are stored server-side only and are never exposed in client-side code or logs.</li>
            <li>We recommend using API keys with minimal permissions (read-only + spot trade only).</li>
            <li>You can disconnect and delete your API keys at any time from Settings.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">3. How We Use Your Data</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use the information we collect for the following purposes:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-foreground font-medium">Personalization</span> &mdash; Tailoring DCA strategies, educational content, and portfolio insights based on your investor profile.</li>
            <li><span className="text-foreground font-medium">AI Recommendations</span> &mdash; Providing AI-powered educational insights through our AI Advisor feature.</li>
            <li><span className="text-foreground font-medium">Portfolio tracking</span> &mdash; Displaying your exchange balances and transaction history.</li>
            <li><span className="text-foreground font-medium">DCA automation</span> &mdash; Executing your configured Dollar-Cost Averaging plans on your connected exchange.</li>
            <li><span className="text-foreground font-medium">Service improvement</span> &mdash; Analyzing usage patterns to enhance features and fix issues.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">4. Third-Party Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Apice Capital integrates with the following third-party services:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-foreground font-medium">Supabase</span> &mdash; Authentication, database, and backend infrastructure. Your account data and encrypted credentials are stored on Supabase's secure infrastructure.</li>
            <li><span className="text-foreground font-medium">Anthropic Claude</span> &mdash; Powers the AI Advisor feature. Your investment preferences and portfolio context may be sent to Claude to generate personalized educational insights. No API keys or sensitive credentials are shared with this service.</li>
            <li><span className="text-foreground font-medium">Bybit API</span> &mdash; Used to connect your exchange account for portfolio tracking and DCA execution. Communication is done via encrypted API calls using your provided keys.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each third-party service has its own privacy policy. We encourage you to review their policies as well.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">5. Data Retention and Deletion</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain your data for as long as your account is active or as needed to provide our services. You may request data deletion at any time:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li>API keys can be disconnected and deleted immediately from Settings.</li>
            <li>Account deletion can be requested by contacting support. Upon deletion, all personal data, preferences, and stored credentials will be permanently removed within 30 days.</li>
            <li>Anonymized usage analytics may be retained for service improvement purposes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">6. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have the following rights regarding your personal data:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-foreground font-medium">Access</span> &mdash; You can request a copy of all personal data we hold about you.</li>
            <li><span className="text-foreground font-medium">Correction</span> &mdash; You can update your investment preferences and profile information at any time through the app.</li>
            <li><span className="text-foreground font-medium">Deletion</span> &mdash; You can request complete deletion of your account and all associated data.</li>
            <li><span className="text-foreground font-medium">Portability</span> &mdash; You can request your data in a portable format.</li>
            <li><span className="text-foreground font-medium">Restriction</span> &mdash; You can request that we limit the processing of your data in certain circumstances.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To exercise any of these rights, contact us at <span className="text-primary">support@apice.io</span>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">7. Cookies and Local Storage</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Apice Capital uses localStorage (browser local storage) to store your app preferences, theme settings, and session data. We do not use third-party tracking cookies. Essential session cookies may be used for authentication purposes through Supabase.
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-foreground font-medium">localStorage</span> &mdash; Stores preferences such as risk tolerance, display settings, and onboarding progress. This data stays on your device.</li>
            <li><span className="text-foreground font-medium">Session cookies</span> &mdash; Used for authentication and maintaining your login state. These are essential for the service to function.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">8. Security Measures</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL), encryption at rest for sensitive data, row-level security on our database, and regular security audits. However, no method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">9. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes via email or in-app notification. Your continued use of Apice Capital after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">10. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy or our data practices, please contact us at <span className="text-primary">support@apice.io</span>.
          </p>
        </section>

        <div className="pt-4 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Apice Capital v1.0.2 &mdash; Your privacy is our priority
          </p>
        </div>
      </div>
    </div>
  );
}
