'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

type Props = {
  children: React.ReactNode;
  profileName: string;
};

export function AdminLayoutClient({ children, profileName }: Props) {
  // Default to open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto close on mobile, auto open on desktop
      setIsOpen(!mobile);
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const renderBreadcrumbs = () => {
    if (!pathname) return null;
    const segments = pathname.split('/').filter(Boolean);
    
    return (
      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm font-medium sm:flex">
        <span className="text-[var(--text-muted)] font-normal">Admin</span>
        {segments.slice(1).map((segment, index) => {
          const label = segment.charAt(0).toUpperCase() + segment.slice(1);
          const isLast = index === segments.length - 2;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-normal">/</span>
              <span className={isLast ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-muted)] font-normal"}>
                {label}
              </span>
            </div>
          );
        })}
        {segments.length === 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] font-normal">/</span>
            <span className="text-[var(--text-primary)] font-semibold">Dashboard</span>
          </div>
        )}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      {/* Sidebar - handles sliding on mobile or resizing on desktop */}
      <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} />

      {/* Backdrop for mobile drawer */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content container with smooth padding transition */}
      <div
        className="pb-6 pt-6 px-4 lg:pr-6 lg:pt-6 transition-all duration-300 ease-in-out"
        style={{
          paddingLeft: isMobile
            ? '1rem'
            : isOpen
              ? '17rem' // 256px sidebar width + 16px (1rem) spacing = 272px
              : '5.5rem', // 72px sidebar width + 16px (1rem) spacing = 88px
        }}
      >
        <header className="mb-6 flex min-h-14 items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 lg:px-5">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button (Shadcn Sidebar Trigger style) */}
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)] active:scale-[0.95]"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <p className="text-sm font-medium text-[var(--text-secondary)] lg:hidden">Admin</p>
            {renderBreadcrumbs()}
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-body)] text-[var(--text-secondary)]">
              <UserRound size={16} />
            </span>
            {profileName}
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
