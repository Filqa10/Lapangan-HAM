'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Calendar, History, Home, LogOut, Menu, User, X } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

type CustomerNavbarProps = {
  userName?: string;
};

const navLinks = [
  { href: '/customer', labelKey: 'nav.dashboard', icon: Home },
  { href: '/customer/booking/create', labelKey: 'nav.booking', icon: Calendar },
  { href: '/customer/history', labelKey: 'nav.history', icon: History },
];

export function CustomerNavbar({ userName }: CustomerNavbarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#d2cecb] dark:border-slate-800 bg-[var(--bg-body)]/95 backdrop-blur-md" id="customer-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/customer" className="flex items-center">
          <Image
            src="/assets/Logo-HAM-fix.png"
            alt="HAM Stadium Logo"
            width={130}
            height={130}
            className="shrink-0 object-contain invert dark:invert-0"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/customer' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-[4px] px-3.5 py-1.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${isActive
                    ? 'bg-[#f4f2f0] dark:bg-slate-800/80 text-[#0c0a08] dark:text-white'
                    : 'text-[#999ba3] hover:bg-[#f4f2f0]/60 dark:hover:bg-slate-800/30 hover:text-[#0c0a08] dark:hover:text-white'
                  }`}
              >
                <link.icon size={15} />
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />

          {/* User profile & Signout consolidated control */}
          <div className="hidden items-center md:flex rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4d505d] dark:text-slate-300">
              <User size={13} className="text-[#999ba3]" />
              <span className="max-w-[100px] truncate">{userName ?? 'Customer'}</span>
            </div>
            <div className="h-4 w-[1px] bg-[#d2cecb] dark:bg-slate-800" />
            <form action="/api/auth/signout" method="post" className="flex">
              <button
                type="submit"
                className="rounded-[3px] p-1.5 text-[#999ba3] transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-red-500/10 hover:text-red-400 active:scale-[0.95]"
                title={t('common.logout')}
              >
                <LogOut size={14} />
              </button>
            </form>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-[4px] p-2 text-[#999ba3] transition-transform duration-150 active:scale-[0.95] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-[#4d505d] dark:text-slate-300 transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] hover:bg-[#f4f2f0] dark:hover:bg-slate-800 hover:text-[#0c0a08] dark:hover:text-white"
            >
              <link.icon size={16} />
              {t(link.labelKey)}
            </Link>
          ))}
          <hr className="my-2 border-[#d2cecb] dark:border-slate-800" />
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]"
            >
              <LogOut size={16} />
              {t('common.logout')}
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
