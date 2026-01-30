import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Mail, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { faqItems } from '@/data/sampleData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-headline">Help & Support</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card variant="interactive" className="text-center py-5">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h4 className="font-medium text-sm">Live Chat</h4>
            <p className="text-micro text-muted-foreground">Get instant help</p>
          </Card>
          <Card variant="interactive" className="text-center py-5">
            <Mail className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h4 className="font-medium text-sm">Email Us</h4>
            <p className="text-micro text-muted-foreground">support@apice.io</p>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">FAQ</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-caption text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
