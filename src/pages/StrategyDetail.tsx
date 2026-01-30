import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { strategies } from '@/data/sampleData';
import { ArrowLeft, Check, Shield, AlertTriangle, Zap } from 'lucide-react';

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const strategy = strategies.find((s) => s.id === id);

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Strategy not found</p>
      </div>
    );
  }

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-headline">{strategy.name}</h1>
            <Badge variant={getRiskVariant(strategy.risk)} size="sm" className="mt-1">
              {strategy.risk.charAt(0).toUpperCase() + strategy.risk.slice(1)} Risk
            </Badge>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6"
      >
        {/* Overview */}
        <Card variant="elevated">
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              What It Does
            </h3>
            <p className="text-caption text-muted-foreground leading-relaxed">
              {strategy.description}
            </p>
          </CardContent>
        </Card>

        {/* For Who */}
        <Card variant="default">
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3">Who Is This For</h3>
            <p className="text-caption text-muted-foreground leading-relaxed">
              {strategy.forWho}
            </p>
          </CardContent>
        </Card>

        {/* Risk Controls */}
        <Card variant="default">
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-apice-success" />
              Risk Controls
            </h3>
            <div className="space-y-3">
              {strategy.riskControls.map((control, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-apice-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-apice-success" />
                  </div>
                  <p className="text-caption text-muted-foreground">{control}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-4">
            <p className="text-micro text-muted-foreground mb-1">Expected Range</p>
            <p className="font-semibold text-primary">{strategy.expectedRange}</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-micro text-muted-foreground mb-1">Min. Capital</p>
            <p className="font-semibold">{strategy.minCapital}</p>
          </Card>
        </div>

        {/* Activation Steps */}
        <Card variant="premium">
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-4">How to Activate</h3>
            <div className="space-y-3">
              {strategy.activationSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center">
                    <span className="text-micro text-primary font-medium">{i + 1}</span>
                  </div>
                  <p className="text-caption">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-micro text-muted-foreground">
            <strong className="text-foreground">Risk Disclosure:</strong> Trading involves risk. 
            Past performance does not guarantee future results. Only invest what you can afford to lose.
          </p>
        </div>

        {/* CTA */}
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={() => navigate('/automate')}
        >
          Activate This Strategy
        </Button>

        {/* Trust */}
        <p className="text-center text-micro text-muted-foreground">
          Your funds remain on your exchange.
          <br />
          You can stop anytime.
        </p>
      </motion.div>
    </div>
  );
}
