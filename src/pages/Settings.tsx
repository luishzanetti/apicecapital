import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, investorTypeDescriptions } from '@/store/appStore';
import { useAuth } from '@/components/AuthProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    Headphones,
    Copy,
    Check,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { encrypt } from '@/lib/crypto';

export default function Settings() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const userProfile = useAppStore((s) => s.userProfile);
    const updateUserProfile = useAppStore((s) => s.updateUserProfile);
    const calculateInvestorType = useAppStore((s) => s.calculateInvestorType);
    const investorType = useAppStore((s) => s.investorType);
    const subscription = useAppStore((s) => s.subscription);
    const daysActive = useAppStore((s) => s.daysActive);

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

    useEffect(() => {
        loadBybitCredentials();
    }, [user]);

    const loadBybitCredentials = async () => {
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
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    };

    const handleConnectBybit = async () => {
        if (!apiKey || !apiSecret) {
            toast.error('API Key and Secret are required');
            return;
        }
        if (!user) {
            toast.error('Please sign in first to connect your exchange');
            return;
        }
        setIsConnecting(true);
        try {
            const encryptedSecret = encrypt(apiSecret);
            const { error } = await supabase
                .from('bybit_credentials')
                .upsert({
                    user_id: user.id,
                    api_key: apiKey,
                    api_secret_encrypted: encryptedSecret,
                    testnet: useTestnet,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
            setIsConnected(true);
            setShowBybitModal(false);
            toast.success('Bybit connected successfully!');
            setApiKey('');
            setApiSecret('');
        } catch (error: any) {
            toast.error(error.message || 'Connection failed');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnectBybit = async () => {
        try {
            if (!user) return;
            const { error } = await supabase
                .from('bybit_credentials')
                .delete()
                .eq('user_id', user.id);
            if (error) throw error;
            setIsConnected(false);
            toast.success('Bybit disconnected');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleUpdatePreference = async (key: string, value: any) => {
        try {
            updateUserProfile({ [key]: value });
            calculateInvestorType();
            toast.success("Preference updated");
        } catch (error) {
            toast.error("Failed to update");
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
            title: "Account & Security",
            items: [
                {
                    icon: User,
                    label: "Personal Details",
                    sub: "View account info",
                    action: () => setShowPersonalModal(true),
                },
                {
                    icon: LinkIcon,
                    label: "Bybit Connection",
                    sub: isConnected ? "Verified & Active" : "Connect for automation",
                    action: () => isConnected ? handleDisconnectBybit() : setShowBybitModal(true),
                    badge: isConnected ? "CONNECTED" : null,
                    badgeColor: isConnected ? "bg-green-500/10 text-green-500" : ""
                },
                {
                    icon: CreditCard,
                    label: "Subscription",
                    sub: subscription.tier.toUpperCase() + " Member",
                    action: () => navigate('/upgrade'),
                },
            ]
        },
        {
            title: "App Settings",
            items: [
                {
                    icon: Bell,
                    label: "Notifications",
                    sub: "Push preferences",
                    action: () => setShowNotifModal(true),
                },
                {
                    icon: Moon,
                    label: "Appearance",
                    sub: "Dark mode — Active",
                    action: () => setShowAppearanceModal(true),
                },
                {
                    icon: Globe,
                    label: "Language",
                    sub: "English (US)",
                    action: () => setShowLanguageModal(true),
                },
            ]
        },
        {
            title: "Help & Extras",
            items: [
                {
                    icon: Headphones,
                    label: "Support",
                    sub: "Get help from our team",
                    action: () => navigate('/support'),
                },
                {
                    icon: Star,
                    label: "Referral Links",
                    sub: "Exchange & tool perks",
                    action: () => navigate('/referrals'),
                },
            ]
        },
        {
            title: "Journey Reset",
            items: [
                {
                    icon: RotateCcw,
                    label: "Retake Onboarding Quiz",
                    sub: "Reset your investor profile",
                    action: () => {
                        if (window.confirm("This will reset your profile preferences. Progress in missions will be kept. Proceed?")) {
                            navigate('/quiz');
                        }
                    },
                    variant: "destructive"
                },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background px-5 pb-28 safe-top">
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
                    <p className="text-xs text-muted-foreground font-medium">Manage your account</p>
                    <h1 className="text-2xl font-bold tracking-tight mt-0.5">Settings</h1>
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
                                {user?.email?.split('@')[0] || 'Investor'}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                                    style={{
                                        background: subscription.tier === 'free' ? 'hsl(var(--secondary))' : subscription.tier === 'pro' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--apice-gold) / 0.1)',
                                        borderColor: subscription.tier === 'free' ? 'hsl(var(--border))' : subscription.tier === 'pro' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--apice-gold) / 0.3)',
                                        color: subscription.tier === 'free' ? 'hsl(var(--muted-foreground))' : subscription.tier === 'pro' ? 'hsl(var(--primary))' : 'hsl(var(--apice-gold))',
                                    }}
                                >
                                    {subscription.tier.toUpperCase()}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-medium">{daysActive} days active</span>
                                {investorType && (
                                    <span className="text-[9px] text-primary font-medium">• {investorType}</span>
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
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Personalization</h2>
                    </div>

                    <Card className="border-border/40 bg-card/50 overflow-hidden rounded-3xl">
                        <CardContent className="p-0 divide-y divide-border/40">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Risk Tolerance</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">{userProfile.riskTolerance} Risk</p>
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
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Main Goal</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">{userProfile.goal?.replace('-', ' ')}</p>
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
                                        <SelectItem value="growth">Growth</SelectItem>
                                        <SelectItem value="balanced">Balanced</SelectItem>
                                        <SelectItem value="protection">Protection</SelectItem>
                                        <SelectItem value="passive-income">Income</SelectItem>
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
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60 whitespace-nowrap">{section.title}</h2>
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
                                                        "text-[8px] font-bold px-1.5 py-0.5 rounded-full border",
                                                        item.badgeColor
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.sub}</p>
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
                    <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Sign Out</span>
                </button>

                <div className="text-center space-y-1 py-4">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-[0.2em]">Apice Capital v1.0.2</p>
                    <p className="text-[9px] text-muted-foreground/30">Secure &amp; Private Wealth Management</p>
                </div>
            </motion.div>

            {/* ─── Personal Details Modal ─── */}
            <Dialog open={showPersonalModal} onOpenChange={setShowPersonalModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Personal Details</DialogTitle>
                        <DialogDescription className="text-xs">Your account information</DialogDescription>
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
                                <p className="font-bold text-sm">{user?.email?.split('@')[0] || 'Investor'}</p>
                                <p className="text-xs text-muted-foreground">{investorType || 'Balanced Optimizer'}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
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
                                <p className="text-[10px] text-muted-foreground">Plan</p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/30 text-center">
                                <p className="text-xs font-bold">{daysActive}</p>
                                <p className="text-[10px] text-muted-foreground">Days Active</p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/30 text-center">
                                <p className="text-xs font-bold capitalize">{userProfile.riskTolerance || '—'}</p>
                                <p className="text-[10px] text-muted-foreground">Risk</p>
                            </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground text-center px-2">
                            To update your email or password, contact our support team.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowPersonalModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Notifications Modal ─── */}
            <Dialog open={showNotifModal} onOpenChange={setShowNotifModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Notifications</DialogTitle>
                        <DialogDescription className="text-xs">Manage your push preferences</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30">
                            <div>
                                <p className="text-sm font-semibold">Weekly Deposit Reminders</p>
                                <p className="text-[10px] text-muted-foreground">Get reminded to make your weekly DCA</p>
                            </div>
                            <Switch
                                checked={notifEnabled}
                                onCheckedChange={(v) => {
                                    setNotifEnabled(v);
                                    toast.success(v ? 'Notifications enabled' : 'Notifications disabled');
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 opacity-60">
                            <div>
                                <p className="text-sm font-semibold">Market Alerts</p>
                                <p className="text-[10px] text-muted-foreground">Coming soon — crash alerts & opportunities</p>
                            </div>
                            <Badge variant="outline" className="text-[9px]">Soon</Badge>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground">
                                For full notification control, go to your device Settings → Apps → Apice to manage permissions.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowNotifModal(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Appearance Modal ─── */}
            <Dialog open={showAppearanceModal} onOpenChange={setShowAppearanceModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Appearance</DialogTitle>
                        <DialogDescription className="text-xs">Theme & display settings</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Moon className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Dark Mode</p>
                                    <p className="text-[10px] text-muted-foreground">Currently active</p>
                                </div>
                            </div>
                            <Switch checked={true} disabled />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 opacity-50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                                    <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Light Mode</p>
                                    <p className="text-[10px] text-muted-foreground">Coming in future update</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[9px]">Soon</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center px-2 mt-4">
                            Apice is designed for dark mode. Light mode and custom themes are on the roadmap.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAppearanceModal(false)}>
                            Got it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Language Modal ─── */}
            <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Language</DialogTitle>
                        <DialogDescription className="text-xs">Choose your preferred language</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {[
                            { code: 'en', label: 'English', sublabel: 'English (US)', flag: '🇺🇸', active: true },
                            { code: 'pt', label: 'Português', sublabel: 'Português (Brasil)', flag: '🇧🇷', active: false },
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    if (!lang.active) {
                                        toast.info('Português — coming soon!', { description: 'We are adding full PT-BR support in the next update.' });
                                    } else {
                                        setShowLanguageModal(false);
                                    }
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                                    lang.active
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{lang.flag}</span>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">{lang.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{lang.sublabel}</p>
                                    </div>
                                </div>
                                {lang.active && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                {!lang.active && (
                                    <Badge variant="outline" className="text-[9px]">Soon</Badge>
                                )}
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowLanguageModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Bybit Connection Modal ─── */}
            <Dialog open={showBybitModal} onOpenChange={setShowBybitModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Connect Bybit Account</DialogTitle>
                        <DialogDescription className="text-xs">
                            Enable direct execution and real-time portfolio management.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Key</Label>
                            <Input
                                id="api-key"
                                placeholder="Enter API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-secondary/50 border-none rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="api-secret" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Secret</Label>
                            <Input
                                id="api-secret"
                                type="password"
                                placeholder="Enter API Secret"
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                                className="bg-secondary/50 border-none rounded-xl"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div className="space-y-0.5">
                                <Label htmlFor="testnet" className="text-xs font-bold">Use Testnet</Label>
                                <p className="text-[10px] text-muted-foreground">Recommended for first-time use</p>
                            </div>
                            <Switch
                                id="testnet"
                                checked={useTestnet}
                                onCheckedChange={setUseTestnet}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleConnectBybit}
                            disabled={isConnecting || !apiKey || !apiSecret}
                            className="w-full h-12 rounded-xl group"
                        >
                            {isConnecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2 fill-current" />
                                    Connect Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
