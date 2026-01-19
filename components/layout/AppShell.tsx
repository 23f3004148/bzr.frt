import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiSettings,
  FiUser,
  FiUserCheck,
} from 'react-icons/fi';
import { AppState, User } from '../../types';

export type ShellNavKey =
  | 'dashboard'
  | 'meetings'
  | 'resumes'
  | 'copilot'
  | 'settings'
  | 'logout';

interface NavItem {
  key: ShellNavKey;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
}

interface AppShellProps {
  currentUser?: User | null;
  title: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  activeKey?: ShellNavKey;
  onNavigate: (state: AppState) => void;
  onLogout: () => void;
  rightSlot?: React.ReactNode;
  headerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  titleIconContainerClassName?: string;

  /**
   * Determines how navigation items are displayed. The default
   * mode `sidebar` uses a left sidebar. When set to `top`, the
   * navigation items are rendered horizontally beneath the header.
   */
  navMode?: 'sidebar' | 'top';

  /**
   * Custom navigation items for the top navigation mode. Each item
   * must have a unique `key`, a `label` for display and an
   * `onClick` handler. This is only used when `navMode` is set to
   * `top`. If omitted, the built-in navItems array will be used.
   */
  customNavItems?: Array<{ key: string; label: string; onClick: () => void }>;
}

const resolveDisplayName = (user?: User | null) => {
  const raw =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.loginId ||
    user?.email ||
    '';
  const trimmed = String(raw).trim();
  return trimmed.length ? trimmed : 'User';
};

const resolveInitial = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'U';
  return trimmed[0].toUpperCase();
};

const AppShell: React.FC<AppShellProps> = ({
  currentUser,
  title,
  subtitle,
  titleIcon,
  activeKey = 'dashboard',
  onNavigate,
  onLogout,
  rightSlot,
  headerClassName,
  titleClassName,
  subtitleClassName,
  contentClassName,
  titleIconContainerClassName,
  navMode = 'sidebar',
  customNavItems,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const navItems: NavItem[] = useMemo(() => {
    if (isAdmin) {
      return [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: <FiHome className="h-5 w-5" />,
          onClick: () => onNavigate(AppState.DASHBOARD),
        },
      ];
    }

    return [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <FiHome className="h-5 w-5" />,
        onClick: () => onNavigate(AppState.DASHBOARD),
      },
      {
        key: 'resumes',
        label: 'Profile',
        icon: <FiFileText className="h-5 w-5" />,
        onClick: () => onNavigate(AppState.PROFILE),
      },
      {
        key: 'copilot',
        label: 'Stealth Console',
        icon: <FiMessageCircle className="h-5 w-5" />,
        onClick: () => onNavigate(AppState.COPILOT_CONSOLE),
      },
    ];
  }, [isAdmin, onNavigate]);

  const bottomItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];
    if (!isAdmin) {
      items.push({
        key: 'settings',
        label: 'Settings',
        icon: <FiSettings className="h-5 w-5" />,
        onClick: () => onNavigate(AppState.PROFILE),
      });
    }
    items.push({
      key: 'logout',
      label: 'Logout',
      icon: <FiLogOut className="h-5 w-5" />,
      onClick: onLogout,
    });
    return items;
  }, [isAdmin, onLogout, onNavigate]);

  const sidebarWidth = collapsed ? 76 : 260;
  const headerClasses = [
    'sticky top-0 z-20 border-b border-sky-100 bg-[rgba(224,242,255,0.85)] backdrop-blur-xl',
    headerClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const headerContentClasses = [
    'mx-auto flex w-full max-w-7xl items-center gap-3 px-5 py-4',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const mainContentClasses = [
    'mx-auto w-full max-w-7xl flex-1 px-5 py-6',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const titleClasses = [
    'truncate text-lg font-semibold tracking-tight',
    titleClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const subtitleClasses = [
    'truncate text-xs text-slate-600',
    subtitleClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const userButtonClasses = [
    'flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-slate-800 shadow-sm transition hover:bg-white',
    isAdmin ? 'text-base font-semibold' : 'text-base font-semibold',
  ].join(' ');
  const userAvatarClasses = [
    'flex items-center justify-center overflow-hidden rounded-xl bg-slate-100',
    isAdmin ? 'h-10 w-10' : 'h-9 w-9',
  ].join(' ');
  const displayName = resolveDisplayName(currentUser);
  const displayInitial = resolveInitial(displayName);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        {!isAdmin && navMode !== 'top' && (
          <motion.aside
            animate={{ width: sidebarWidth }}
            className="relative hidden shrink-0 border-r border-sky-100 bg-[rgba(224,242,255,0.75)] backdrop-blur-xl md:block"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  B
                </div>
                {!collapsed && (
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Buuzzer AI</div>
                    <div className="text-xs text-slate-500">Console</div>
                  </div>
                )}
                <button
                  onClick={() => setCollapsed((v) => !v)}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <FiMenu className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-2">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = item.key === activeKey;
                    return (
                      <button
                        key={item.key}
                        onClick={item.onClick}
                        className={
                          'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ' +
                          (isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-100')
                        }
                      >
                        <span className={isActive ? 'text-white' : 'text-slate-700'}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {!collapsed && typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-slate-200/70 px-3 py-3">
                <div className="space-y-1">
                  {bottomItems.map((item, idx) => (
                    <button
                      key={`${item.label}-${idx}`}
                      onClick={item.onClick}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {item.icon}
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className={headerClasses}>
            <div className={headerContentClasses}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {titleIcon && (
                  <span
                    className={
                      titleIconContainerClassName ||
                      'flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-current shadow-sm'
                    }
                  >
                    {titleIcon}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className={titleClasses}>{title}</h1>
                  {subtitle && (
                    <div className={subtitleClasses}>{subtitle}</div>
                  )}
                </div>
              </div>

              {rightSlot && <div className="hidden md:block">{rightSlot}</div>}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={userButtonClasses}
                >
                  <span className={`${userAvatarClasses} text-sm font-semibold text-slate-700`}>
                    {isAdmin ? <FiUserCheck className="h-5 w-5 text-slate-700" /> : displayInitial}
                  </span>
                  <span className="hidden max-w-[200px] truncate md:block text-base font-semibold">
                    {displayName}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-lg"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      {!isAdmin && (
                        <button
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate(AppState.PROFILE);
                          }}
                        >
                          <FiUser className="h-4 w-4" />
                          Profile
                        </button>
                      )}
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                      >
                        <FiLogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Optional top navigation bar */}
          {navMode === 'top' && !isAdmin && (customNavItems?.length ?? 0) > 0 && (
            <div className="border-b border-sky-100 bg-[rgba(224,242,255,0.85)] backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-3">
                {customNavItems!.map((item) => {
                  const isActive = (item.key as any) === (activeKey as any);
                  return (
                    <button
                      key={item.key}
                      onClick={item.onClick}
                      className={
                        'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                        (isActive
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-700 hover:bg-slate-100')
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <main className={mainContentClasses}>{children}</main>
        </div>
      </div>

    </div>
  );
};

export default AppShell;

