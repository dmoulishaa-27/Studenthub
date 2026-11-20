import {
  BarChart3,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
  X,
} from 'lucide-react';
import React from 'react';
import { PageId, StudentProfile } from '../types';
import { Avatar } from './Avatar';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  profile: StudentProfile;
  pendingCount: number;
  completedCount: number;
  focusTimerRunning: boolean;
  focusTimeFormatted: string;
  onLogout: () => void;
}

const NAV_ITEMS: {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'planner', label: 'Study Planner', icon: Clock },
  { id: 'focus', label: 'Focus Mode', icon: Timer },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'completed', label: 'Completed Tasks', icon: CheckCircle2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function StudentHubLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#243B64] text-white shadow-xs dark:bg-[#8B7CF6]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 7.5L12 3.5L20 7.5L12 11.5L4 7.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 9.5V15.2C7 16.5 9.2 18 12 18C14.8 18 17 16.5 17 15.2V9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 8V14"
            stroke="#C4B5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <span className="block truncate font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
            StudentHub
          </span>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  profile,
  pendingCount,
  completedCount,
  focusTimerRunning,
  focusTimeFormatted,
  onLogout,
}: SidebarProps) {
  const handleSelect = (page: PageId) => {
    onNavigate(page);
    onCloseMobile();
  };

  const renderContent = (isCompact: boolean, isMobileDrawer: boolean) => (
    <div className="flex h-full flex-col bg-white dark:bg-[#111827]">
      {/* Brand header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-slate-100 dark:border-slate-800/80 ${
          isCompact ? 'justify-center px-3' : 'justify-between px-5'
        }`}
      >
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="text-left focus-visible:rounded-lg"
          aria-label="StudentHub Home"
        >
          <StudentHubLogo compact={isCompact} />
        </button>

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        ) : !isCompact ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Expand button when collapsed on desktop */}
      {isCompact && !isMobileDrawer && (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badgeCount =
            item.id === 'tasks'
              ? pendingCount
              : item.id === 'completed'
              ? completedCount
              : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              title={isCompact ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex w-full items-center rounded-xl text-sm font-medium transition-colors duration-150 ${
                isCompact ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[#EEF2F8] text-[#243B64] dark:bg-[#243B64]/35 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#243B64] dark:text-[#9D8FF8]'
                      : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                  }`}
                />
                {!isCompact && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </span>

              {!isCompact && item.id === 'focus' && focusTimerRunning ? (
                <span className="ml-2 font-mono text-xs font-semibold tabular-nums text-[#8B7CF6]">
                  {focusTimeFormatted}
                </span>
              ) : !isCompact && badgeCount !== null && badgeCount > 0 ? (
                <span
                  className={`ml-2 font-mono text-xs tabular-nums ${
                    isActive
                      ? 'font-semibold text-[#243B64] dark:text-[#C4B5FD]'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Bottom student profile + Logout */}
      <div className="shrink-0 space-y-1 border-t border-slate-100 p-3 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => handleSelect('settings')}
          title={isCompact ? `${profile.name} — Account Settings` : undefined}
          className={`flex w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
            isCompact ? 'justify-center' : 'gap-3'
          }`}
        >
          <Avatar src={profile.avatar} name={profile.name} size="md" />
          {!isCompact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {profile.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {profile.college || 'Account settings'}
              </p>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onLogout();
          }}
          title={isCompact ? 'Sign out' : undefined}
          className={`flex w-full items-center rounded-xl py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 ${
            isCompact ? 'justify-center px-0' : 'gap-2.5 px-3'
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCompact && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200/80 transition-[width] duration-200 dark:border-slate-800 lg:block ${
          collapsed ? 'w-[74px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderContent(collapsed, false)}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full w-72 max-w-[82vw] border-r border-slate-200 shadow-2xl dark:border-slate-800">
            {renderContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
}
