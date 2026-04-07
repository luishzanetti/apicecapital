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
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-center glass-nav px-5 lg:hidden">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 press-scale">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl apice-gradient-primary shadow-lg shadow-primary/30">
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none" className="text-white">
                <path
                  d="M20 4L36 34H4L20 4Z"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path d="M20 14L29 32H11L20 14Z" fill="currentColor" opacity="0.3" />
              </svg>
            </div>

            <AnimatePresence mode="wait">
              {isHome || !pageTitle ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-sm font-bold tracking-tight leading-none">Apice</h2>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] leading-none text-muted-foreground">
                    Capital
                  </p>
                </motion.div>
              ) : (
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
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            aria-label={copy.searchAria}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground press-scale"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
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
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
