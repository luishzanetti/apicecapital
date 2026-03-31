import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline">Terms of Service</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground">Last updated: March 2026</p>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">1. Service Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Apice Capital is an educational platform and investment planning tool. The platform provides tools for portfolio tracking, Dollar-Cost Averaging (DCA) planning, market education, and AI-powered educational insights to help users learn about cryptocurrency investing.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This is NOT financial advice or an investment advisory service. Apice Capital does not hold, manage, or have access to your funds. All funds remain in the user's own exchange account (non-custodial). We provide educational tools and information only.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">2. Educational Nature of Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All content, recommendations, and tools provided by Apice Capital are educational in nature. This includes but is not limited to:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li>DCA recommendations are educational in nature and should not be construed as financial advice.</li>
            <li>AI Advisor provides educational insights, not financial advice. Any information provided by the AI Advisor is for informational and educational purposes only.</li>
            <li>Portfolio analysis and strategy suggestions are tools for learning, not directives for action.</li>
            <li>Market data and analytics are provided for educational context.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">3. User Responsibilities</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Users are responsible for their own investment decisions. By using Apice Capital, you acknowledge that:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li>You are solely responsible for any investment decisions you make.</li>
            <li>You should conduct your own research and, if necessary, consult with a qualified financial advisor before making investment decisions.</li>
            <li>You are responsible for safeguarding your account credentials and API keys.</li>
            <li>You must comply with all applicable laws and regulations in your jurisdiction regarding cryptocurrency trading and investing.</li>
            <li>You must be at least 18 years old to use this service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">4. Investment Risks</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Past performance does not guarantee future results. Cryptocurrency markets are highly volatile and investing in digital assets carries significant risk, including the potential loss of your entire investment. Prices can fluctuate widely and there is no guarantee that any strategy, including Dollar-Cost Averaging, will be profitable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">5. Non-Custodial Service</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Apice Capital is a non-custodial platform. We never hold, store, or have direct access to your cryptocurrency or fiat funds. When you connect an exchange account via API, the connection is used solely to read portfolio data and, if you enable it, execute trades on your behalf based on your configured DCA plans. All funds remain in your own exchange account at all times.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">6. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the maximum extent permitted by applicable law, Apice Capital and its affiliates, officers, employees, agents, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses, resulting from:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1.5 pl-2">
            <li>Your use of or inability to use the service.</li>
            <li>Any investment decisions made based on information provided by the platform.</li>
            <li>Unauthorized access to or alteration of your data or API keys.</li>
            <li>Any interruption or cessation of the service.</li>
            <li>Market volatility or exchange-related issues.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">7. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All content, features, and functionality of Apice Capital, including but not limited to text, graphics, logos, icons, software, and the overall design, are the exclusive property of Apice Capital and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without prior written consent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">8. Account Termination</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate your account at any time if we reasonably believe you have violated these Terms of Service, engaged in fraudulent or abusive behavior, or if required by law. You may also delete your account at any time by contacting our support team. Upon termination, your stored API keys will be permanently deleted from our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">9. Modifications to Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update these Terms of Service from time to time. We will notify users of any material changes via email or in-app notification. Your continued use of Apice Capital after changes are posted constitutes your acceptance of the revised terms. We encourage you to review these terms periodically.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">10. Governing Law</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through binding arbitration or in the courts of the applicable jurisdiction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">11. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at <span className="text-primary">support@apice.io</span>.
          </p>
        </section>

        <div className="pt-4 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Apice Capital v1.0.2 &mdash; Educational Platform &amp; Investment Planning Tool
          </p>
        </div>
      </div>
    </div>
  );
}
