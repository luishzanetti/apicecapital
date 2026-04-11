import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/components/AuthProvider';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Gift,
  KeyRound,
  Link2,
  Bot,
  Brain,
  Share2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

// ─── Reward Tiers ──────────────────────────────────────────
const REWARD_TIERS = [
  { count: 1, reward: '1 week Pro free', label: 'Starter' },
  { count: 3, reward: '1 month Pro free', label: 'Connector' },
  { count: 10, reward: '3 months Pro free', label: 'Ambassador' },
] as const;

// ─── Leaderboard Placeholder ───────────────────────────────
const LEADERBOARD_DATA = [
  { rank: 1, name: 'Alex M.', referrals: 24 },
  { rank: 2, name: 'Sarah K.', referrals: 18 },
  { rank: 3, name: 'James R.', referrals: 15 },
  { rank: 4, name: 'Maria L.', referrals: 11 },
  { rank: 5, name: 'David W.', referrals: 9 },
] as const;

// ─── How It Works Steps ────────────────────────────────────
const HOW_IT_WORKS = [
  { icon: Link2, title: 'Share your link', description: 'Copy your unique referral link and share it with friends' },
  { icon: UserPlus, title: 'Friend signs up', description: 'Your friend creates an account using your link' },
  { icon: Gift, title: 'You earn rewards', description: 'Unlock Pro access as your referrals grow' },
] as const;

// ─── Link Config ───────────────────────────────────────────
const LINK_CONFIG = [
  {
    id: 'bybit' as const,
    storeKey: 'bybitClicked' as const,
    storeAtKey: 'bybitClickedAt' as const,
    trackKey: 'bybit' as const,
    label: 'Bybit Exchange',
    icon: KeyRound,
  },
  {
    id: 'aiBot' as const,
    storeKey: 'aiBotClicked' as const,
    storeAtKey: 'aiBotClickedAt' as const,
    trackKey: 'aiBot' as const,
    label: 'AI Bot Access',
    icon: Bot,
  },
  {
    id: 'aiTrade' as const,
    storeKey: 'aiTradeClicked' as const,
    storeAtKey: 'aiTradeClickedAt' as const,
    trackKey: 'aiTrade' as const,
    label: 'AI Trade Platform',
    icon: Brain,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0, 0, 0.58, 1] as const },
  }),
};

export default function ReferralLinks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const linkClicks = useAppStore((state) => state.linkClicks);

  const [copied, setCopied] = useState(false);

  // Build referral slug from user email or fallback
  const refSlug = user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const referralUrl = `apice.capital/ref/${refSlug}`;

  // Count total referrals from link clicks (simulated)
  const totalReferrals = [
    linkClicks.bybitClicked,
    linkClicks.aiBotClicked,
    linkClicks.aiTradeClicked,
  ].filter(Boolean).length;

  // Determine current and next tier
  const currentTier = [...REWARD_TIERS].reverse().find((t) => totalReferrals >= t.count) ?? null;
  const nextTier = REWARD_TIERS.find((t) => totalReferrals < t.count) ?? REWARD_TIERS[REWARD_TIERS.length - 1];
  const progressPercent = Math.min((totalReferrals / nextTier.count) * 100, 100);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`https://${referralUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = `https://${referralUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Apice Capital',
          text: 'Start building wealth with crypto using the Apice method. Use my referral link:',
          url: `https://${referralUrl}`,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  }, [referralUrl, handleCopy]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-5xl space-y-8"
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-0">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Referral Program</h1>
              <p className="text-sm text-muted-foreground">Invite friends, earn Pro access</p>
            </div>
          </div>
        </div>

        {/* ─── Two Column Layout on xl ────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* ─── Left Column ──────────────────────────────── */}
          <div className="space-y-6">
            {/* ─── Your Referral Link ─────────────────────── */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-primary/20 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),transparent_60%)]">
                <CardContent className="space-y-4 pt-5">
                  <h2 className="text-lg font-bold">Your Referral Link</h2>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm font-mono text-foreground/80">
                      {referralUrl}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={copied ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Rewards Tracker ────────────────────────── */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-border/60 bg-card/95">
                <CardContent className="space-y-5 pt-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Rewards Tracker</h2>
                    <Badge variant="outline" className="text-xs">
                      {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Tier Cards */}
                  <div className="space-y-3">
                    {REWARD_TIERS.map((tier) => {
                      const reached = totalReferrals >= tier.count;
                      return (
                        <div
                          key={tier.count}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                            reached
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-border/40 bg-background/30'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              reached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {reached ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${reached ? 'text-primary' : ''}`}>
                              Invite {tier.count} friend{tier.count > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">{tier.reward}</p>
                          </div>
                          {reached && (
                            <Badge className="bg-primary/15 text-primary text-xs border-0">
                              {tier.label}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress to next tier */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress to next tier</span>
                      <span>
                        {totalReferrals} / {nextTier.count}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    {currentTier && (
                      <p className="text-xs text-primary font-medium">
                        Current tier: {currentTier.label}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── How It Works ───────────────────────────── */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-border/60 bg-card/95">
                <CardContent className="space-y-5 pt-5">
                  <h2 className="text-lg font-bold">How It Works</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {HOW_IT_WORKS.map((step, i) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.title} className="flex flex-col items-center text-center gap-3">
                          <div className="relative">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                              <StepIcon className="h-6 w-6 text-primary" />
                            </div>
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {i + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{step.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ─── Right Column ─────────────────────────────── */}
          <div className="space-y-6">
            {/* ─── Leaderboard Preview ────────────────────── */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-border/60 bg-card/95">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <h2 className="text-lg font-bold">Top Referrers This Month</h2>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/30 text-amber-500">
                      Coming Soon
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {LEADERBOARD_DATA.map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/30 px-4 py-2.5"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            entry.rank === 1
                              ? 'bg-amber-500/15 text-amber-500'
                              : entry.rank === 2
                                ? 'bg-zinc-400/15 text-zinc-400'
                                : entry.rank === 3
                                  ? 'bg-orange-600/15 text-orange-600'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                        <span className="flex-1 text-sm font-medium">{entry.name}</span>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {entry.referrals}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">Your position</span>
                    <span className="text-sm font-bold text-primary">--</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Referral History ────────────────────────── */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-border/60 bg-card/95">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">Referral History</h2>
                  </div>

                  <div className="space-y-3">
                    {LINK_CONFIG.map((link) => {
                      const LinkIcon = link.icon;
                      const clicked = linkClicks[link.storeKey];
                      const clickedAt = linkClicks[link.storeAtKey];

                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              clicked ? 'bg-primary/10' : 'bg-muted'
                            }`}
                          >
                            <LinkIcon
                              className={`h-5 w-5 ${clicked ? 'text-primary' : 'text-muted-foreground'}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{link.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {clicked ? `Clicked on ${formatDate(clickedAt)}` : 'Not yet clicked'}
                            </p>
                          </div>
                          {clicked ? (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-0 text-xs">
                              <Check className="mr-1 h-3 w-3" />
                              Done
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Pro Upgrade CTA ────────────────────────── */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-primary/20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.1),transparent)]">
                <CardContent className="flex items-center gap-4 pt-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Want Pro now?</p>
                    <p className="text-xs text-muted-foreground">
                      Upgrade instantly or keep referring friends for free access.
                    </p>
                  </div>
                  <Button
                    variant="premium"
                    size="sm"
                    onClick={() => navigate('/upgrade')}
                  >
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
