import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAiAdvisor } from '@/hooks/useAiAdvisor';
import { useAppStore } from '@/store/appStore';
import {
  X, Send, Loader2, Sparkles, Trash2,
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
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasActivePlans = useMemo(
    () => dcaPlans.some((p) => p.isActive),
    [dcaPlans]
  );
  const quickPrompts = hasActivePlans ? ADVANCED_PROMPTS : BEGINNER_PROMPTS;

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
            aria-label="Open AI advisor"
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[100px] right-4 z-50 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-500/20 flex items-center justify-center border border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
          >
            <AiSparkleIcon size={18} className="text-white" />
            {/* Tiny live dot */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[1.5px] border-background" />
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 overflow-hidden"
              style={{
                height: '75vh',
                maxHeight: '600px',
                background: 'rgba(15, 18, 35, 0.92)',
                backdropFilter: 'blur(40px) saturate(180%)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/30">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                  <AiSparkleIcon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Apice AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-muted-foreground">Live market data</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {chatMessages.length > 0 && (
                    <button
                      aria-label="Clear chat"
                      onClick={clearChat}
                      className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    aria-label="Close chat"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm mb-1">Ask me anything about crypto investing</p>
                      <p className="text-xs text-muted-foreground max-w-[260px]">
                        I use real-time market data and the Apice methodology to give you personalized guidance.
                      </p>
                    </div>

                    {/* Quick Prompts */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleQuickPrompt(prompt)}
                          disabled={isLoading}
                          className="rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-white/[0.1] hover:text-foreground transition-all active:scale-95 whitespace-nowrap"
                        >
                          {prompt}
                        </button>
                      ))}
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
              <div className="px-5 py-3 bg-white/[0.04] border-t border-white/5">
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
