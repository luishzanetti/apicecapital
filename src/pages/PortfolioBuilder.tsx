import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/appStore';
import { ArrowLeft, AlertTriangle, Shield, Save } from 'lucide-react';

interface Allocation {
  asset: string;
  percentage: number;
  color: string;
}

const defaultAllocations: Allocation[] = [
  { asset: 'BTC', percentage: 40, color: 'hsl(33, 100%, 50%)' },
  { asset: 'ETH', percentage: 30, color: 'hsl(217, 100%, 60%)' },
  { asset: 'SOL', percentage: 20, color: 'hsl(280, 100%, 60%)' },
  { asset: 'USDT', percentage: 10, color: 'hsl(152, 70%, 50%)' },
];

export default function PortfolioBuilder() {
  const navigate = useNavigate();
  const setSelectedPortfolio = useAppStore((s) => s.setSelectedPortfolio);
  const [allocations, setAllocations] = useState<Allocation[]>(defaultAllocations);

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const isValid = totalPercentage === 100;

  // Calculate risk score based on allocation
  const getRiskScore = () => {
    const btcEthPercentage = allocations
      .filter(a => ['BTC', 'ETH', 'USDT'].includes(a.asset))
      .reduce((sum, a) => sum + a.percentage, 0);
    
    if (btcEthPercentage >= 80) return { label: 'Low Risk', variant: 'low' as const };
    if (btcEthPercentage >= 60) return { label: 'Medium Risk', variant: 'medium' as const };
    return { label: 'High Risk', variant: 'high' as const };
  };

  // Calculate diversification score
  const getDiversificationScore = () => {
    const nonZeroAllocations = allocations.filter(a => a.percentage > 0).length;
    const maxSinglePosition = Math.max(...allocations.map(a => a.percentage));
    
    if (nonZeroAllocations >= 4 && maxSinglePosition <= 40) return 'High';
    if (nonZeroAllocations >= 3 && maxSinglePosition <= 50) return 'Medium';
    return 'Low';
  };

  const handleSliderChange = (index: number, newValue: number[]) => {
    const newPercentage = newValue[0];
    const diff = newPercentage - allocations[index].percentage;
    
    // Update the allocation
    const updated = [...allocations];
    updated[index] = { ...updated[index], percentage: newPercentage };
    
    // Try to adjust other allocations proportionally
    if (diff !== 0) {
      const others = updated.filter((_, i) => i !== index && updated[i].percentage > 0);
      if (others.length > 0) {
        const adjustPer = diff / others.length;
        for (let i = 0; i < updated.length; i++) {
          if (i !== index && updated[i].percentage > 0) {
            updated[i] = {
              ...updated[i],
              percentage: Math.max(0, Math.min(100, updated[i].percentage - adjustPer))
            };
          }
        }
      }
    }
    
    setAllocations(updated);
  };

  const handleSave = () => {
    if (!isValid) return;
    setSelectedPortfolio('custom', allocations);
    navigate('/home');
  };

  const riskScore = getRiskScore();
  const diversification = getDiversificationScore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Portfolio Builder</h1>
            <p className="text-xs text-muted-foreground">Create your own allocation</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-32"
      >
        {/* Allocation Preview */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Your Allocation</h3>
              <Badge variant={riskScore.variant} size="sm">{riskScore.label}</Badge>
            </div>
            
            {/* Allocation Bar */}
            <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-4">
              {allocations.map((alloc, i) => (
                <motion.div
                  key={i}
                  className="h-full transition-all"
                  style={{ 
                    width: `${alloc.percentage}%`, 
                    backgroundColor: alloc.color 
                  }}
                  layout
                />
              ))}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Total</p>
                <p className={`font-semibold ${isValid ? 'text-apice-success' : 'text-destructive'}`}>
                  {totalPercentage}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Diversification</p>
                <p className="font-semibold">{diversification}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Sliders */}
        <Card>
          <CardContent className="pt-5 space-y-6">
            <h3 className="font-semibold text-sm">Adjust Allocations</h3>
            
            {allocations.map((alloc, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: alloc.color }}
                    />
                    <span className="text-sm font-medium">{alloc.asset}</span>
                  </div>
                  <span className="text-sm font-semibold">{Math.round(alloc.percentage)}%</span>
                </div>
                <Slider
                  value={[alloc.percentage]}
                  onValueChange={(v) => handleSliderChange(i, v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Validation Warning */}
        {!isValid && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Total allocation must equal 100%. Currently at {totalPercentage}%.
            </p>
          </div>
        )}

        {/* Trust */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            This is a planning tool. Execution happens on your exchange.
          </p>
        </div>
      </motion.div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border safe-bottom">
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={!isValid}
        >
          <Save className="w-4 h-4" />
          Save Portfolio
        </Button>
      </div>
    </div>
  );
}
