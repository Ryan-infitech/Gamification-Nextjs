'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// Routes that should have a different layout (e.g., full-screen game)
const specialLayouts = ['/game', '/code-editor', '/challenge'];

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // Check if current route needs a special layout
  const isSpecialLayout = specialLayouts.some(route => pathname?.startsWith(route));
  
  // Handle page transitions
  const isLoginOrRegister = 
    pathname?.startsWith('/login') || 
    pathname?.startsWith('/register') || 
    pathname?.startsWith('/forgot-password');
  
  // Only show header and footer on normal pages
  const showHeaderFooter = !isSpecialLayout && !isLoginOrRegister;
  
  // On mount, set the mounted state (for hydration safety)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  // When using special layouts like game pages, render without header/footer
  if (isSpecialLayout) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showHeaderFooter && <Header />}
      
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="flex-grow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      
      {/* Only show notification center for authenticated users */}
      {user && !isLoading && (
        <NotificationCenter />
      )}
      
      {showHeaderFooter && <Footer />}
    </div>
  );
}
