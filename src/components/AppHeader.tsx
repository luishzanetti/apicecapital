import { Bell, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Map routes to page titles
const pageTitles: Record<string, string> = {
    '/home': null,
    '/portfolio': 'Portfolio',
    '/strategies': 'Strategies',
    '/learn': 'Learn',
    '/settings': 'Settings',
    '/upgrade': 'Upgrade',
    '/cashback': 'Cashback',
    '/insights': 'Insights',
};

export function AppHeader() {
    const investorType = useAppStore((s) => s.investorType);
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [hasNotif, setHasNotif] = useState(true);

    const pageTitle = pageTitles[location.pathname];
    const isHome = location.pathname === '/home' || location.pathname === '/';

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-nav px-5 flex items-center justify-between">
            {/* Logo & Brand / Page Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2.5 press-scale"
                >
                    <div className="w-8 h-8 rounded-xl apice-gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
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
                                strokeWidth="3.5"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <path
                                d="M20 14L29 32H11L20 14Z"
                                fill="currentColor"
                                opacity="0.3"
                            />
                        </svg>
                    </div>

                    <AnimatePresence mode="wait">
                        {!isHome && pageTitle ? (
                            <motion.span
                                key={pageTitle}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 6 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm font-bold tracking-tight"
                            >
                                {pageTitle}
                            </motion.span>
                        ) : (
                            <motion.div
                                key="brand"
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 6 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="text-sm font-bold tracking-tight leading-none">Apice</h2>
                                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.18em] font-semibold leading-none mt-0.5">
                                    Capital
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all press-scale"
                    onClick={() => setOpen(true)}
                >
                    <Search className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl relative text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all press-scale"
                        >
                            <Bell className="w-4 h-4" />
                            {hasNotif && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse-dot"
                                />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-76 mt-2 rounded-2xl border-border/40 glass-card p-0 overflow-hidden shadow-xl"
                    >
                        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                            <h3 className="text-sm font-bold">Notifications</h3>
                            <button
                                className="text-[10px] text-primary font-semibold"
                                onClick={() => setHasNotif(false)}
                            >
                                Mark all read
                            </button>
                        </div>
                        <div className="py-1">
                            <DropdownMenuItem className="px-4 py-3.5 focus:bg-primary/5 cursor-pointer rounded-none gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bell className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold">Welcome to Apice!</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                        Start your journey by completing your first mission.
                                    </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="px-4 py-3.5 focus:bg-primary/5 cursor-pointer rounded-none gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <Search className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold">Market Insight Ready</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                        A new analysis for {investorType || 'your profile'} is available.
                                    </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Search Dialog */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search pages, actions..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Pages">
                        <CommandItem onSelect={() => { navigate('/home'); setOpen(false); }}>
                            Home
                        </CommandItem>
                        <CommandItem onSelect={() => { navigate('/portfolio'); setOpen(false); }}>
                            Portfolio & Assets
                        </CommandItem>
                        <CommandItem onSelect={() => { navigate('/strategies'); setOpen(false); }}>
                            Strategies
                        </CommandItem>
                        <CommandItem onSelect={() => { navigate('/learn'); setOpen(false); }}>
                            Learn & Academy
                        </CommandItem>
                        <CommandItem onSelect={() => { navigate('/settings'); setOpen(false); }}>
                            Settings
                        </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => { navigate('/settings'); setOpen(false); }}>
                            Connect Bybit
                        </CommandItem>
                        <CommandItem onSelect={() => { navigate('/upgrade'); setOpen(false); }}>
                            Upgrade to Pro
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </header>
    );
}
