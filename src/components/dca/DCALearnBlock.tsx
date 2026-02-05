 import { motion } from 'framer-motion';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useNavigate } from 'react-router-dom';
 import { useAppStore } from '@/store/appStore';
 import { learningTracks } from '@/data/sampleData';
 import { BookOpen, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
 
 export function DCALearnBlock() {
   const navigate = useNavigate();
   const learnProgress = useAppStore((s) => s.learnProgress);
   
   // Find DCA Mastery track
   const dcaTrack = learningTracks.find(t => t.id === 'dca-mastery');
   if (!dcaTrack) return null;
 
   const completedCount = dcaTrack.lessons.filter(
     l => learnProgress.completedLessons.includes(l.id)
   ).length;
   const totalLessons = dcaTrack.lessons.length;
   const progressPercent = Math.round((completedCount / totalLessons) * 100);
 
   // Get first 3 uncompleted lessons
   const nextLessons = dcaTrack.lessons
     .filter(l => !learnProgress.completedLessons.includes(l.id) && !l.isLocked)
     .slice(0, 3);
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
     >
       <Card variant="interactive">
         <CardContent className="pt-5">
           <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <BookOpen className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <h3 className="font-semibold text-sm">Master DCA Strategy</h3>
                 <p className="text-xs text-muted-foreground">
                   {completedCount}/{totalLessons} lessons completed
                 </p>
               </div>
             </div>
             <Badge variant={progressPercent === 100 ? 'low' : 'default'} size="sm">
               {progressPercent}%
             </Badge>
           </div>
 
           {/* Progress Bar */}
           <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
             <motion.div
               initial={{ width: 0 }}
               animate={{ width: `${progressPercent}%` }}
               transition={{ duration: 0.5 }}
               className="h-full bg-primary rounded-full"
             />
           </div>
 
           {/* Key Lessons */}
           <div className="space-y-2 mb-4">
             {nextLessons.map((lesson, i) => (
               <motion.button
                 key={lesson.id}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 onClick={() => navigate(`/lesson/${lesson.id}`)}
                 className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
               >
                 <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                   <span className="text-xs font-bold text-primary">{i + 1}</span>
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium truncate">{lesson.title}</p>
                   <p className="text-[10px] text-muted-foreground">{lesson.readingTime} min read</p>
                 </div>
                 <ChevronRight className="w-4 h-4 text-muted-foreground" />
               </motion.button>
             ))}
           </div>
 
           {/* Key Insights */}
           <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
             <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-4 h-4 text-primary" />
               <span className="text-xs font-semibold">Why Learn DCA?</span>
             </div>
             <ul className="space-y-1">
               <li className="flex items-start gap-2 text-xs text-muted-foreground">
                 <CheckCircle2 className="w-3 h-3 text-apice-success mt-0.5 shrink-0" />
                 <span>Protects capital through systematic buying</span>
               </li>
               <li className="flex items-start gap-2 text-xs text-muted-foreground">
                 <CheckCircle2 className="w-3 h-3 text-apice-success mt-0.5 shrink-0" />
                 <span>Removes emotional decision-making</span>
               </li>
               <li className="flex items-start gap-2 text-xs text-muted-foreground">
                 <CheckCircle2 className="w-3 h-3 text-apice-success mt-0.5 shrink-0" />
                 <span>94% positive returns over 4-year periods</span>
               </li>
             </ul>
           </div>
 
           <Button
             variant="outline"
             className="w-full"
             onClick={() => navigate('/learn')}
           >
             <BookOpen className="w-4 h-4 mr-2" />
             View All DCA Lessons
           </Button>
         </CardContent>
       </Card>
     </motion.div>
   );
 }