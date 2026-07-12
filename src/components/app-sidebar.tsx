'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  ChevronsUpDown,
  History,
  Home,
  LogOut,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

export type SidebarVariant = 'admin' | 'customer';

type NavLink = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_LINKS: Record<SidebarVariant, NavLink[]> = {
  admin: [
    { href: '/admin', labelKey: 'admin.dashboardTitle', icon: Home, exact: true },
    { href: '/admin/fields', labelKey: 'nav.fieldDetails', icon: MapPin },
    { href: '/admin/bookings', labelKey: 'nav.booking', icon: Calendar },
  ],
  customer: [
    { href: '/customer', labelKey: 'nav.dashboard', icon: Home, exact: true },
    { href: '/customer/booking/create', labelKey: 'nav.booking', icon: Calendar },
    { href: '/customer/history', labelKey: 'nav.history', icon: History },
  ],
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AppSidebarProps = {
  variant: SidebarVariant;
  userName: string;
};

export function AppSidebar({ variant, userName }: AppSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const links = NAV_LINKS[variant];
  const home = variant === 'admin' ? '/admin' : '/customer';
  const roleLabel = variant === 'admin' ? 'Administrator' : 'Customer';
  const portalLabel = variant === 'admin' ? 'Admin Panel' : 'Customer Portal';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="gap-2.5 hover:bg-transparent active:bg-transparent">
              <Link href={home} aria-label="HAM Stadium">
                <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-[#0c0a08]">
                  <Image
                    src="/assets/Logo-HAM-fix.png"
                    alt=""
                    width={22}
                    height={22}
                    priority
                    className="size-5 object-contain"
                  />
                </span>
                <span className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-semibold">HAM Stadium</span>
                  <span className="truncate text-xs text-muted-foreground">{portalLabel}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {links.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + '/');
              const label = t(link.labelKey);
              return (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={label}
                    className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground"
                  >
                    <Link href={link.href}>
                      <link.icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                      {initialsOf(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="truncate text-sm font-medium">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div
                  className="flex items-center justify-between gap-2 px-2 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <div
                  className="flex items-center justify-between gap-2 px-2 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-medium text-muted-foreground">Language</span>
                  <LanguageToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <form action="/api/auth/signout" method="post">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="size-4" />
                      {t('common.logout')}
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
