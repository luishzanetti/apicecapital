import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeDescriptions } from '@/store/appStore';
import type { UserProfile } from '@/store/appStore';
import { useAuth } from '@/components/AuthProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    User,
    Settings as SettingsIcon,
    Bell,
    Shield,
    Palette,
    RotateCcw,
    LogOut,
    ChevronRight,
    Star,
    ExternalLink,
    Globe,
    Zap,
    CreditCard,
    Target,
    FlaskConical,
    Link as LinkIcon,
    Loader2,
    Moon,
    Sun,
    Headphones,
    Copy,
    Check,
    Info,
} from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { encrypt } from '@/lib/crypto';
import { testBybitApiKey } from '@/hooks/useDCAExecution';

// Bybit API key validation schema
const bybitCredentialsSchema = z.object({
    apiKey: z.string()
        .min(8, 'API Key is too short')
        .max(128, 'API Key is too long')
        .regex(/^[A-Za-z0-9]+$/, 'API Key must be alphanumeric only'),
    apiSecret: z.string()
        .min(8, 'API Secret is too short')
        .max(256, 'API Secret is too long')
        .regex(/^[A-Za-z0-9]+$/, 'API Secret must be alphanumeric only'),
});

export default function Settings() {
    const navigate = useNavigate();
    const { user, session, signOut } = useAuth();
    const { t, language, setLanguage } = useTranslation();
    const userProfile = useAppStore((s) => s.userProfile);
    const updateUserProfile = useAppStore((s) => s.updateUserProfile);
    const calculateInvestorType = useAppStore((s) => s.calculateInvestorType);
    const completeMissionTask = useAppStore((s) => s.completeMissionTask);
    const investorType = useAppStore((s) => s.investorType);
    const subscription = useAppStore((s) => s.subscription);
    const daysActive = useAppStore((s) => s.daysActive);
    const theme = useAppStore((s) => s.theme);

    // Bybit Connection State
    const [showBybitModal, setShowBybitModal] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [useTestnet, setUseTestnet] = useState(false);

    // Modal states for previously-dead buttons
    const [showPersonalModal, setShowPersonalModal] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [showAppearanceModal, setShowAppearanceModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(true);

    const loadBybitCredentials = useCallback(async () => {
        try {
            if (!user) return;
            const { data: credentials, error } = await supabase
                .from('bybit_credentials')
                .select('api_key, testnet')
                .eq('user_id', user.id)
                .single();
            if (credentials && !error) {
                setIsConnected(true);
                setUseTestnet(credentials.testnet || false);
                completeMissionTask('m2_apiConnected');
            }
        } catch {
            // Credentials load failed; isConnected stays false
        }
    }, [completeMissionTask, user]);

    useEffect(() => {
        loadBybitCredentials();
    }, [loadBybitCredentials]);

    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'saving'>('idle');

    const handleConnectBybit = async () => {
        const cleanKey = apiKey.trim();
        const cleanSecret = apiSecret.trim();

        // Validate inputs with Zod to prevent injection and ensure format
        const validation = bybitCredentialsSchema.safeParse({
            apiKey: cleanKey,
            apiSecret: cleanSecret,
        });
        if (!validation.success) {
            const firstError = validation.error.errors[0]?.message || 'Invalid credentials format';
            toast.error(firstError);
            return;
        }
        if (!user) {
            toast.error(t('settings.bybitModal.signInFirst'));
            return;
        }
        setIsConnecting(true);
        setConnectionStatus('testing');

        try {
            // Step 1: Validate API key and permissions
            toast.loading(t('settings.bybitModal.testingApiKey'), { id: 'bybit-connect' });
            const test = await testBybitApiKey(cleanKey, cleanSecret);

            if (!test.valid) {
                toast.error(test.error || 'Invalid API key', { id: 'bybit-connect' });
                return;
            }

            // Auto-detected testnet — update toggle to match
            if (test.isTestnet !== useTestnet) {
                setUseTestnet(test.isTestnet);
            }

            if (!test.canTrade) {
                toast.warning(test.error || 'Key lacks trade permission', {
                    id: 'bybit-connect',
                    duration: 8000,
                });
            }

            // Step 2: Save credentials with auto-detected network
            setConnectionStatus('saving');
            toast.loading(t('settings.bybitModal.savingCredentials'), { id: 'bybit-connect' });

            const encryptedSecret = encrypt(cleanSecret);
            const { error } = await supabase
                .from('bybit_credentials')
                .upsert({
                    user_id: user.id,
                    api_key: cleanKey,
                    api_secret_encrypted: encryptedSecret,
                    testnet: test.isTestnet,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;

            setIsConnected(true);
            completeMissionTask('m2_apiConnected');
            setShowBybitModal(false);

            if (test.canTrade) {
                toast.success(test.isTestnet
                    ? '✅ Connected to Bybit Testnet! Redirecting to dashboard...'
                    : t('settings.bybitModal.connectedFull'),
                    { id: 'bybit-connect' });
            } else {
                toast.warning(t('settings.bybitModal.connectedReadOnly'), {
                    id: 'bybit-connect',
                    duration: 10000,
                });
            }
            setApiKey('');
            setApiSecret('');

            // Redirect to dashboard after connecting
            setTimeout(() => navigate('/home'), 1500);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('settings.bybitModal.connectionFailed');
            toast.error(message, { id: 'bybit-connect' });
        } finally {
            setIsConnecting(false);
            setConnectionStatus('idle');
        }
    };

    const handleDisconnectBybit = async () => {
        if (!user) return;

        const confirmed = window.confirm(t('settings.bybitModal.disconnectConfirm'));
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('bybit_credentials')
                .delete()
                .eq('user_id', user.id);
            if (error) throw error;
            setIsConnected(false);
            completeMissionTask('m2_apiConnected', false);
            toast.success(t('settings.bybitModal.disconnected'));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('settings.failedToUpdate');
            toast.error(message);
        }
    };

    const handleUpdatePreference = async (
        key: keyof UserProfile,
        value: UserProfile[keyof UserProfile]
    ) => {
        try {
            updateUserProfile({ [key]: value });
            calculateInvestorType();
            toast.success(t('settings.preferenceUpdated'));
        } catch (error) {
            toast.error(t('settings.failedToUpdate'));
        }
    };

    const handleCopyEmail = () => {
        if (user?.email) {
            navigator.clipboard.writeText(user.email);
            setEmailCopied(true);
            setTimeout(() => setEmailCopied(false), 2000);
        }
    };

    const menuSections = [
        {
            title: t('settings.accountAndSecurity'),
            items: [
                {
                    icon: User,
                    label: t('settings.personalDetails'),
                    sub: t('settings.viewAccountInfo'),
                    action: () => setShowPersonalModal(true),
                },
                {
                    icon: LinkIcon,
                    label: t('settings.bybitConnection'),
                    sub: isConnected ? t('settings.verifiedActive') : t('settings.connectForAutomation'),
                    action: () => isConnected ? handleDisconnectBybit() : setShowBybitModal(true),
                    badge: isConnected ? t('settings.connected') : null,
                    badgeColor: isConnected ? "bg-green-500/10 text-green-500" : ""
                },
                {
                    icon: CreditCard,
                    label: t('settings.subscription'),
                    sub: subscription.tier.toUpperCase() + " " + t('settings.member'),
                    action: () => navigate('/upgrade'),
                },
            ]
        },
        {
            title: t('settings.appSettings'),
            items: [
                {
                    icon: Bell,
                    label: t('settings.notifications'),
                    sub: t('settings.pushPreferences'),
                    action: () => setShowNotifModal(true),
                },
                {
                    icon: Moon,
                    label: t('settings.appearance'),
                    sub: theme === 'dark' ? t('settings.darkModeActive') : 'Light mode',
                    action: () => setShowAppearanceModal(true),
                },
                {
                    icon: Globe,
                    label: t('settings.language'),
                    sub: t('settings.languageSub'),
                    action: () => setShowLanguageModal(true),
                },
            ]
        },
        {
            title: t('settings.helpAndExtras'),
            items: [
                {
                    icon: Headphones,
                    label: t('nav.support'),
                    sub: t('settings.getHelp'),
                    action: () => navigate('/support'),
                },
                {
                    icon: Star,
                    label: t('settings.referralLinks'),
                    sub: t('settings.exchangePerks'),
                    action: () => navigate('/referrals'),
                },
            ]
        },
        {
            title: t('settings.journeyReset'),
            items: [
                {
                    icon: RotateCcw,
                    label: t('settings.retakeQuiz'),
                    sub: t('settings.resetProfile'),
                    action: () => {
                        if (window.confirm(t('settings.resetConfirm'))) {
                            navigate('/quiz');
                        }
                    },
                    variant: "destructive"
                },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background px-5 md:px-6 lg:px-8 pb-28 safe-top">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div
                    className="pt-5 pb-2"
                    style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.05) 0%, transparent 100%)' }}
                >
                    <p className="text-xs text-muted-foreground font-medium">{t('settings.manageAccount')}</p>
                    <h1 className="text-2xl font-bold tracking-tight mt-0.5">{t('settings.title')}</h1>
                </div>

                {/* Profile Card */}
                <div className="relative overflow-hidden p-5 rounded-3xl bg-card border border-border/40 apice-shadow-card" onClick={() => setShowPersonalModal(true)}>
                    {/* Orb glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/6 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                        {/* Avatar with gradient ring */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-[18px] apice-gradient-primary flex items-center justify-center shadow-xl shadow-primary/25">
                                <span className="text-xl font-bold text-white capitalize">
                                    {user?.email?.[0] || 'U'}
                                </span>
                            </div>
                            {/* Online dot */}
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base truncate">
                                {user?.email?.split('@')[0] || t('common.investor')}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                                    style={{
                                        background: subscription.tier === 'free' ? 'hsl(var(--secondary))' : subscription.tier === 'pro' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--apice-gold) / 0.1)',
                                        borderColor: subscription.tier === 'free' ? 'hsl(var(--border))' : subscription.tier === 'pro' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--apice-gold) / 0.3)',
                                        color: subscription.tier === 'free' ? 'hsl(var(--muted-foreground))' : subscription.tier === 'pro' ? 'hsl(var(--primary))' : 'hsl(var(--apice-gold))',
                                    }}
                                >
                                    {subscription.tier.toUpperCase()}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-medium">{daysActive} {t('common.daysActive').toLowerCase()}</span>
                                {investorType && (
                                    <span className="text-[11px] text-primary font-medium">• {investorType}</span>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                </div>

                {/* Personalization Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.personalization')}</h2>
                    </div>

                    <Card className="border-border/40 bg-card/50 overflow-hidden rounded-3xl">
                        <CardContent className="p-0 divide-y divide-border/40">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{t('settings.riskTolerance')}</p>
                                        <p className="text-[11px] text-muted-foreground capitalize">{t('settings.riskLevel').replace('{level}', userProfile.riskTolerance || '')}</p>
                                    </div>
                                </div>
                                <Select
                                    value={userProfile.riskTolerance || 'medium'}
                                    onValueChange={(v) => handleUpdatePreference('riskTolerance', v)}
                                >
                                    <SelectTrigger className="w-28 h-8 text-xs border-none bg-secondary/50 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="low">{t('settings.riskLow')}</SelectItem>
                                        <SelectItem value="medium">{t('settings.riskMedium')}</SelectItem>
                                        <SelectItem value="high">{t('settings.riskHigh')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{t('settings.mainGoal')}</p>
                                        <p className="text-[11px] text-muted-foreground capitalize">{userProfile.goal?.replace('-', ' ')}</p>
                                    </div>
                                </div>
                                <Select
                                    value={userProfile.goal || 'balanced'}
                                    onValueChange={(v) => handleUpdatePreference('goal', v)}
                                >
                                    <SelectTrigger className="w-28 h-8 text-xs border-none bg-secondary/50 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="growth">{t('settings.goalGrowth')}</SelectItem>
                                        <SelectItem value="balanced">{t('settings.goalBalanced')}</SelectItem>
                                        <SelectItem value="protection">{t('settings.goalProtection')}</SelectItem>
                                        <SelectItem value="passive-income">{t('settings.goalIncome')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Menu Sections */}
                {menuSections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60 whitespace-nowrap">{section.title}</h2>
                            <div className="flex-1 h-px bg-border/40" />
                        </div>
                        <div className="space-y-1.5">
                            {section.items.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={item.action}
                                    className="w-full bg-card border border-border/40 hover:bg-secondary/30 hover:border-border/60 transition-all p-4 rounded-2xl flex items-center justify-between group press-scale"
                                >
                                    <div className="flex items-center gap-3.5 text-left">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            item.variant === "destructive"
                                                ? "bg-destructive/10 text-destructive"
                                                : "bg-primary/8 text-primary/70 group-hover:text-primary group-hover:bg-primary/12"
                                        )}>
                                            <item.icon className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className={cn(
                                                    "text-sm font-semibold",
                                                    item.variant === "destructive" ? "text-destructive" : "text-foreground"
                                                )}>{item.label}</p>
                                                {item.badge && (
                                                    <span className={cn(
                                                        "text-[11px] font-bold px-1.5 py-0.5 rounded-full border",
                                                        item.badgeColor
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Sign Out */}
                <button
                    className="w-full h-14 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/25 transition-all flex items-center justify-center gap-2 press-scale"
                    onClick={() => {
                        signOut();
                        navigate('/auth');
                    }}
                >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-red-500 uppercase tracking-wider">{t('common.signOut')}</span>
                </button>

                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => navigate('/terms')}
                        className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors font-medium"
                    >
                        {t('common.termsOfService')}
                    </button>
                    <span className="text-muted-foreground/30">|</span>
                    <button
                        onClick={() => navigate('/privacy')}
                        className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors font-medium"
                    >
                        {t('common.privacyPolicy')}
                    </button>
                </div>

                <div className="text-center space-y-1 py-4">
                    <p className="text-[11px] text-muted-foreground/50 font-bold uppercase tracking-[0.2em]">Apice Capital v1.0.2</p>
                    <p className="text-[11px] text-muted-foreground/30">{t('settings.secureWealth')}</p>
                </div>
            </motion.div>

            {/* ─── Personal Details Modal ─── */}
            <Dialog open={showPersonalModal} onOpenChange={setShowPersonalModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('settings.personalDetailsModal.title')}</DialogTitle>
                        <DialogDescription className="text-xs">{t('settings.personalDetailsModal.subtitle')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Avatar */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30">
                            <div className="w-14 h-14 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="text-xl font-bold text-white capitalize">
                                    {user?.email?.[0] || 'U'}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-sm">{user?.email?.split('@')[0] || t('common.investor')}</p>
                                <p className="text-xs text-muted-foreground">{investorType || t('settings.goalBalanced')}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.personalDetailsModal.email')}</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2.5 rounded-xl bg-secondary/50 text-sm text-muted-foreground">
                                    {user?.email}
                                </div>
                                <button
                                    onClick={handleCopyEmail}
                                    className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                                >
                                    {emailCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>

                        {/* Plan & Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-secondary/30 text-center">
                                <p className="text-xs font-bold capitalize">{subscription.tier}</p>
                                <p className="text-[11px] text-muted-foreground">{t('common.plan')}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/30 text-center">
                                <p className="text-xs font-bold">{daysActive}</p>
                                <p className="text-[11px] text-muted-foreground">{t('common.daysActive')}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/30 text-center">
                                <p className="text-xs font-bold capitalize">{userProfile.riskTolerance || '—'}</p>
                                <p className="text-[11px] text-muted-foreground">{t('common.risk')}</p>
                            </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground text-center px-2">
                            {t('settings.personalDetailsModal.contactSupport')}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowPersonalModal(false)}>
                            {t('common.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Notifications Modal ─── */}
            <Dialog open={showNotifModal} onOpenChange={setShowNotifModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('settings.notificationsModal.title')}</DialogTitle>
                        <DialogDescription className="text-xs">{t('settings.notificationsModal.subtitle')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30">
                            <div>
                                <p className="text-sm font-semibold">{t('settings.notificationsModal.weeklyReminders')}</p>
                                <p className="text-[11px] text-muted-foreground">{t('settings.notificationsModal.weeklyRemindersDesc')}</p>
                            </div>
                            <Switch
                                checked={notifEnabled}
                                onCheckedChange={(v) => {
                                    setNotifEnabled(v);
                                    toast.success(v ? t('settings.notificationsModal.notificationsEnabled') : t('settings.notificationsModal.notificationsDisabled'));
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 opacity-60">
                            <div>
                                <p className="text-sm font-semibold">{t('settings.notificationsModal.marketAlerts')}</p>
                                <p className="text-[11px] text-muted-foreground">{t('settings.notificationsModal.marketAlertsDesc')}</p>
                            </div>
                            <Badge variant="outline" className="text-[11px]">{t('common.soon')}</Badge>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground">
                                {t('settings.notificationsModal.deviceSettings')}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowNotifModal(false)}>
                            {t('common.done')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Appearance Modal ─── */}
            <Dialog open={showAppearanceModal} onOpenChange={setShowAppearanceModal}>
                <DialogContent className="sm:max-w-md glass-heavy rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('settings.appearanceModal.title')}</DialogTitle>
                        <DialogDescription className="text-xs">{t('settings.appearanceModal.subtitle')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <button
                            onClick={() => useAppStore.getState().setTheme('dark')}
                            className={cn(
                                'w-full flex items-center justify-between p-4 rounded-2xl transition-all press-scale',
                                theme === 'dark' ? 'glass-card border-glow-blue' : 'glass-light'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Moon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{t('settings.appearanceModal.darkMode')}</p>
                                    <p className="text-[11px] text-muted-foreground">Premium fintech aesthetic</p>
                                </div>
                            </div>
                            {theme === 'dark' && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        </button>
                        <button
                            onClick={() => useAppStore.getState().setTheme('light')}
                            className={cn(
                                'w-full flex items-center justify-between p-4 rounded-2xl transition-all press-scale',
                                theme === 'light' ? 'glass-card border-glow-blue' : 'glass-light'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Sun className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{t('settings.appearanceModal.lightMode')}</p>
                                    <p className="text-[11px] text-muted-foreground">Clean & minimal</p>
                                </div>
                            </div>
                            {theme === 'light' && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        </button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAppearanceModal(false)}>
                            {t('common.gotIt')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Language Modal ─── */}
            <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('settings.languageModal.title')}</DialogTitle>
                        <DialogDescription className="text-xs">{t('settings.languageModal.subtitle')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {[
                            { code: 'en' as const, label: 'English', sublabel: t('settings.languageModal.englishUS'), flag: '\u{1F1FA}\u{1F1F8}' },
                            { code: 'pt' as const, label: 'Português', sublabel: t('settings.languageModal.portugueseBR'), flag: '\u{1F1E7}\u{1F1F7}' },
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setShowLanguageModal(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                                    lang.code === language
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{lang.flag}</span>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">{lang.label}</p>
                                        <p className="text-[11px] text-muted-foreground">{lang.sublabel}</p>
                                    </div>
                                </div>
                                {lang.code === language && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowLanguageModal(false)}>
                            {t('common.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Bybit Connection Modal ─── */}
            <Dialog open={showBybitModal} onOpenChange={setShowBybitModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('settings.bybitModal.title')}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {t('settings.bybitModal.subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.bybitModal.apiKey')}</Label>
                            <Input
                                id="api-key"
                                placeholder={t('settings.bybitModal.enterApiKey')}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-secondary/50 border-none rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="api-secret" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.bybitModal.apiSecret')}</Label>
                            <Input
                                id="api-secret"
                                type="password"
                                placeholder={t('settings.bybitModal.enterApiSecret')}
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                                className="bg-secondary/50 border-none rounded-xl"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div className="space-y-0.5">
                                <Label htmlFor="testnet" className="text-xs font-bold">{t('settings.bybitModal.useTestnet')}</Label>
                                <p className="text-[11px] text-muted-foreground">{t('settings.bybitModal.recommendedFirstTime')}</p>
                            </div>
                            <Switch
                                id="testnet"
                                checked={useTestnet}
                                onCheckedChange={setUseTestnet}
                            />
                        </div>
                    </div>

                    {/* Permission Guide */}
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-[11px] font-bold text-blue-400 mb-1">{t('settings.bybitModal.requiredPermissions')}</p>
                        <ul className="text-[11px] text-muted-foreground space-y-0.5">
                            <li>{t('settings.bybitModal.readPermission')}</li>
                            <li>{t('settings.bybitModal.tradePermission')}</li>
                        </ul>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {t('settings.bybitModal.bybitApiPath')}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleConnectBybit}
                            disabled={isConnecting || !apiKey || !apiSecret}
                            className="w-full h-12 rounded-xl group"
                        >
                            {connectionStatus === 'testing' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('settings.bybitModal.testingPermissions')}
                                </>
                            ) : connectionStatus === 'saving' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('settings.bybitModal.saving')}
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2 fill-current" />
                                    {t('settings.bybitModal.testAndConnect')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
