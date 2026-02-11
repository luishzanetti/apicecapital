import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl apice-gradient-primary flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" className="text-white">
              <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
