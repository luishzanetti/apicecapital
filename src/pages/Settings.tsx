import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Settings as SettingsIcon,
    Link as LinkIcon,
    Zap,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    User,
    Bell,
    Shield,
    Loader2,
    Globe,
    Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { encrypt, decrypt } from '@/lib/crypto';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Settings() {
    const { toast } = useToast();
    const { language, setLanguage } = useLanguage();
    const [showBybitModal, setShowBybitModal] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [useTestnet, setUseTestnet] = useState(false);

    // Load existing credentials on mount
    useEffect(() => {
        loadBybitCredentials();
    }, []);

    const loadBybitCredentials = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data: credentials, error } = await supabase
                .from('bybit_credentials')
                .select('api_key, api_secret_encrypted, testnet')
                .eq('user_id', user.id)
                .single();

            if (credentials && !error) {
                setIsConnected(true);
                setUseTestnet(credentials.testnet || false);
                // Don't show the actual keys for security
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectBybit = async () => {
        if (!apiKey || !apiSecret) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha API Key e API Secret',
                variant: 'destructive',
            });
            return;
        }

        setIsConnecting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            // Encrypt API secret
            const encryptedSecret = encrypt(apiSecret);

            // Save to Supabase
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

            toast({
                title: 'Conectado com sucesso!',
                description: 'Sua conta Bybit foi conectada. Dados em tempo real ativados.',
            });

            // Clear sensitive data from state
            setApiKey('');
            setApiSecret('');

            // Reload the page to trigger useBybitData hook
            window.location.reload();
        } catch (error: any) {
            console.error('Connection error:', error);
            toast({
                title: 'Erro na conexão',
                description: error.message || 'Não foi possível conectar com a Bybit. Verifique suas credenciais.',
                variant: 'destructive',
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('bybit_credentials')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setIsConnected(false);
            setApiKey('');
            setApiSecret('');

            toast({
                title: 'Desconectado',
                description: 'Sua conta Bybit foi desconectada.',
            });

            // Reload to clear cached data
            window.location.reload();
        } catch (error: any) {
            toast({
                title: 'Erro ao desconectar',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24 px-4 pt-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <SettingsIcon className="w-5 h-5 text-primary" />
                        <h1 className="text-xl font-bold">Configurações</h1>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Gerencie sua conta e conexões
                    </p>
                </div>

                {/* Subscription Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Star className="w-6 h-6 text-white fill-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Plan</p>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        PRO MEMBER
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">All features unlocked</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Manage
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="language" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="language">Idioma</TabsTrigger>
                        <TabsTrigger value="connections">Conexões</TabsTrigger>
                        <TabsTrigger value="notifications">Notificações</TabsTrigger>
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                    </TabsList>

                    {/* Language Tab */}
                    <TabsContent value="language" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Select Language
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Choose your preferred language for the app
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Card
                                    className="cursor-pointer border-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">🇺🇸</span>
                                            <div>
                                                <p className="font-semibold">English</p>
                                                <p className="text-xs text-muted-foreground">Default</p>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </CardContent>
                                </Card>

                                <Card
                                    className="cursor-pointer border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">🇧🇷</span>
                                            <div>
                                                <p className="font-semibold">Português</p>
                                                <p className="text-xs text-muted-foreground">Brasil</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Connections Tab */}
                    <TabsContent value="connections" className="space-y-4 mt-6">
                        {/* Bybit Connection Card */}
                        <Card className="border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <LinkIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Bybit API</CardTitle>
                                            <CardDescription className="text-xs">
                                                Conecte sua conta para automação
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                                        {isConnected ? (
                                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Conectada</>
                                        ) : (
                                            <><AlertCircle className="w-3 h-3 mr-1" /> Não Conectada</>
                                        )}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!isConnected ? (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Conecte sua conta Bybit para:</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-apice-success" />
                                                    <span>Automação de DCA</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-apice-success" />
                                                    <span>Copy Trading</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-apice-success" />
                                                    <span>Sincronização automática de saldo</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-apice-success" />
                                                    <span>Dados em tempo real</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1"
                                                onClick={() => setShowBybitModal(true)}
                                            >
                                                <Zap className="w-4 h-4 mr-2" />
                                                Conectar Bybit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => window.open('https://www.bybit.com/app/user/api-management', '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                                            <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                            <p className="text-xs text-muted-foreground">
                                                Suas chaves são criptografadas e armazenadas com segurança. Nunca compartilhamos suas credenciais.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 rounded-lg bg-apice-success/10 border border-apice-success/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle2 className="w-5 h-5 text-apice-success" />
                                                <span className="font-semibold text-sm">Conectado com Sucesso</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Sua conta Bybit está conectada e sincronizando dados em tempo real.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Última sincronização:</span>
                                                <span className="font-medium">Há 2 minutos</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Modo:</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {useTestnet ? 'Testnet' : 'Mainnet'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={handleDisconnect}
                                        >
                                            Desconectar Bybit
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Future Integrations */}
                        <Card className="opacity-60">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                            <LinkIcon className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Outras Exchanges</CardTitle>
                                            <CardDescription className="text-xs">
                                                Em breve: Binance, Coinbase, OKX
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">Em Breve</Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Preferências de Notificação
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Alertas de DCA</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Notificar quando DCA for executado
                                        </p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Alertas de Preço</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Notificar sobre mudanças significativas
                                        </p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Resumo Semanal</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Receber resumo do portfolio por email
                                        </p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Investor Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Type</p>
                                        <p className="font-medium text-sm">Growth Seeker</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Goal</p>
                                        <p className="font-medium text-sm">Growth</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Risk</p>
                                        <p className="font-medium text-sm">Medium Risk</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Experience</p>
                                        <p className="font-medium text-sm">Intermediate</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-background to-secondary/20">
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Ecosystem Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pb-4">
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-apice-success" />
                                        <span className="text-sm font-medium">Bybit</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-apice-success" />
                                        <span className="text-sm font-medium">AI Trade Tool</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                        <span className="text-sm font-medium">Bitradex AI Bot</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Bybit Connection Modal */}
            <Dialog open={showBybitModal} onOpenChange={setShowBybitModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Conectar Bybit</DialogTitle>
                        <DialogDescription>
                            Conecte sua conta Bybit para habilitar automação e dados em tempo real
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Tutorial Link */}
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => window.open('https://www.bybit.com/app/user/api-management', '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Como gerar API Keys na Bybit
                        </Button>

                        {/* API Key Input */}
                        <div className="space-y-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                placeholder="Cole sua API Key aqui"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>

                        {/* API Secret Input */}
                        <div className="space-y-2">
                            <Label htmlFor="api-secret">API Secret</Label>
                            <Input
                                id="api-secret"
                                type="password"
                                placeholder="Cole seu API Secret aqui"
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                            />
                        </div>

                        {/* Testnet Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="space-y-0.5">
                                <Label htmlFor="testnet">Usar Testnet</Label>
                                <p className="text-xs text-muted-foreground">
                                    Para testes sem risco
                                </p>
                            </div>
                            <Switch
                                id="testnet"
                                checked={useTestnet}
                                onCheckedChange={setUseTestnet}
                            />
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                                Suas chaves são criptografadas com AES-256 e nunca compartilhadas. Recomendamos criar uma API key com permissões mínimas (Read + Trade).
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowBybitModal(false)}
                            disabled={isConnecting}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConnectBybit}
                            disabled={isConnecting || !apiKey || !apiSecret}
                            className="w-full sm:w-auto"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Conectar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
