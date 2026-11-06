import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRouter() {
  const { user, isPlatformOwner, isCompanyAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (isPlatformOwner()) {
      navigate('/dashboard/owner', { replace: true });
    } else if (isCompanyAdmin()) {
      navigate('/dashboard/admin', { replace: true });
    } else if (isEmployee()) {
      navigate('/dashboard/employee', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [user, navigate, isPlatformOwner, isCompanyAdmin, isEmployee]);

  return null;
}
