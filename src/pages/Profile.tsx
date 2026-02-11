import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeDescriptions } from '@/store/appStore';
import { useAuth } from '@/components/AuthProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  User,
  CreditCard,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  Lock,
  Star,
  ExternalLink,
  Loader2,
  Save,
  Mail
} from 'lucide-react';
import { referralLinks } from '@/data/sampleData';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userProfile = useAppStore((s) => s.userProfile);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const calculateInvestorType = useAppStore((s) => s.calculateInvestorType);
  const investorType = useAppStore((s) => s.investorType);
  const subscription = useAppStore((s) => s.subscription);
  const unlockState = useAppStore((s) => s.unlockState);
  const linkClicks = useAppStore((s) => s.linkClicks);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const daysActive = useAppStore((s) => s.daysActive);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState({
    goal: userProfile.goal || 'balanced',
    experience: userProfile.experience || 'intermediate',
    riskTolerance: userProfile.riskTolerance || 'medium',
    capitalRange: userProfile.capitalRange || '200-1k'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update store (which syncs to Supabase)
      updateUserProfile({
        goal: formData.goal as any,
        experience: formData.experience as any,
        riskTolerance: formData.riskTolerance as any,
        capitalRange: formData.capitalRange as any
      });

      // Recalculate type based on new data
      calculateInvestorType();

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
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
    { icon: Link2, label: 'Referral Links', action: () => navigate('/links') }, // Assuming this route exists or we use modal logic
    { icon: Shield, label: 'Security Center', action: () => navigate('/support') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/support') },
    { icon: FileText, label: 'Legal & Risk Disclaimers', action: () => navigate('/support') },
  ];

  // Custom Link2 icon component to avoid import conflict if needed, or just import it
  // Re-checking imports: Link2 is in lucide-react. Added it to imports.

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header Profile Card */}
        <Card className="border-none bg-secondary/30">
          <CardContent className="pt-6 pb-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full apice-gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold truncate">{user?.email?.split('@')[0] || 'Member'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {daysActive} Days Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Tier */}
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Current Plane</span>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {subscription.tier.toUpperCase()} MEMBER
            </span>
          </div>
          {subscription.tier === 'free' && (
            <Button variant="premium" size="sm" onClick={() => navigate('/upgrade')}>
              Upgrade <Star className="w-3 h-3 ml-1 fill-current" />
            </Button>
          )}
        </div>

        {/* Editable Profile Section */}
        <Card>
          <CardHeader className="pb-3 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Investor Profile
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (isEditing) handleSave();
                  else setIsEditing(true);
                }}
                disabled={loading}
              >
                {isEditing ? (
                  loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />
                ) : null}
                {isEditing ? 'Save' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            {isEditing ? (
              <div className="grid gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Main Goal</Label>
                  <Select
                    value={formData.goal}
                    onValueChange={(v) => setFormData({ ...formData, goal: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="growth">Aggressive Growth</SelectItem>
                      <SelectItem value="balanced">Balanced Wealth</SelectItem>
                      <SelectItem value="protection">Capital Protection</SelectItem>
                      <SelectItem value="passive-income">Passive Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(v) => setFormData({ ...formData, experience: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="experienced">Pro / Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <Select
                    value={formData.riskTolerance}
                    onValueChange={(v) => setFormData({ ...formData, riskTolerance: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk (Degen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-sm">{investorType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="font-medium text-sm capitalize">{userProfile.goal?.replace('-', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className="font-medium text-sm capitalize">{userProfile.riskTolerance} Risk</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-medium text-sm capitalize">{userProfile.experience}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Status */}
        <Card className="bg-gradient-to-br from-background to-secondary/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Ecosystem Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {referralLinks.map((link) => {
              const isClicked = link.id === 'bybit' ? linkClicks.bybitClicked :
                link.id === 'ai-bot' ? linkClicks.aiBotClicked :
                  linkClicks.aiTradeClicked;
              return (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    if (link.id === 'bybit') trackLinkClick('bybit');
                    else if (link.id === 'ai-bot') trackLinkClick('aiBot');
                    else trackLinkClick('aiTrade');
                    window.open(link.url, '_blank');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isClicked ? 'bg-apice-success' : 'bg-muted-foreground/30'}`} />
                    <span className="text-sm font-medium">{link.name}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full h-12 mt-8"
          onClick={() => {
            signOut();
            navigate('/auth');
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground pt-4 pb-8">
          User ID: {user?.id} <br />
          Apice v1.0.1
        </p>
      </motion.div>
    </div>
  );
}

import { Link2 } from 'lucide-react'; 
