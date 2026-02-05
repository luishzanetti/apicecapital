 import { motion } from 'framer-motion';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useAppStore, InvestorType } from '@/store/appStore';
 import { dcaRecommendations, dcaAssets } from '@/data/sampleData';
 import { Sparkles, ChevronDown, ChevronUp, Zap } from 'lucide-react';
 import { useState } from 'react';
 
 interface DCARecommendationCardProps {
   onApply: (assets: { symbol: string; allocation: number }[], amount: number, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void;
 }
 
 export function DCARecommendationCard({ onApply }: DCARecommendationCardProps) {
   const [expanded, setExpanded] = useState(false);
   const userProfile = useAppStore((s) => s.userProfile);
   const investorType = useAppStore((s) => s.investorType);
 
   // Find matching recommendation
   const recommendation = dcaRecommendations.find(
     r => r.profileType === investorType && r.capitalRange === userProfile.capitalRange
   ) || dcaRecommendations[4]; // Default to balanced if no match
 
   const getAssetColors = () => {
     return recommendation.assets.map(a => {
       const asset = dcaAssets.find(da => da.symbol === a.symbol);
       return asset?.color || 'hsl(var(--primary))';
     });
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
     >
       <Card variant="premium" className="overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
         <CardContent className="pt-5 relative">
           {/* Header */}
           <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-2">
               <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                 <Sparkles className="w-5 h-5 text-white" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">AI Recommendation</p>
                 <p className="font-semibold text-sm">Personalized for You</p>
               </div>
             </div>
             <Badge variant="recommended" size="sm">
               <Zap className="w-3 h-3 mr-1" />
               Smart
             </Badge>
           </div>
 
           {/* Main Recommendation */}
           <div className="p-4 rounded-xl bg-secondary/50 mb-4">
             <div className="flex items-baseline gap-2 mb-2">
               <span className="text-3xl font-bold text-primary">${recommendation.suggestedAmount}</span>
               <span className="text-sm text-muted-foreground">/{recommendation.frequency}</span>
             </div>
             <div className="flex items-center gap-2 flex-wrap">
               <span className="text-sm text-muted-foreground">into</span>
               {recommendation.assets.map((asset, i) => (
                 <Badge key={asset.symbol} variant="outline" size="sm">
                   {asset.symbol} ({asset.allocation}%)
                 </Badge>
               ))}
             </div>
           </div>
 
           {/* Visual Allocation */}
           <div className="h-3 rounded-full overflow-hidden flex mb-4">
             {recommendation.assets.map((asset, i) => {
               const assetData = dcaAssets.find(a => a.symbol === asset.symbol);
               return (
                 <motion.div
                   key={asset.symbol}
                   initial={{ width: 0 }}
                   animate={{ width: `${asset.allocation}%` }}
                   transition={{ delay: i * 0.1, duration: 0.5 }}
                   className="h-full"
                   style={{ backgroundColor: assetData?.color }}
                 />
               );
             })}
           </div>
 
           {/* Expand for Why */}
           <button
             onClick={() => setExpanded(!expanded)}
             className="flex items-center gap-1 text-xs text-primary font-medium mb-4"
           >
             Why this recommendation?
             {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
 
           {expanded && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="mb-4 space-y-2"
             >
               <p className="text-xs text-muted-foreground">
                 <span className="font-medium text-foreground">Rationale:</span> {recommendation.rationale}
               </p>
               <p className="text-xs text-muted-foreground">
                 <span className="font-medium text-foreground">Market Context:</span> {recommendation.marketContext}
               </p>
               <p className="text-xs text-muted-foreground">
                 <span className="font-medium text-foreground">Your Profile:</span> {investorType} with {userProfile.capitalRange?.replace('-', '-$')} capital range.
               </p>
             </motion.div>
           )}
 
           {/* Apply Button */}
           <Button
             variant="premium"
             className="w-full"
             onClick={() => onApply(recommendation.assets, recommendation.suggestedAmount, recommendation.frequency)}
           >
             <Sparkles className="w-4 h-4 mr-2" />
             Apply This Plan
           </Button>
         </CardContent>
       </Card>
     </motion.div>
   );
 }