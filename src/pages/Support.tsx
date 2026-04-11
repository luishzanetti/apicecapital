import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones, Send, BookOpen, Settings, HelpCircle, Search, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { faqItems } from '@/data/sampleData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';

interface SupportMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

const SUBJECT_OPTIONS = [
  'General',
  'Bybit Connection',
  'DCA Issue',
  'Billing',
  'Feature Request',
  'Bug Report',
] as const;

const QUICK_HELP = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of Apice Capital',
    icon: BookOpen,
    route: '/learn',
  },
  {
    title: 'Bybit Setup Guide',
    description: 'Connect your exchange account',
    icon: Settings,
    route: '/settings',
  },
  {
    title: 'DCA FAQ',
    description: 'Common questions about DCA',
    icon: HelpCircle,
    scrollTo: 'faq-section',
  },
] as const;

export default function Support() {
  const navigate = useNavigate();
  const userProfile = useAppStore((s) => s.userProfile);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');

  const filteredFaq = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSending(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const entry: SupportMessage = {
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Store locally until backend is available
    const existing = JSON.parse(localStorage.getItem('apice_support_messages') || '[]');
    existing.push(entry);
    localStorage.setItem('apice_support_messages', JSON.stringify(existing));

    toast.success("Message sent! We'll respond within 24 hours.");
    setMessage('');
    setSending(false);
  };

  const handleQuickHelp = (item: (typeof QUICK_HELP)[number]) => {
    if ('scrollTo' in item && item.scrollTo) {
      document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
    } else if ('route' in item && item.route) {
      navigate(item.route);
    }
  };

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
          <div className="flex items-center gap-3">
            <Headphones className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">How can we help?</h1>
              <p className="text-xs text-muted-foreground">We typically respond within 24 hours</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-8">
        {/* Contact Form */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="support-name" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Name *
                </label>
                <input
                  id="support-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="support-email" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email *
                </label>
                <input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="support-subject" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Subject
                </label>
                <select
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none"
                >
                  {SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="support-message" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Message *
                </label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Help Cards */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Quick Help
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_HELP.map((item) => (
              <Card
                key={item.title}
                className="cursor-pointer border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/20 hover:bg-white/[0.02] transition-all active:scale-95"
                onClick={() => handleQuickHelp(item)}
              >
                <CardContent className="p-4 text-center">
                  <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium text-xs leading-tight">{item.title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq-section">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Frequently Asked Questions
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search FAQ..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary/50 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {filteredFaq.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No matching questions found. Try a different search or contact us above.
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredFaq.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-border/30 rounded-xl px-4 bg-card/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="text-sm text-left">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-caption text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Emergency Contact</p>
            <p className="text-xs text-muted-foreground mt-1">
              For urgent security issues: <span className="text-primary font-medium">security@apice.capital</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
