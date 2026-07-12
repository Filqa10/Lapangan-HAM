'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslation } from '@/lib/i18n';
import { AppSidebar, type SidebarVariant } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type DashboardShellProps = {
  variant: SidebarVariant;
  userName: string;
  children: React.ReactNode;
};

// Known path segments mapped to i18n keys; everything else falls back to a
// title-cased label, and numeric ids render as "#id".
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  fields: 'nav.fieldDetails',
  bookings: 'nav.booking',
  booking: 'nav.booking',
  history: 'nav.history',
};

function titleCase(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

function DashboardBreadcrumb({ variant }: { variant: SidebarVariant }) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean);

  const rootHref = variant === 'admin' ? '/admin' : '/customer';
  const rootLabel = variant === 'admin' ? 'Admin' : 'Customer';

  // segments[0] is the role root ("admin" | "customer"); the rest form the trail.
  const trail = segments.slice(1);

  const labelFor = (segment: string): string => {
    if (/^\d+$/.test(segment)) return `#${segment}`;
    const key = SEGMENT_LABEL_KEYS[segment];
    return key ? t(key) : titleCase(segment);
  };

  const crumbs = trail.map((segment, index) => {
    const href = `${rootHref}/${trail.slice(0, index + 1).join('/')}`;
    return { label: labelFor(segment), href, isLast: index === trail.length - 1 };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {crumbs.length === 0 ? (
            <BreadcrumbPage>{t('nav.dashboard')}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href={rootHref}>{rootLabel}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DashboardShell({ variant, userName, children }: DashboardShellProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar variant={variant} userName={userName} />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
            <DashboardBreadcrumb variant={variant} />
          </header>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
