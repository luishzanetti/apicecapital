import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { referralLinks } from '@/data/sampleData';
import { useAppStore } from '@/store/appStore';

export default function ReferralLinks() {
    const navigate = useNavigate();
    const trackLinkClick = useAppStore((s) => s.trackLinkClick);
    const linkClicks = useAppStore((s) => s.linkClicks);

    return (
        <div className="min-h-screen bg-background pb-28">
            {/* Header */}
            <div className="px-5 py-6 safe-top border-b border-border">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">Referral Links</h1>
                        <p className="text-xs text-muted-foreground">
                            Your ecosystem connections
                        </p>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 py-6 space-y-4 pb-24"
            >
                <p className="text-sm text-muted-foreground">
                    These are your referral links for the Apice Capital ecosystem. Click to open and track your connections.
                </p>

                <div className="space-y-3">
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
                                <CardContent className="pt-5 pb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <LinkIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm mb-1">{link.name}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                                            {isClicked && (
                                                <p className="text-xs text-apice-success mt-1">✓ Connected</p>
                                            )}
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
