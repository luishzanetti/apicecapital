import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Trash2,
  Play,
  Pause,
  Clock,
  DollarSign
} from 'lucide-react';

export default function DCAPlanner() {
  const navigate = useNavigate();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);
  const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
  const deleteDcaPlan = useAppStore((s) => s.deleteDcaPlan);
  
  const [showCreate, setShowCreate] = useState(dcaPlans.length === 0);
  const [newPlan, setNewPlan] = useState({
    assets: ['BTC', 'ETH'],
    amountPerInterval: 100,
    frequency: 'weekly' as const,
    durationDays: 90,
  });

  const handleCreatePlan = () => {
    addDcaPlan({
      ...newPlan,
      startDate: new Date().toISOString(),
      isActive: true,
    });
    setShowCreate(false);
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const assetOptions = ['BTC', 'ETH', 'SOL', 'USDT'];

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
            <h1 className="text-xl font-bold">DCA Planner</h1>
            <p className="text-xs text-muted-foreground">Systematic buying schedules</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-24"
      >
        {/* Existing Plans */}
        {dcaPlans.length > 0 && !showCreate && (
          <div>
            <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Your DCA Plans
            </h2>
            <div className="space-y-3">
              {dcaPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{plan.assets.join(' + ')}</h3>
                          <Badge variant={plan.isActive ? 'low' : 'outline'} size="sm">
                            {plan.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${plan.amountPerInterval} {plan.frequency}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateDcaPlan(plan.id, { isActive: !plan.isActive })}
                          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                        >
                          {plan.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteDcaPlan(plan.id)}
                          className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.durationDays} days
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${plan.amountPerInterval * (plan.durationDays / (plan.frequency === 'daily' ? 1 : plan.frequency === 'weekly' ? 7 : plan.frequency === 'biweekly' ? 14 : 30))} total
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create New Plan */}
        {showCreate ? (
          <Card>
            <CardContent className="pt-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">New DCA Plan</h3>
                  <p className="text-xs text-muted-foreground">Configure your schedule</p>
                </div>
              </div>

              {/* Assets */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Assets to Buy
                </label>
                <div className="flex flex-wrap gap-2">
                  {assetOptions.map((asset) => (
                    <button
                      key={asset}
                      onClick={() => {
                        const assets = newPlan.assets.includes(asset)
                          ? newPlan.assets.filter(a => a !== asset)
                          : [...newPlan.assets, asset];
                        setNewPlan({ ...newPlan, assets });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        newPlan.assets.includes(asset)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Amount per Interval
                </label>
                <div className="flex gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setNewPlan({ ...newPlan, amountPerInterval: amount })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newPlan.amountPerInterval === amount
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNewPlan({ ...newPlan, frequency: opt.value as any })}
                      className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                        newPlan.frequency === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Duration (days)
                </label>
                <div className="flex gap-2">
                  {[30, 60, 90, 180].map((days) => (
                    <button
                      key={days}
                      onClick={() => setNewPlan({ ...newPlan, durationDays: days })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newPlan.durationDays === days
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Plan Preview</p>
                <p className="text-sm font-medium">
                  ${newPlan.amountPerInterval} into {newPlan.assets.join(' + ')} {newPlan.frequency} for {newPlan.durationDays} days
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="premium" 
                  className="flex-1"
                  onClick={handleCreatePlan}
                  disabled={newPlan.assets.length === 0}
                >
                  Create Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4" />
            Add New Plan
          </Button>
        )}

        {/* How to Execute */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-3">How to Execute</h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">1</span>
                <p>Open Bybit and navigate to "Trade" → "Spot"</p>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">2</span>
                <p>Set up a recurring buy order for your chosen assets</p>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">3</span>
                <p>Configure the amount and frequency to match your plan</p>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">4</span>
                <p>Review and confirm your recurring order</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
