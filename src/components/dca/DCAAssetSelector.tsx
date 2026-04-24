 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Badge } from '@/components/ui/badge';
 import { dcaAssets, dcaCoreAssets, DCAAsset } from '@/data/sampleData';
 import { Sparkles, AlertTriangle, Check, Plus, Minus, Eye, EyeOff } from 'lucide-react';
 
 interface SelectedAsset {
   symbol: string;
   allocation: number;
 }
 
 interface DCAAssetSelectorProps {
   selectedAssets: SelectedAsset[];
   onChange: (assets: SelectedAsset[]) => void;
   maxAssets?: number;
 }
 
 const CATEGORIES = [
   { id: 'blueChips', label: 'Blue Chips', color: 'bg-blue-500/10 text-blue-500' },
   { id: 'layer1', label: 'Layer 1', color: 'bg-purple-500/10 text-purple-500' },
   { id: 'layer2', label: 'Layer 2', color: 'bg-orange-500/10 text-orange-500' },
   { id: 'defi', label: 'DeFi', color: 'bg-green-500/10 text-green-500' },
   { id: 'stablecoins', label: 'Stables', color: 'bg-teal-500/10 text-teal-500' },
   { id: 'emerging', label: 'Emerging', color: 'bg-pink-500/10 text-pink-500' },
 ];
 
 export function DCAAssetSelector({ selectedAssets, onChange, maxAssets = 5 }: DCAAssetSelectorProps) {
   const [activeCategory, setActiveCategory] = useState<string | null>(null);
   // Default surface = Apice top-10 (BTC, ETH, SOL, UNI, USDC + 5 supporting).
   // Long-tail assets (TIA, JUP, NEAR, SUI, ADA, OP, AAVE) are gated behind
   // a "Show all" toggle so the picker stays focused for new users.
   const [showAll, setShowAll] = useState(false);
 
   const isSelected = (symbol: string) => selectedAssets.some(a => a.symbol === symbol);
   const getAllocation = (symbol: string) => selectedAssets.find(a => a.symbol === symbol)?.allocation || 0;
 
   const toggleAsset = (asset: DCAAsset) => {
     if (isSelected(asset.symbol)) {
       onChange(selectedAssets.filter(a => a.symbol !== asset.symbol));
     } else if (selectedAssets.length < maxAssets) {
       // Auto-distribute allocation equally
       const newCount = selectedAssets.length + 1;
       const equalAllocation = Math.floor(100 / newCount);
       const remainder = 100 - (equalAllocation * newCount);
       
       const updatedAssets = selectedAssets.map((a, i) => ({
         ...a,
         allocation: equalAllocation + (i === 0 ? remainder : 0)
       }));
       
       onChange([...updatedAssets, { symbol: asset.symbol, allocation: equalAllocation }]);
     }
   };
 
   const updateAllocation = (symbol: string, delta: number) => {
     const otherAssets = selectedAssets.filter(a => a.symbol !== symbol);
     const currentAsset = selectedAssets.find(a => a.symbol === symbol);
     if (!currentAsset) return;
 
     const newAllocation = Math.max(5, Math.min(95, currentAsset.allocation + delta));
     const diff = currentAsset.allocation - newAllocation;
     
     if (otherAssets.length === 0) return;
     
     // Distribute the difference to other assets proportionally
     const otherTotal = otherAssets.reduce((sum, a) => sum + a.allocation, 0);
     const adjusted = otherAssets.map(a => ({
       ...a,
       allocation: Math.max(5, Math.round(a.allocation + (diff * (a.allocation / otherTotal))))
     }));
     
     // Ensure total is 100
     const total = newAllocation + adjusted.reduce((sum, a) => sum + a.allocation, 0);
     if (total !== 100 && adjusted.length > 0) {
       adjusted[0].allocation += 100 - total;
     }
 
     onChange([...adjusted, { symbol, allocation: newAllocation }]);
   };
 
   const getDiversificationScore = () => {
     if (selectedAssets.length === 0) return 'None';
     if (selectedAssets.length === 1) return 'Low';
     if (selectedAssets.length === 2) return 'Medium';
     return 'High';
   };
 
   const scoreColor = {
     'None': 'text-muted-foreground',
     'Low': 'text-destructive',
     'Medium': 'text-apice-warning',
     'High': 'text-apice-success',
   };
 
   // Source pool depends on the showAll toggle. Always include any currently
   // selected asset even if it's outside the core 10 (so users editing a
   // legacy plan with TIA/JUP can still see and remove it).
   const selectedSymbols = new Set(selectedAssets.map((a) => a.symbol));
   const sourcePool = showAll
     ? dcaAssets
     : [
         ...dcaCoreAssets,
         ...dcaAssets.filter((a) => !a.isCore && selectedSymbols.has(a.symbol)),
       ];
   const filteredAssets = activeCategory
     ? sourcePool.filter((a) => a.category === activeCategory)
     : sourcePool;
 
   return (
     <div className="space-y-4">
       {/* Category Tabs + Show-all toggle */}
       <div className="flex items-center gap-2">
         <div className="flex flex-1 gap-2 overflow-x-auto pb-2 scrollbar-hide">
           <button
             onClick={() => setActiveCategory(null)}
             className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
               activeCategory === null
                 ? 'bg-primary text-primary-foreground'
                 : 'bg-secondary text-muted-foreground'
             }`}
           >
             {showAll ? 'All' : 'Top 10'}
           </button>
           {CATEGORIES.map(cat => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                 activeCategory === cat.id
                   ? 'bg-primary text-primary-foreground'
                   : 'bg-secondary text-muted-foreground'
               }`}
             >
               {cat.label}
             </button>
           ))}
         </div>
         <button
           type="button"
           onClick={() => setShowAll((v) => !v)}
           className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
           aria-pressed={showAll}
           title={showAll ? 'Hide long-tail assets' : 'Show all assets including long-tail'}
         >
           {showAll ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
           {showAll ? 'Top 10' : 'Show all'}
         </button>
       </div>
 
       {/* Asset Grid */}
       <div className="grid grid-cols-3 gap-2">
         <AnimatePresence mode="popLayout">
           {filteredAssets.map((asset) => (
             <motion.button
               key={asset.symbol}
               layout
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => toggleAsset(asset)}
               disabled={!isSelected(asset.symbol) && selectedAssets.length >= maxAssets}
               className={`relative p-3 rounded-xl border transition-all ${
                 isSelected(asset.symbol)
                   ? 'border-primary bg-primary/10'
                   : 'border-border bg-card hover:border-primary/50'
               } ${!isSelected(asset.symbol) && selectedAssets.length >= maxAssets ? 'opacity-40' : ''}`}
             >
               {isSelected(asset.symbol) && (
                 <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                   <Check className="w-3 h-3 text-primary-foreground" />
                 </div>
               )}
               {asset.isRecommended && (
                 <div className="absolute -top-1 -left-1">
                   <Sparkles className="w-4 h-4 text-apice-gold" />
                 </div>
               )}
               <p className="font-semibold text-sm">{asset.symbol}</p>
               <p className="text-[11px] text-muted-foreground truncate">{asset.name}</p>
               {asset.riskLevel === 'high' && (
                 <AlertTriangle className="w-3 h-3 text-apice-warning absolute bottom-2 right-2" />
               )}
             </motion.button>
           ))}
         </AnimatePresence>
       </div>
 
       {/* Selected Assets Allocation */}
       {selectedAssets.length > 0 && (
         <div className="space-y-3 pt-4 border-t border-border">
           <div className="flex items-center justify-between">
             <p className="text-xs font-medium text-muted-foreground">Allocation</p>
             <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground">Diversification:</span>
               <Badge variant={getDiversificationScore() === 'High' ? 'low' : getDiversificationScore() === 'Medium' ? 'medium' : 'high'} size="sm">
                 {getDiversificationScore()}
               </Badge>
             </div>
           </div>
           
           {selectedAssets.map((asset) => {
             const assetData = dcaAssets.find(a => a.symbol === asset.symbol);
             return (
               <div key={asset.symbol} className="flex items-center gap-3">
                 <div 
                   className="w-3 h-3 rounded-full" 
                   style={{ backgroundColor: assetData?.color }}
                 />
                 <span className="text-sm font-medium w-12">{asset.symbol}</span>
                 <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${asset.allocation}%` }}
                     className="h-full bg-primary rounded-full"
                   />
                 </div>
                 <div className="flex items-center gap-1">
                   <button
                     onClick={(e) => { e.stopPropagation(); updateAllocation(asset.symbol, -5); }}
                     className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center"
                   >
                     <Minus className="w-3 h-3" />
                   </button>
                   <span className="text-sm font-medium w-10 text-center">{asset.allocation}%</span>
                   <button
                     onClick={(e) => { e.stopPropagation(); updateAllocation(asset.symbol, 5); }}
                     className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center"
                   >
                     <Plus className="w-3 h-3" />
                   </button>
                 </div>
               </div>
             );
           })}
         </div>
       )}
 
       {/* Selection Info */}
       <p className="text-xs text-center text-muted-foreground">
         {selectedAssets.length}/{maxAssets} assets selected
       </p>
     </div>
   );
 }