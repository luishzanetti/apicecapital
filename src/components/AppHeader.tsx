import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { NotificationBell } from './NotificationBell';
import { useTranslation } from '@/hooks/useTranslation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from '@/components/ui/button';
import { TriangleMark } from '@/components/brand/BrandMark';
import { ApiceLogo } from '@/components/brand';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            pageTitles: {
              '/home': null,
              '/portfolio': 'Portfólio',
              '/strategies': 'Estratégias',
              '/learn': 'Aprender',
              '/settings': 'Configurações',
              '/upgrade': 'Atualizar plano',
              '/analytics': 'Análises',
              '/dca-planner': 'Planejador DCA',
            } as Record<string, string | null>,
            searchAria: 'Buscar',
            searchPlaceholder: 'Buscar páginas, ações...',
            noResults: 'Nenhum resultado encontrado.',
            pagesHeading: 'Páginas',
            quickHeading: 'Ações rápidas',
            home: 'Início',
            portfolio: 'Portfólio e Ativos',
            strategies: 'Estratégias',
            analytics: 'Análises e Histórico',
            learn: 'Aprender e Academia',
            settings: 'Configurações',
            dca: 'Planejador DCA',
            connectBybit: 'Conectar Bybit',
            upgrade: 'Fazer upgrade para Pro',
          }
        : {
            pageTitles: {
              '/home': null,
              '/portfolio': 'Portfolio',
              '/strategies': 'Strategies',
              '/learn': 'Learn',
              '/settings': 'Settings',
              '/upgrade': 'Upgrade',
              '/analytics': 'Analytics',
              '/dca-planner': 'DCA Planner',
            } as Record<string, string | null>,
            searchAria: 'Search',
            searchPlaceholder: 'Search pages and actions...',
            noResults: 'No results found.',
            pagesHeading: 'Pages',
            quickHeading: 'Quick actions',
            home: 'Home',
            portfolio: 'Portfolio & Assets',
            strategies: 'Strategies',
            analytics: 'Analytics & History',
            learn: 'Learn & Academy',
            settings: 'Settings',
            dca: 'DCA Planner',
            connectBybit: 'Connect Bybit',
            upgrade: 'Upgrade to Pro',
          },
    [language]
  );

  const pageTitle = copy.pageTitles[location.pathname];
  const isHome = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-center border-b border-white/5 bg-[#0F1626]/90 px-5 backdrop-blur-xl lg:hidden">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go to home"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
          >
            <AnimatePresence mode="wait">
              {isHome || !pageTitle ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ApiceLogo
                    variant="unified-horizontal-dark"
                    size={52}
                    aria-label="Apice — Global AI Investing"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={pageTitle}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5"
                >
                  <TriangleMark variant="circle" size={36} aria-hidden="true" />
                  <span className="font-display text-sm font-semibold tracking-tight text-white">
                    {pageTitle}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            aria-label={copy.searchAria}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>

          <NotificationBell />
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={copy.searchPlaceholder} />
        <CommandList>
          <CommandEmpty>{copy.noResults}</CommandEmpty>
          <CommandGroup heading={copy.pagesHeading}>
            <CommandItem onSelect={() => { navigate('/home'); setOpen(false); }}>
              {copy.home}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/portfolio'); setOpen(false); }}>
              {copy.portfolio}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/strategies'); setOpen(false); }}>
              {copy.strategies}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/analytics'); setOpen(false); }}>
              {copy.analytics}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/learn'); setOpen(false); }}>
              {copy.learn}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/settings'); setOpen(false); }}>
              {copy.settings}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/automations'); setOpen(false); }}>
              Automations
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/ai-trade'); setOpen(false); }}>
              ALTIS AI Trade
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/referrals'); setOpen(false); }}>
              Referrals
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/cashback-dashboard'); setOpen(false); }}>
              Cashback Dashboard
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={copy.quickHeading}>
            <CommandItem onSelect={() => { navigate('/dca-planner'); setOpen(false); }}>
              {copy.dca}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/settings'); setOpen(false); }}>
              {copy.connectBybit}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/upgrade'); setOpen(false); }}>
              {copy.upgrade}
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/support'); setOpen(false); }}>
              Support
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
