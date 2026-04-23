import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, PieChart, Compass, BookOpen, MoreHorizontal, BarChart3, CalendarClock, Crown, Headphones, User, Gift, X, Award, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { AltisIcon } from '@/components/brand/AltisIcon';
import { ApexAiIcon } from '@/components/brand/ApexAiIcon';
import { useAiChat } from '@/components/ai/AiChatContext';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const { t } = useTranslation();
  const { isOpen: aiChatOpen } = useAiChat();

  const navItems = [
    { to: '/home', icon: Home, label: t('nav.home') },
    { to: '/portfolio', icon: PieChart, label: t('nav.portfolio') },
    { to: '/ai-trade', icon: AltisIcon, label: 'ALTIS' },
    { to: '/apex-ai', icon: ApexAiIcon, label: 'Apex AI' },
    { to: '/dca-planner', icon: CalendarClock, label: 'DCA' },
    { to: '__more__', icon: MoreHorizontal, label: t('nav.more') },
  ];

  const moreMenuItems = [
    { to: '/strategies', icon: Compass, label: t('nav.strategies'), desc: 'Explore all investment strategies' },
    { to: '/analytics', icon: BarChart3, label: t('nav.analytics'), desc: t('nav.analyticsDesc') },
    { to: '/learn', icon: BookOpen, label: t('nav.learn'), desc: 'Courses and educational content' },
    { to: '/challenges', icon: Trophy, label: 'Challenges', desc: 'Daily, weekly & seasonal missions' },
    { to: '/badges', icon: Award, label: 'Badges', desc: 'Your trophy room of achievements' },
    { to: '/settings', icon: User, label: t('nav.profileSettings'), desc: t('nav.profileSettingsDesc') },
    { to: '/upgrade', icon: Crown, label: t('nav.upgrade'), desc: t('nav.upgradeDesc') },
    { to: '/referrals', icon: Gift, label: t('nav.referrals'), desc: t('nav.referralsDesc') },
    { to: '/support', icon: Headphones, label: t('nav.support'), desc: t('nav.supportDesc') },
  ];

  const isMoreActive = moreMenuItems.some(
    (m) => location.pathname === m.to || location.pathname.startsWith(m.to + '/')
  );

  return (
    <>
      {/* More Menu Bottom Sheet */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[45] rounded-t-3xl overflow-hidden"
              style={{
                background: 'hsl(var(--card) / var(--glass-bg-heavy, 0.90))',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid hsl(var(--border) / 0.15)',
                borderBottom: 'none',
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="text-sm font-semibold text-foreground">{t('nav.more')}</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="px-4 pb-8 space-y-1">
                {moreMenuItems.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    location.pathname.startsWith(item.to + '/');

                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        setShowMore(false);
                        setTimeout(() => navigate(item.to), 150);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-secondary/30'
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                          isActive ? 'bg-primary/15' : 'bg-secondary/30'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'w-[18px] h-[18px]',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )}
                          strokeWidth={1.8}
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar — hidden when AI chat is open (clean takeover).
          Outer div owns horizontal centering (translate-x via Tailwind) so the
          inner motion.div can freely animate Y/opacity without conflict. */}
      <AnimatePresence>
        {!aiChatOpen && (
          <div
            className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-[440px]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="pointer-events-auto"
          >
        <nav
          className="flex items-center justify-between px-2.5 py-2.5 rounded-[22px]"
          style={{
            background: 'hsl(var(--card) / var(--glass-bg-heavy, 0.82))',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid hsl(var(--border) / 0.15)',
            boxShadow:
              '0 8px 32px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.04), inset 0 1px 0 hsl(var(--foreground) / 0.04)',
          }}
        >
          {navItems.map((item) => {
            const isMore = item.to === '__more__';
            const isActive = isMore
              ? isMoreActive
              : location.pathname === item.to ||
                location.pathname.startsWith(item.to + '/') ||
                (item.to === '/home' && location.pathname === '/');

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(true)}
                  aria-label="More options"
                  className="relative flex flex-1 flex-col items-center gap-1 px-1 py-1 press-scale min-w-0"
                >
                  <motion.div
                    animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <MoreHorizontal
                      className={cn(
                        'w-[22px] h-[22px] transition-colors duration-200',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </motion.div>
                  <span
                    className={cn(
                      'text-[10.5px] font-medium tracking-tight transition-colors duration-200 max-w-full truncate',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navGlow"
                      className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="relative flex flex-1 flex-col items-center gap-1 px-1 py-1 press-scale min-w-0"
              >
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <item.icon
                    className={cn(
                      'w-[22px] h-[22px] transition-colors duration-200',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </motion.div>
                <span
                  className={cn(
                    'text-[11px] font-medium tracking-wide transition-colors duration-200',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navGlow"
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
