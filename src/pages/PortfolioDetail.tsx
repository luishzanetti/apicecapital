import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { portfolios } from '@/data/sampleData';
import { useAppStore } from '@/store/appStore';
import { ArrowLeft, Check, Shield, AlertTriangle, PieChart, Plus, Trash2 } from 'lucide-react';

export default function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setSelectedPortfolio = useAppStore((s) => s.setSelectedPortfolio);
  const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
  const userPortfolios = useAppStore((s) => s.userPortfolios);
  const addPortfolio = useAppStore((s) => s.addPortfolio);
  const removePortfolio = useAppStore((s) => s.removePortfolio);
  const setActivePortfolio = useAppStore((s) => s.setActivePortfolio);

  const portfolio = portfolios.find((p) => p.id === id);

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Portfolio not found</p>
      </div>
    );
  }

  const allocations = portfolio?.allocations || [];
  const isSelected = selectedPortfolio.portfolioId === portfolio.id;
  const userPortfolio = userPortfolios.find((p) => p.templateId === portfolio.id);
  const isInUserPortfolios = !!userPortfolio;
  const isActiveUserPortfolio = userPortfolio?.isActive ?? false;

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'low';
      case 'balanced': return 'medium';
      case 'growth': return 'high';
      default: return 'default';
    }
  };

  const handleSelect = () => {
    setSelectedPortfolio(portfolio.id, allocations);
    navigate('/home');
  };

  const handleAddToPortfolios = () => {
    addPortfolio({
      name: portfolio.name,
      allocations: portfolio.allocations.map((a) => ({ asset: a.asset, percentage: a.percentage, color: a.color })),
      isActive: userPortfolios.length === 0,
      isCustom: false,
      templateId: portfolio.id,
    });
  };

  const handleRemoveFromPortfolios = () => {
    if (userPortfolio) {
      removePortfolio(userPortfolio.id);
    }
  };

  const handleSetActive = () => {
    if (userPortfolio) {
      setActivePortfolio(userPortfolio.id);
    }
  };

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
            <h1 className="text-xl font-bold">{portfolio.name}</h1>
            <Badge variant={getRiskVariant(portfolio.risk)} size="sm" className="mt-1">
              {portfolio.riskLabel}
            </Badge>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-32"
      >
        {/* Allocation Visualization */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Allocation Breakdown
            </h3>
            
            {/* Allocation Bar */}
            <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-4">
              {allocations.map((alloc, i) => (
                <div
                  key={i}
                  className="h-full transition-all"
                  style={{ 
                    width: `${alloc.percentage}%`, 
                    backgroundColor: alloc.color 
                  }}
                />
              ))}
            </div>

            {/* Allocation Legend */}
            <div className="grid grid-cols-2 gap-3">
              {allocations.map((alloc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: alloc.color }}
                  />
                  <span className="text-sm font-medium">{alloc.asset}</span>
                  <span className="text-sm text-muted-foreground">{alloc.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-3">Overview</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {portfolio.description}
            </p>
          </CardContent>
        </Card>

        {/* Why It Works */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-apice-success" />
              Why This Works
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {portfolio.whyItWorks}
            </p>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-4">
            <p className="text-[11px] text-muted-foreground mb-1">Min. Capital</p>
            <p className="font-semibold text-primary">{portfolio.minCapital}</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-[11px] text-muted-foreground mb-1">Risk Level</p>
            <p className="font-semibold capitalize">{portfolio.risk}</p>
          </Card>
        </div>

        {/* Risk Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">Risk Disclosure:</strong> This is a framework, not financial advice. 
            Past performance does not guarantee future results. Only invest what you can afford to lose.
          </p>
        </div>

        {/* Trust */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your funds remain on your exchange. You control execution.
          </p>
        </div>
      </motion.div>

      {/* Fixed CTA */}
      <div className="fixed bottom-[88px] lg:bottom-0 left-0 lg:left-[240px] right-0 z-30 p-5 bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom">
        <div className="flex gap-2">
          {isInUserPortfolios ? (
            <>
              {isActiveUserPortfolio ? (
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  disabled
                >
                  <Check className="w-4 h-4 mr-2" />
                  Active Portfolio
                </Button>
              ) : (
                <Button
                  variant="premium"
                  size="lg"
                  className="flex-1"
                  onClick={handleSetActive}
                >
                  Set as Active
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={handleRemoveFromPortfolios}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={handleAddToPortfolios}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to My Portfolios
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
