import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuHeader,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
    const investorType = useAppStore((s) => s.investorType);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg apice-gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 40 40"
                        fill="none"
                        className="text-white"
                    >
                        <path
                            d="M20 4L36 34H4L20 4Z"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </svg>
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-tight">Apice</h2>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold leading-none">Capital</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-muted-foreground">
                    <Search className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl relative text-muted-foreground">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 mt-2 rounded-2xl border-border/40 backdrop-blur-xl bg-card/95">
                        <div className="px-4 py-3 border-b border-border/40">
                            <h3 className="text-sm font-bold">Notifications</h3>
                        </div>
                        <div className="py-2">
                            <DropdownMenuItem className="px-4 py-3 focus:bg-primary/5 cursor-pointer">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bell className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">Welcome to Apice!</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Start your journey by completing your first mission.</p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="px-4 py-3 focus:bg-primary/5 cursor-pointer">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Search className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">Market Insight Ready</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">A new analysis for {investorType || 'your profile'} is available.</p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
