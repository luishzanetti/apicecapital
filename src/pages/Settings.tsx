import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Loader2
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

    // Bybit Connection State (from old Settings)
    const [showBybitModal, setShowBybitModal] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [useTestnet, setUseTestnet] = useState(false);

    useEffect(() => {
        loadBybitCredentials();
    }, []);

    const loadBybitCredentials = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;

            const { data: credentials, error } = await supabase
                .from('bybit_credentials')
                .select('api_key, testnet')
                .eq('user_id', currentUser.id)
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

        setIsConnecting(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error('User not authenticated');

            const encryptedSecret = encrypt(apiSecret);

            const { error } = await supabase
                .from('bybit_credentials')
                .upsert({
                    user_id: currentUser.id,
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
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;

            const { error } = await supabase
                .from('bybit_credentials')
                .delete()
                .eq('user_id', currentUser.id);

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

    const menuSections = [
        {
            title: "Account & Security",
            items: [
                { icon: User, label: "Personal Details", sub: "Name and account info", action: () => { } },
                {
                    icon: LinkIcon,
                    label: "Bybit Connection",
                    sub: isConnected ? "Verified & Active" : "Connect for automation",
                    action: () => isConnected ? handleDisconnectBybit() : setShowBybitModal(true),
                    badge: isConnected ? "CONNECTED" : null,
                    badgeColor: isConnected ? "bg-green-500/10 text-green-500" : ""
                },
                { icon: CreditCard, label: "Subscription", sub: subscription.tier.toUpperCase() + " Member", action: () => navigate('/upgrade') },
            ]
        },
        {
            title: "App Settings",
            items: [
                { icon: Bell, label: "Notifications", sub: "Push preferences", action: () => { } },
                { icon: Palette, label: "Appearance", sub: "Dark mode (Active)", action: () => { } },
                { icon: Globe, label: "Language", sub: "English (US)", action: () => { } },
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
        <div className="min-h-screen bg-background px-6 pb-40">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-xs text-muted-foreground mt-1">Personalize your Apice experience</p>
                    </div>
                </div>

                {/* User Card */}
                <div className="p-6 rounded-3xl bg-secondary/30 border border-border/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-xl shadow-primary/20">
                            <span className="text-xl font-bold text-white capitalize">
                                {user?.email?.[0] || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{user?.email?.split('@')[0] || 'Investor'}</h3>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 border-primary/20">
                                    {subscription.tier.toUpperCase()}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground font-medium">{daysActive} days active</span>
                            </div>
                        </div>
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
                    <div key={idx} className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 px-1">{section.title}</h2>
                        <div className="space-y-2">
                            {section.items.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={item.action}
                                    className="w-full bg-card/40 border border-border/40 hover:bg-card/60 transition-all p-4 rounded-2xl flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            item.variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-muted-foreground group-hover:text-primary"
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className={cn(
                                                    "text-sm font-bold",
                                                    item.variant === "destructive" ? "text-destructive" : "text-foreground"
                                                )}>{item.label}</p>
                                                {item.badge && (
                                                    <Badge variant="outline" className={cn("text-[8px] font-bold px-1 py-0", item.badgeColor)}>
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium">{item.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <Button
                    variant="ghost"
                    className="w-full h-14 rounded-2xl bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/10"
                    onClick={() => {
                        signOut();
                        navigate('/auth');
                    }}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="font-bold text-sm uppercase tracking-wider text-red-500">Sign Out</span>
                </Button>

                <div className="text-center space-y-1 py-4">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Apice Capital v1.0.2</p>
                    <p className="text-[9px] text-muted-foreground/50">Secure & Private Wealth Management</p>
                </div>
            </motion.div>

            {/* Bybit Modal (copied from old Settings) */}
            <Dialog open={showBybitModal} onOpenChange={setShowBybitModal}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40">
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
