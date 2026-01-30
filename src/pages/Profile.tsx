import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeTraits } from '@/store/appStore';
import { 
  User, 
  CreditCard, 
  Shield, 
  HelpCircle, 
  FileText, 
  ChevronRight,
  Moon,
  Bell,
  Globe,
  LogOut,
  Lock,
  Star
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const subscription = useAppStore((s) => s.subscription);
  const unlockState = useAppStore((s) => s.unlockState);
  const resetApp = useAppStore((s) => s.resetApp);

  const traits = investorType ? investorTypeTraits[investorType] : [];

  const lockedFeatures = [
    { name: 'Advanced Strategies', locked: !unlockState.advancedStrategies },
    { name: 'Premium Insights', locked: !unlockState.premiumInsights },
    { name: 'Performance Reports', locked: !unlockState.performanceReports },
    { name: 'AI Bot Access', locked: !unlockState.aiBot },
    { name: 'Copy Portfolios', locked: !unlockState.copyPortfolios },
    { name: 'Community Access', locked: !unlockState.community },
    { name: 'Capital Optimization', locked: !unlockState.capitalOptimization },
  ].filter(f => f.locked);

  const menuItems = [
    { icon: CreditCard, label: 'Subscription & Plans', action: () => navigate('/upgrade') },
    { icon: Shield, label: 'Security Center', action: () => navigate('/security') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/support') },
    { icon: FileText, label: 'Legal & Risk Disclaimers', action: () => navigate('/legal') },
  ];

  const settingsItems = [
    { icon: Moon, label: 'Appearance', value: 'Dark' },
    { icon: Bell, label: 'Notifications', value: 'On' },
    { icon: Globe, label: 'Language', value: 'English' },
  ];

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl apice-gradient-primary flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-headline">{investorType || 'Investor'}</h1>
            <Badge 
              variant={subscription.tier === 'free' ? 'outline' : 'premium'} 
              size="sm"
              className="mt-1"
            >
              {subscription.tier === 'free' ? 'Free Plan' : `${subscription.tier.toUpperCase()} Member`}
            </Badge>
          </div>
        </div>

        {/* Profile Traits */}
        {traits.length > 0 && (
          <Card variant="elevated">
            <CardContent className="pt-4 pb-4">
              <h3 className="font-medium text-sm mb-3">Your Profile</h3>
              <div className="flex flex-wrap gap-2">
                {traits.map((trait, i) => (
                  <Badge key={i} variant="secondary" size="sm">
                    {trait}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA */}
        {subscription.tier === 'free' && (
          <Card variant="premium">
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl apice-gradient-gold flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
                  <p className="text-caption text-muted-foreground mb-3">
                    Unlock all strategies, premium insights, and advanced automation.
                  </p>
                  <Button variant="gold" size="sm" onClick={() => navigate('/upgrade')}>
                    View Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locked Features */}
        {lockedFeatures.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Locked Features ({lockedFeatures.length})
            </h2>
            <Card variant="glass">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {lockedFeatures.map((feature, i) => (
                    <Badge key={i} variant="locked" size="sm" className="gap-1">
                      <Lock className="w-3 h-3" />
                      {feature.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <Card
              key={i}
              variant="interactive"
              onClick={item.action}
            >
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Settings
          </h2>
          <Card variant="default">
            <CardContent className="pt-0 pb-0 divide-y divide-border">
              {settingsItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="text-caption text-muted-foreground">{item.value}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Logout / Reset */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            resetApp();
            navigate('/splash');
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Reset App
        </Button>

        {/* Version */}
        <p className="text-center text-micro text-muted-foreground pt-4">
          Apice v1.0.0 • Made with precision
        </p>
      </motion.div>
    </div>
  );
}
