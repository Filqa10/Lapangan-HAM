'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Calendar, Home, LogOut, MapPin } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

const adminLinks = [
  { href: '/admin', labelKey: 'admin.dashboardTitle', icon: Home, exact: true },
  { href: '/admin/fields', labelKey: 'nav.fieldDetails', icon: MapPin },
  { href: '/admin/bookings', labelKey: 'nav.booking', icon: Calendar },
];

type AdminSidebarProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
};

export function AdminSidebar({ isOpen, setIsOpen, isMobile }: AdminSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-18'
      }`;

  return (
    <aside className={sidebarClasses} id="admin-sidebar">
      {/* Sidebar Header */}
      {isOpen ? (
        <div className="flex flex-col gap-1 p-6">
          <Link href="/admin" className="flex justify-center">
            <Image
              src="/assets/Logo-HAM-fix.png"
              alt="HAM Stadium Logo"
              width={130}
              height={130}
              className="shrink-0 object-contain invert dark:invert-0"
            />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 h-[76px] shrink-0">
          <Image
            src="/assets/Logo-HAM-fix.png"
            alt="HAM Stadium Logo"
            width={28}
            height={28}
            className="shrink-0 object-contain invert dark:invert-0"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex flex-1 flex-col gap-1 ${isOpen ? 'px-3' : 'px-2'}`}>
        {adminLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                if (isMobile) setIsOpen(false);
              }}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isOpen ? 'gap-3 justify-start' : 'justify-center'
              } ${
                isActive
                  ? 'bg-[var(--text-primary)] text-[var(--bg-card)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)]'
              }`}
              title={!isOpen ? t(link.labelKey) : undefined}
            >
              <link.icon size={17} />
              {isOpen && <span className="truncate">{t(link.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-[var(--border-subtle)] p-4 flex flex-col gap-3 shrink-0">
        <div className={`flex items-center gap-3 ${isOpen ? 'flex-row justify-between' : 'flex-col justify-center'}`}>
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className={`flex w-full items-center font-medium text-sm transition hover:bg-red-500/10 hover:text-red-500 ${
              isOpen
                ? 'gap-3 rounded-lg px-3 py-2.5 text-left text-[var(--text-secondary)]'
                : 'h-10 w-10 justify-center rounded-lg text-red-500/80'
            }`}
            title={!isOpen ? t('common.logout') : undefined}
          >
            <LogOut size={17} />
            {isOpen && <span>{t('common.logout')}</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
