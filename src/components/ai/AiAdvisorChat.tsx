import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAiAdvisor } from '@/hooks/useAiAdvisor';
import { useAppStore } from '@/store/appStore';
import {
  X, Send, Loader2, Trash2, ArrowRight, TrendingUp, Calendar, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import ReactMarkdown from 'react-markdown';

function AiSparkleIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
    </svg>
  );
}

const BEGINNER_PROMPTS = [
  'How does DCA work?',
  'How much should I invest weekly?',
  'BTC or ETH, which to choose?',
  "What's the Apice methodology?",
];

const ADVANCED_PROMPTS = [
  'How is my portfolio doing?',
  'Should I increase my weekly amount?',
  "What's the market outlook today?",
  'Explain my DCA plan strategy',
];

export function AiAdvisorChat() {
  const { sendMessage, clearChat, chatMessages, isLoading } = useAiAdvisor();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const investorType = useAppStore((s) => s.investorType);
  const userProfile = useAppStore((s) => s.userProfile);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const setupProgress = useAppStore((s) => s.setupProgress);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasActivePlans = useMemo(
    () => dcaPlans.some((p) => p.isActive),
    [dcaPlans]
  );
  const quickPrompts = hasActivePlans ? ADVANCED_PROMPTS : BEGINNER_PROMPTS;

  // Personalized daily briefing — derived from setup state
  const briefing = useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = userProfile?.name || investorType || 'Investor';
    const hasExchange =
      missionProgress.m2_apiConnected || setupProgress.exchangeAccountCreated;
    const hasPortfolio =
      missionProgress.m3_portfolioSelected || setupProgress.corePortfolioSelected;
    const hasDCA = dcaPlans.some((p) => p.isActive);

    if (!hasExchange) {
      return {
        greeting: `${timeOfDay}, ${name}.`,
        headline: "Let's get your setup live.",
        brief:
          "You're 2 minutes from having Apice run your discipline 24/7. Connect an exchange (read-only keys — we never hold funds) to unlock everything else.",
        primaryAction: {
          label: 'Connect exchange',
          icon: Zap,
          onClick: () => {
            setIsOpen(false);
            navigate('/settings');
          },
        },
        secondaryAction: {
          label: 'How does this work?',
          icon: ArrowRight,
          prompt: 'How does Apice work, step by step?',
        },
      };
    }

    if (!hasPortfolio) {
      return {
        greeting: `${timeOfDay}, ${name}.`,
        headline: 'Pick a core portfolio.',
        brief:
          "Your risk profile maps to a portfolio Apice already optimized. Reviewing takes 3 minutes and enables AI Trade + DCA.",
        primaryAction: {
          label: 'Pick portfolio',
          icon: TrendingUp,
          onClick: () => {
            setIsOpen(false);
            navigate('/strategies');
          },
        },
        secondaryAction: {
          label: 'Which matches my profile?',
          icon: ArrowRight,
          prompt: `Which portfolio matches a ${investorType || 'balanced'} profile?`,
        },
      };
    }

    if (!hasDCA) {
      return {
        greeting: `${timeOfDay}, ${name}.`,
        headline: 'Start the compound engine.',
        brief:
          "A weekly DCA plan is the Apice edge — small, consistent, emotion-free. Set it once, watch the base grow.",
        primaryAction: {
          label: 'Create DCA plan',
          icon: Calendar,
          onClick: () => {
            setIsOpen(false);
            navigate('/dca-planner');
          },
        },
        secondaryAction: {
          label: "How should I size my DCA?",
          icon: ArrowRight,
          prompt: 'How should I size my weekly DCA amount for my profile?',
        },
      };
    }

    // Fully live state — contextual daily brief
    return {
      greeting: `${timeOfDay}, ${name}.`,
      headline: 'Your setup is live.',
      brief:
        "Discipline beats discovery. Today I'd double-check your allocation drift and review the weekly market note. Nothing requires urgent action — the engine is compounding.",
      primaryAction: {
        label: "Today's market outlook",
        icon: TrendingUp,
        prompt: "What's the market outlook today and how does it affect my plan?",
      },
      secondaryAction: {
        label: 'My portfolio health',
        icon: ArrowRight,
        prompt: 'How is my portfolio doing vs my goals this week?',
      },
    };
  }, [
    userProfile?.name,
    investorType,
    missionProgress.m2_apiConnected,
    missionProgress.m3_portfolioSelected,
    setupProgress.exchangeAccountCreated,
    setupProgress.corePortfolioSelected,
    dcaPlans,
    navigate,
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput('');
    trackEvent(AnalyticsEvents.AI_CHAT_SENT);
    await sendMessage(msg);
  };

  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            aria-label="Open Apice AI advisor"
            onClick={() => setIsOpen(true)}
            className="group fixed bottom-24 right-6 z-50 lg:bottom-8 lg:right-8"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            {/* Ambient emerald halo — per brand book "apice-ai-mark" spec */}
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-18px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--apice-emerald) / 0.45), transparent 70%)",
              }}
              animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Orb body — emerald per Apice AI mark */}
            <span
              aria-hidden="true"
              className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 backdrop-blur transition-all duration-300 group-hover:border-white/25"
              style={{
                background:
                  "radial-gradient(circle at 38% 30%, #6EE7A8 0%, #38D68A 35%, #16A661 75%, #0F5D3F 100%)",
                boxShadow:
                  "0 10px 30px -8px hsl(var(--apice-emerald) / 0.5), 0 0 0 1px hsl(var(--apice-emerald-deep) / 0.3) inset, 0 0 40px -6px hsl(var(--apice-emerald) / 0.4)",
              }}
            >
              {/* Specular highlight */}
              <span
                aria-hidden="true"
                className="absolute inset-1 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 40% 30%, rgba(247,243,237,0.55) 0%, rgba(247,243,237,0.1) 40%, transparent 70%)",
                }}
              />
              {/* Core energy point */}
              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DFFCEA]"
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                style={{ boxShadow: "0 0 12px 4px hsl(var(--apice-emerald) / 0.7)" }}
              />
            </span>
            {/* Live activity dot */}
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F1626] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-3xl lg:left-auto lg:right-6 lg:bottom-6 lg:w-[420px] lg:rounded-3xl"
              style={{
                height: '75vh',
                maxHeight: '640px',
                background: 'rgba(10,15,30,0.92)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow:
                  '0 -20px 60px -20px rgba(0,0,0,0.6), 0 0 40px -10px hsl(var(--apice-emerald) / 0.2)',
              }}
            >
              {/* Header — brand-correct emerald orb (per BRAND-BOOK v2.0 Apice AI) */}
              <div className="flex items-center gap-3 border-b border-white/5 p-4">
                <div
                  aria-hidden="true"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15"
                  style={{
                    background:
                      'radial-gradient(circle at 38% 30%, #6EE7A8 0%, #38D68A 35%, #16A661 75%, #0F5D3F 100%)',
                    boxShadow:
                      '0 0 24px -4px hsl(var(--apice-emerald) / 0.5), 0 0 0 1px hsl(var(--apice-emerald-deep) / 0.3) inset',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-1 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 40% 30%, rgba(247,243,237,0.45) 0%, transparent 65%)',
                    }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-[#DFFCEA]"
                    animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ boxShadow: '0 0 8px 3px hsl(var(--apice-emerald) / 0.7)' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-semibold tracking-tight text-white">
                    Apice AI
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    />
                    <span className="text-[11px] text-white/50">Live · Synth of 6 experts</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {chatMessages.length > 0 && (
                    <button
                      type="button"
                      aria-label="Clear chat"
                      onClick={clearChat}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Close chat"
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <X className="h-4 w-4 text-white/70" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                style={{ height: 'calc(100% - 140px)' }}
              >
                {chatMessages.length === 0 ? (
                  <div className="space-y-5">
                    {/* Daily Briefing Card — emerald accent, personalized */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="relative overflow-hidden rounded-2xl border border-[hsl(var(--apice-emerald))]/25 bg-white/[0.03] p-5 backdrop-blur"
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                          background:
                            'radial-gradient(600px at 0% 0%, hsl(var(--apice-emerald) / 0.12), transparent 60%)',
                        }}
                      />

                      <div className="relative">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--apice-emerald))]">
                          Today's brief
                        </p>
                        <p className="mt-1.5 text-[13px] font-medium text-white/55">
                          {briefing.greeting}
                        </p>
                        <h3 className="font-display mt-1 text-lg font-semibold tracking-tight text-white">
                          {briefing.headline}
                        </h3>
                        <p className="mt-3 text-[13px] leading-relaxed text-white/70">
                          {briefing.brief}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if ('onClick' in briefing.primaryAction && briefing.primaryAction.onClick) {
                                briefing.primaryAction.onClick();
                              } else if ('prompt' in briefing.primaryAction && briefing.primaryAction.prompt) {
                                handleQuickPrompt(briefing.primaryAction.prompt);
                              }
                            }}
                            disabled={isLoading}
                            className="group flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-[12px] font-semibold text-[#050816] shadow-[0_0_20px_-4px_hsl(var(--apice-emerald)/0.5)] transition-all hover:shadow-[0_0_28px_-4px_hsl(var(--apice-emerald)/0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
                            style={{
                              background:
                                'linear-gradient(135deg, #6EE7A8 0%, #38D68A 50%, #16A661 100%)',
                            }}
                          >
                            <span className="flex items-center gap-1.5 min-w-0 flex-1">
                              <briefing.primaryAction.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{briefing.primaryAction.label}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if ('prompt' in briefing.secondaryAction && briefing.secondaryAction.prompt) {
                                handleQuickPrompt(briefing.secondaryAction.prompt);
                              }
                            }}
                            disabled={isLoading}
                            className="group flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-[12px] font-semibold text-white/85 transition-all hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {briefing.secondaryAction.label}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick prompts — 2×2 grid */}
                    <div>
                      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                        More questions
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleQuickPrompt(prompt)}
                            disabled={isLoading}
                            className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left text-[12px] font-medium text-white/70 transition-all hover:border-white/15 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed',
                          msg.role === 'user'
                            ? 'apice-gradient-primary rounded-2xl rounded-tr-md text-primary-foreground'
                            : 'bg-white/[0.04] rounded-2xl rounded-tl-md border border-border/30'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <AiSparkleIcon size={12} className="text-primary" />
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Apice AI</span>
                          </div>
                        )}
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-1.5 last:mb-0 text-[13px] leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li className="text-[13px]">{children}</li>,
                                h1: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
                                h2: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
                                h3: ({ children }) => <h4 className="text-xs font-semibold text-white mb-1">{children}</h4>,
                                code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/10 text-[12px] font-mono">{children}</code>,
                                table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="text-[12px] w-full">{children}</table></div>,
                                th: ({ children }) => <th className="text-left px-2 py-1 border-b border-white/10 text-white/70 font-medium">{children}</th>,
                                td: ({ children }) => <td className="px-2 py-1 border-b border-white/5">{children}</td>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-[13px] leading-relaxed">{msg.content}</p>
                        )}
                        <p className={cn(
                          'text-[11px] mt-1.5 opacity-50',
                          msg.role === 'user' ? 'text-right' : ''
                        )}>
                          {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-secondary/60 border border-border/30">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Analyzing markets...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="px-5 py-3 glass-light border-t border-border/10">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about crypto, DCA, or your portfolio..."
                    disabled={isLoading}
                    maxLength={500}
                    className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <Button
                    aria-label="Send message"
                    size="sm"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-xl p-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/40 text-center mt-1.5">
                  AI advisor uses live market data. Not financial advice.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
