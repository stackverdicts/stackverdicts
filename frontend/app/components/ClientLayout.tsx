'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '../contexts/AuthContext';
import MarketingModal from './MarketingModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldShowModal = !pathname?.startsWith('/admin') && pathname !== '/login';

  return (
    <AuthProvider>
      {children}
      {shouldShowModal && <MarketingModal />}
    </AuthProvider>
  );
}
