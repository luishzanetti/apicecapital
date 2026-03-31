import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Trash2, ArrowRight, TrendingUp, Zap, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { AppNotification } from '@/store/types';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, string> = {
  dca: '💰',
  system: '⚙️',
  mission: '🎯',
  market: '📈',
};

const typeColors: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400' },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400' },
};

function TypeIcon({ type }: { type: string }) {
  const cls = cn('w-3.5 h-3.5', typeColors[type]?.icon || 'text-muted-foreground');
  switch (type) {
    case 'success': return <Check className={cls} />;
    case 'warning': return <AlertTriangle className={cls} />;
    case 'error': return <Zap className={cls} />;
    default: return <Info className={cls} />;
  }
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({ notification, onAction }: { notification: AppNotification; onAction: () => void }) {
  const navigate = useNavigate();
  const markAsRead = useAppStore((s) => s.markAsRead);
  const removeNotification = useAppStore((s) => s.removeNotification);
  const colors = typeColors[notification.type] || typeColors.info;

  const handleClick = () => {
    markAsRead(notification.id);
    if (notification.actionRoute) {
      navigate(notification.actionRoute);
      onAction();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className={cn(
        'relative p-3.5 rounded-xl border transition-all',
        notification.read ? 'bg-secondary/20 border-border/20 opacity-70' : `${colors.bg} ${colors.border}`,
      )}
    >
      <button onClick={handleClick} className="w-full text-left">
        <div className="flex items-start gap-2.5">
          <span className="text-base mt-0.5 shrink-0">{categoryIcons[notification.category] || '📌'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TypeIcon type={notification.type} />
              <span className="text-xs font-bold truncate">{notification.title}</span>
              {!notification.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{notification.message}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground/60">{timeAgo(notification.timestamp)}</span>
              {notification.actionRoute && (
                <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
                  {notification.actionLabel || 'View'}
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-secondary/60 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        <X className="w-2.5 h-2.5 text-muted-foreground" />
      </button>
    </motion.div>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useAppStore((s) => s.notifications);
  const markAllAsRead = useAppStore((s) => s.markAllAsRead);
  const clearNotifications = useAppStore((s) => s.clearNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-9 h-9 rounded-full bg-secondary/60 border border-border/40 flex items-center justify-center hover:bg-secondary transition-all"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border/50 flex flex-col"
            >
              {/* Header */}
              <div className="px-5 pt-10 pb-4 flex items-center justify-between border-b border-border/30">
                <div>
                  <h2 className="font-bold text-base">Notifications</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/40 flex items-center justify-center mb-4">
                      <Bell className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground/60">No notifications yet</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">
                      DCA executions, mission updates and alerts will appear here
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => (
                      <NotificationItem key={n.id} notification={n} onAction={() => setIsOpen(false)} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
