 import { motion } from 'framer-motion';
 import { Card, CardContent } from '@/components/ui/card';
 import { dcaHistoricalData, dcaQuotes } from '@/data/sampleData';
 import { TrendingUp, Quote, BarChart3 } from 'lucide-react';
 import { useState } from 'react';
 
 export function DCAHistoricalProof() {
   const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'ETH'>('BTC');
   const data = dcaHistoricalData[selectedAsset];
   const randomQuote = dcaQuotes[Math.floor(Math.random() * dcaQuotes.length)];
 
   return (
     <div className="space-y-4">
       {/* Historical Returns Card */}
       <Card>
         <CardContent className="pt-5">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-apice-success/10 flex items-center justify-center">
               <BarChart3 className="w-5 h-5 text-apice-success" />
             </div>
             <div>
               <h3 className="font-semibold text-sm">DCA in Action</h3>
               <p className="text-xs text-muted-foreground">Real historical performance</p>
             </div>
           </div>
 
           {/* Asset Toggle */}
           <div className="flex gap-2 mb-4">
             {(['BTC', 'ETH'] as const).map((asset) => (
               <button
                 key={asset}
                 onClick={() => setSelectedAsset(asset)}
                 className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                   selectedAsset === asset
                     ? 'bg-primary text-primary-foreground'
                     : 'bg-secondary text-muted-foreground'
                 }`}
               >
                 {asset}
               </button>
             ))}
           </div>
 
           {/* Results Table */}
           <div className="space-y-3">
             {data.map((item, i) => (
               <motion.div
                 key={item.period}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="p-3 rounded-xl bg-secondary/50"
               >
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-sm font-medium">{item.period}</span>
                   <div className="flex items-center gap-1 text-apice-success">
                     <TrendingUp className="w-4 h-4" />
                     <span className="font-bold">+{item.returnPercent}%</span>
                   </div>
                 </div>
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Invested: ${item.totalInvested.toLocaleString()}</span>
                   <span>Value: ${item.currentValue.toLocaleString()}</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-2">
                   ${item.weeklyAmount}/week DCA strategy
                 </p>
               </motion.div>
             ))}
           </div>
 
           <p className="text-[10px] text-center text-muted-foreground mt-4">
             Historical data for illustration. Past performance ≠ future results.
           </p>
         </CardContent>
       </Card>
 
       {/* Quote Card */}
       <Card variant="glass">
         <CardContent className="pt-5">
           <Quote className="w-6 h-6 text-primary/50 mb-2" />
           <p className="text-sm italic text-foreground mb-3">
             "{randomQuote.quote}"
           </p>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
               <span className="text-xs font-bold text-primary">
                 {randomQuote.author.split(' ').map(n => n[0]).join('')}
               </span>
             </div>
             <div>
               <p className="text-xs font-medium">{randomQuote.author}</p>
               {randomQuote.role && (
                 <p className="text-[10px] text-muted-foreground">{randomQuote.role}</p>
               )}
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }