/**
 * MainLayout Component
 * 
 * Main application layout wrapper with Navbar, Sidebar, and Footer
 * Manages sidebar state, handles responsive behavior
 * 
 * Design Decisions:
 * - Consistent padding and spacing across all pages
 * - Sidebar auto-closes on mobile navigation
 * - Content area with max-width for readability
 * - Smooth transitions for sidebar toggle
 * - Accessible skip-to-content link
 * 
 * @example
 * ```tsx
 * <MainLayout>
 *   <YourPageContent />
 * </MainLayout>
 * ```
 */

'use client';

import { useState, ReactNode } from 'react';
import { ConnectedNavbar } from './ConnectedNavbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { NavbarUser, NetworkInfo } from '@/types/components';

interface MainLayoutProps {
  children: ReactNode;
  user?: NavbarUser;
  network?: NetworkInfo;
  onConnect?: () => void;
  onDisconnect?: () => void;
  showSidebar?: boolean;
  showFooter?: boolean;
  maxWidth?: 'full' | 'container' | 'narrow';
  className?: string;
}

export function MainLayout({
  children,
  user,
  network,
  onConnect,
  onDisconnect,
  showSidebar = true,
  showFooter = true,
  maxWidth = 'container',
  className = '',
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const maxWidthStyles = {
    full: 'max-w-full',
    container: 'max-w-7xl',
    narrow: 'max-w-4xl',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[2000] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Navbar */}
      <ConnectedNavbar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          id="main-content"
          className={`
            flex-1
            ${showSidebar ? 'lg:ml-64' : ''}
            transition-all
            duration-300
          `.trim().replace(/\s+/g, ' ')}
        >
          <div className={`${maxWidthStyles[maxWidth]} mx-auto px-4 py-6 md:py-8 ${className}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * Simplified layout for auth pages
 */
interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AuthLayout({ children, className = '' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className={`w-full max-w-md ${className}`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-success-600 rounded-xl flex items-center justify-center text-white">
              <span className="text-2xl font-bold">T</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">
              TrustCircle
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
