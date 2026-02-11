import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeDescriptions } from '@/store/appStore';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  CreditCard,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
  Moon,
  Bell,
  Link2,
  LogOut,
  Lock,
  Star,
  ExternalLink
} from 'lucide-react';
import { referralLinks } from '@/data/sampleData';

export default function Profile() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const investorType = useAppStore((s) => s.investorType);
  const subscription = useAppStore((s) => s.subscription);
  const unlockState = useAppStore((s) => s.unlockState);
  const linkClicks = useAppStore((s) => s.linkClicks);
  const resetApp = useAppStore((s) => s.resetApp);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);

  const handleLogout = async () => {
    await signOut();
    resetApp();
    navigate('/auth', { replace: true });
  };

  const description = investorType ? investorTypeDescriptions[investorType] : null;

  const lockedFeatures = [
    { name: 'Optimized Portfolios', locked: !unlockState.optimizedPortfolios },
    { name: 'Explosive List', locked: !unlockState.explosiveList },
    { name: 'Premium Insights', locked: !unlockState.premiumInsights },
    { name: 'AI Trade Guides', locked: !unlockState.aiTradeGuides },
    { name: 'Copy Portfolios', locked: !unlockState.copyPortfolios },
    { name: 'Community Access', locked: !unlockState.community },
  ].filter(f => f.locked);

  const menuItems = [
    { icon: CreditCard, label: 'Subscription & Plans', action: () => navigate('/upgrade') },
    { icon: Link2, label: 'Referral Links', action: () => navigate('/links') },
    { icon: Shield, label: 'Security Center', action: () => navigate('/support') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/support') },
    { icon: FileText, label: 'Legal & Risk Disclaimers', action: () => navigate('/support') },
  ];

  const settingsItems = [
    { icon: Moon, label: 'Appearance', value: 'Dark' },
    { icon: Bell, label: 'Notifications', value: 'On' },
  ];

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
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
            <h1 className="text-xl font-bold">{investorType || 'Investor'}</h1>
            {user?.email && (
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            )}
            <Badge
              variant={subscription.tier === 'free' ? 'outline' : 'premium'}
              size="sm"
              className="mt-1"
            >
              {subscription.tier === 'free' ? 'Free Plan' : `${subscription.tier.toUpperCase()} Member`}
            </Badge>
          </div>
        </div>

        {/* Profile Summary */}
        {description && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">Your Profile</h3>
              <p className="text-sm text-muted-foreground">{description.wants}</p>
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA */}
        {subscription.tier === 'free' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl apice-gradient-gold flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Unlock all portfolios, automation guides, and premium insights.
                  </p>
                  <Button variant="gold" size="sm" onClick={() => navigate('/upgrade')}>
                    View Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Links Manager */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Referral Links
          </h2>
          <div className="space-y-2">
            {referralLinks.map((link) => {
              const isClicked = link.id === 'bybit' ? linkClicks.bybitClicked : 
                               link.id === 'ai-bot' ? linkClicks.aiBotClicked : 
                               linkClicks.aiTradeClicked;
              return (
                <Card
                  key={link.id}
                  className="cursor-pointer hover:border-primary/20 transition-colors"
                  onClick={() => {
                    if (link.id === 'bybit') trackLinkClick('bybit');
                    else if (link.id === 'ai-bot') trackLinkClick('aiBot');
                    else trackLinkClick('aiTrade');
                    window.open(link.url, '_blank');
                  }}
                >
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{link.name}</span>
                        <p className="text-xs text-muted-foreground">{link.description}</p>
                      </div>
                      <Badge variant={isClicked ? 'low' : 'outline'} size="sm">
                        {isClicked ? 'Clicked' : 'Open'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Locked Features */}
        {lockedFeatures.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Locked Features ({lockedFeatures.length})
            </h2>
            <Card>
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
              className="cursor-pointer hover:border-primary/20 transition-colors"
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
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Settings
          </h2>
          <Card>
            <CardContent className="pt-0 pb-0 divide-y divide-border">
              {settingsItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.value}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da conta
        </Button>

        {/* Version */}
        <p className="text-center text-[10px] text-muted-foreground pt-4">
          Apice v1.0.0 • Built with discipline
        </p>
      </motion.div>
    </div>
  );
}
