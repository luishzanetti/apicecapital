 import { motion } from 'framer-motion';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { DCAPlan, useAppStore } from '@/store/appStore';
 import { dcaAssets } from '@/data/sampleData';
 import { 
   Play, 
   Pause, 
   Trash2, 
   Clock, 
   DollarSign,
   TrendingUp,
   Infinity
 } from 'lucide-react';
 
 interface DCAPlanCardProps {
   plan: DCAPlan;
 }
 
 export function DCAPlanCard({ plan }: DCAPlanCardProps) {
   const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
   const deleteDcaPlan = useAppStore((s) => s.deleteDcaPlan);
 
   const getFrequencyMultiplier = () => {
     switch (plan.frequency) {
       case 'daily': return plan.durationDays || 365;
       case 'weekly': return Math.ceil((plan.durationDays || 365) / 7);
       case 'biweekly': return Math.ceil((plan.durationDays || 365) / 14);
       case 'monthly': return Math.ceil((plan.durationDays || 365) / 30);
     }
   };
 
   const totalProjected = plan.amountPerInterval * getFrequencyMultiplier();
   const assetsLabel = plan.assets.map(a => `${a.symbol} (${a.allocation}%)`).join(' · ');
 
   // Calculate days remaining
   const startDate = new Date(plan.startDate);
   const now = new Date();
   const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
   const daysRemaining = plan.durationDays ? Math.max(0, plan.durationDays - daysPassed) : null;
   const progressPercent = plan.durationDays 
     ? Math.min(100, Math.round((daysPassed / plan.durationDays) * 100))
     : null;
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, x: -100 }}
       layout
     >
       <Card className={plan.isActive ? 'border-primary/30' : 'opacity-70'}>
         <CardContent className="pt-4 pb-4">
           {/* Header */}
           <div className="flex items-start justify-between mb-3">
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <h3 className="font-semibold text-sm">
                   ${plan.amountPerInterval}/{plan.frequency}
                 </h3>
                 <Badge variant={plan.isActive ? 'low' : 'outline'} size="sm">
                   {plan.isActive ? 'Active' : 'Paused'}
                 </Badge>
                 {plan.durationDays === null && (
                   <Badge variant="premium" size="sm">
                     <Infinity className="w-3 h-3 mr-1" />
                     Forever
                   </Badge>
                 )}
               </div>
               <p className="text-xs text-muted-foreground">{assetsLabel}</p>
             </div>
             <div className="flex gap-2">
               <button
                 onClick={() => updateDcaPlan(plan.id, { isActive: !plan.isActive })}
                 className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                   plan.isActive 
                     ? 'bg-apice-warning/10 text-apice-warning' 
                     : 'bg-apice-success/10 text-apice-success'
                 }`}
               >
                 {plan.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
               </button>
               <button
                 onClick={() => deleteDcaPlan(plan.id)}
                 className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
           </div>
 
           {/* Asset Colors Bar */}
           <div className="h-2 rounded-full overflow-hidden flex mb-3">
             {plan.assets.map((asset) => {
               const assetData = dcaAssets.find(a => a.symbol === asset.symbol);
               return (
                 <div
                   key={asset.symbol}
                   className="h-full"
                   style={{ 
                     width: `${asset.allocation}%`,
                     backgroundColor: assetData?.color || 'hsl(var(--primary))'
                   }}
                 />
               );
             })}
           </div>
 
           {/* Progress (if has duration) */}
           {progressPercent !== null && (
             <div className="mb-3">
               <div className="flex justify-between text-xs text-muted-foreground mb-1">
                 <span>Progress</span>
                 <span>{progressPercent}%</span>
               </div>
               <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${progressPercent}%` }}
                   className="h-full bg-primary rounded-full"
                 />
               </div>
             </div>
           )}
 
           {/* Stats */}
           <div className="flex gap-4 text-xs">
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <Clock className="w-3.5 h-3.5" />
               {daysRemaining !== null ? (
                 <span>{daysRemaining} days left</span>
               ) : (
                 <span>Ongoing</span>
               )}
             </div>
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <DollarSign className="w-3.5 h-3.5" />
               <span>${plan.totalInvested.toLocaleString()} invested</span>
             </div>
             <div className="flex items-center gap-1.5 text-primary">
               <TrendingUp className="w-3.5 h-3.5" />
               <span>${totalProjected.toLocaleString()} target</span>
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }