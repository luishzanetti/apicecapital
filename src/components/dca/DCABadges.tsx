 import { motion } from 'framer-motion';
 import { Card, CardContent } from '@/components/ui/card';
 import { dcaBadges } from '@/data/sampleData';
 import { useAppStore } from '@/store/appStore';
 import { Trophy, Lock } from 'lucide-react';
 
 export function DCABadges() {
   const dcaGamification = useAppStore((s) => s.dcaGamification);
   const earnedBadges = dcaGamification.badges;
 
   const nextBadge = dcaBadges.find(b => !earnedBadges.includes(b.id));
 
   return (
     <Card>
       <CardContent className="pt-5">
         <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-xl apice-gradient-gold flex items-center justify-center">
             <Trophy className="w-5 h-5 text-white" />
           </div>
           <div>
             <h3 className="font-semibold text-sm">DCA Achievements</h3>
             <p className="text-xs text-muted-foreground">
               {earnedBadges.length}/{dcaBadges.length} badges earned
             </p>
           </div>
         </div>
 
         {/* Next Badge Progress */}
         {nextBadge && (
           <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4">
             <div className="flex items-center gap-3">
               <span className="text-2xl">{nextBadge.icon}</span>
               <div className="flex-1">
                 <p className="text-sm font-medium">Next: {nextBadge.name}</p>
                 <p className="text-xs text-muted-foreground">{nextBadge.requirement}</p>
               </div>
             </div>
           </div>
         )}
 
         {/* Badge Grid */}
         <div className="grid grid-cols-3 gap-3">
           {dcaBadges.map((badge, i) => {
             const isEarned = earnedBadges.includes(badge.id);
             return (
               <motion.div
                 key={badge.id}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.05 }}
                 className={`relative p-3 rounded-xl text-center transition-all ${
                   isEarned
                     ? 'bg-primary/10 border border-primary/20'
                     : 'bg-secondary/50 opacity-50'
                 }`}
               >
                 {!isEarned && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Lock className="w-4 h-4 text-muted-foreground" />
                   </div>
                 )}
                 <span className={`text-2xl ${!isEarned ? 'opacity-30 blur-sm' : ''}`}>
                   {badge.icon}
                 </span>
                 <p className={`text-[11px] font-medium mt-1 ${!isEarned ? 'opacity-30' : ''}`}>
                   {badge.name}
                 </p>
               </motion.div>
             );
           })}
         </div>
 
         {/* Streak */}
         {dcaGamification.dcaStreak > 0 && (
           <div className="mt-4 p-3 rounded-xl bg-apice-gold/10 text-center">
             <p className="text-xs text-muted-foreground">Current Streak</p>
             <p className="text-2xl font-bold text-apice-gold">
               🔥 {dcaGamification.dcaStreak} days
             </p>
           </div>
         )}
 
         {/* Stats */}
         <div className="grid grid-cols-2 gap-3 mt-4">
           <div className="p-3 rounded-xl bg-secondary/50 text-center">
             <p className="text-xs text-muted-foreground">Plans Created</p>
             <p className="text-lg font-bold">{dcaGamification.totalPlansCreated}</p>
           </div>
           <div className="p-3 rounded-xl bg-secondary/50 text-center">
             <p className="text-xs text-muted-foreground">Total Committed</p>
             <p className="text-lg font-bold">${dcaGamification.totalAmountCommitted.toLocaleString()}</p>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }