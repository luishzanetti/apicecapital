 import { motion } from 'framer-motion';
 import { Slider } from '@/components/ui/slider';
 import { DollarSign } from 'lucide-react';
 
 interface DCAAmountSliderProps {
   value: number;
   onChange: (value: number) => void;
   frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
 }
 
 const MIN_AMOUNT = 5;
 const MAX_AMOUNT = 1000;
 const AMOUNT_PRESETS = [5, 10, 25, 50, 100, 200, 500];
 
 export function DCAAmountSlider({ value, onChange, frequency }: DCAAmountSliderProps) {
   const getMultiplier = () => {
     switch (frequency) {
       case 'daily': return 30;
       case 'weekly': return 4;
       case 'biweekly': return 2;
       case 'monthly': return 1;
     }
   };
 
   const monthlyProjection = value * getMultiplier();
   const yearlyProjection = monthlyProjection * 12;
 
   return (
     <div className="space-y-4">
       {/* Amount Display */}
       <div className="text-center">
         <motion.div
           key={value}
           initial={{ scale: 0.95, opacity: 0.5 }}
           animate={{ scale: 1, opacity: 1 }}
           className="flex items-center justify-center gap-1"
         >
           <DollarSign className="w-8 h-8 text-primary" />
           <span className="text-5xl font-bold">{value}</span>
         </motion.div>
         <p className="text-sm text-muted-foreground mt-2">
           per {frequency === 'biweekly' ? '2 weeks' : frequency}
         </p>
       </div>
 
       {/* Slider */}
       <div className="px-2">
         <Slider
           value={[value]}
           onValueChange={([v]) => onChange(v)}
           min={MIN_AMOUNT}
           max={MAX_AMOUNT}
           step={5}
           className="py-4"
         />
         <div className="flex justify-between text-xs text-muted-foreground mt-1">
           <span>${MIN_AMOUNT}</span>
           <span>${MAX_AMOUNT}</span>
         </div>
       </div>
 
       {/* Quick Presets */}
       <div className="flex flex-wrap gap-2 justify-center">
         {AMOUNT_PRESETS.map((preset) => (
           <motion.button
             key={preset}
             whileTap={{ scale: 0.95 }}
             onClick={() => onChange(preset)}
             className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
               value === preset
                 ? 'bg-primary text-primary-foreground shadow-sm'
                 : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
             }`}
           >
             ${preset}
           </motion.button>
         ))}
       </div>
 
       {/* Projections */}
       <div className="grid grid-cols-2 gap-3 mt-4">
         <div className="p-3 rounded-xl bg-secondary/50 text-center">
           <p className="text-xs text-muted-foreground">Monthly</p>
           <p className="text-lg font-semibold text-foreground">${monthlyProjection.toLocaleString()}</p>
         </div>
         <div className="p-3 rounded-xl bg-primary/10 text-center">
           <p className="text-xs text-muted-foreground">Yearly</p>
           <p className="text-lg font-semibold text-primary">${yearlyProjection.toLocaleString()}</p>
         </div>
       </div>
     </div>
   );
 }