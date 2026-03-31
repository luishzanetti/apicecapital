import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

export default function Index() {
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  return <Navigate to={hasCompletedOnboarding ? '/home' : '/splash'} replace />;
}
