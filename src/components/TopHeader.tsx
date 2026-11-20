import {
  Bell,
  CalendarDays,
  Check,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageId, StudentProfile, Task } from '../types';
import {
  formatHeaderDate,
  formatTime12h,
  getRelativeDueLabel,
  getTodayISO,
  isTaskOverdue,
} from '../utils/dateUtils';
import { Avatar } from './Avatar';

interface TopHeaderProps {
  activePage: PageId;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  onAddTask: () => void;
  onSelectTask: (task: Task) => void;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  tasks: Task[];
  profile: StudentProfile;
  readNotificationIds: string[];
  onMarkNotificationsRead: (ids: string[]) => void;
  overdueAlertsEnabled: boolean;
  deadlineRemindersEnabled: boolean;
}

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  calendar: 'Calendar',
  planner: 'Study Planner',
  focus: 'Focus Mode',
  analytics: 'Analytics',
  completed: 'Completed Tasks',
  settings: 'Settings',
};

export function TopHeader({
  activePage,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onAddTask,
  onSelectTask,
  onNavigate,
  onLogout,
  theme,
  onToggleTheme,
  tasks,
  profile,
  readNotificationIds,
  onMarkNotificationsRead,
  overdueAlertsEnabled,
  deadlineRemindersEnabled,
}: TopHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const todayISO = getTodayISO();
  const formattedDate = useMemo(() => formatHeaderDate(), []);

  // Build real actionable notifications from overdue + today's pending tasks
  const notifications = useMemo(() => {
    const items: {
      id: string;
      task: Task;
      kind: 'overdue' | 'today';
      label: string;
    }[] = [];

    for (const task of tasks) {
      if (task.status === 'Completed') continue;
      if (isTaskOverdue(task, todayISO) && overdueAlertsEnabled) {
        items.push({
          id: `overdue-${task.id}-${task.dueDate}-${task.dueTime}`,
          task,
          kind: 'overdue',
          label: getRelativeDueLabel(task.dueDate, task.dueTime).label,
        });
      } else if (task.dueDate === todayISO && deadlineRemindersEnabled) {
        items.push({
          id: `today-${task.id}-${task.dueDate}`,
          task,
          kind: 'today',
          label: `Due today · ${formatTime12h(task.dueTime)}`,
        });
      }
    }
    return items.slice(0, 8);
  }, [tasks, todayISO, overdueAlertsEnabled, deadlineRemindersEnabled]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readNotificationIds.includes(n.id)).length,
    [notifications, readNotificationIds]
  );

  // Instant search preview results when typing outside Tasks/Completed pages
  const quickSearchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [tasks, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileMenuOpen(false);
        setSearchFocused(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-[#111827]/95">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile menu + Page Title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="truncate font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {PAGE_TITLES[activePage]}
          </h1>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Global Search Bar */}
          <div ref={searchRef} className="relative hidden md:block">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onNavigate('tasks');
                    setSearchFocused(false);
                  }
                }}
                placeholder="Search tasks, subjects..."
                aria-label="Search tasks and subjects"
                className="h-9 w-52 rounded-xl border border-slate-200 bg-[#F8FAFC] pr-8 pl-9 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:w-68 focus:border-[#243B64] focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#8B7CF6] dark:focus:bg-slate-900 xl:w-64 xl:focus:w-76"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchFocused &&
              searchQuery.trim().length > 0 &&
              activePage !== 'tasks' &&
              activePage !== 'completed' && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-3.5 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Matching Tasks ({quickSearchMatches.length})
                  </div>
                  {quickSearchMatches.length === 0 ? (
                    <p className="px-4 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                      No tasks match "{searchQuery}"
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {quickSearchMatches.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            onSelectTask(task);
                            setSearchFocused(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {task.title}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {task.subject} · {task.category}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {getRelativeDueLabel(task.dueDate, task.dueTime).label}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('tasks');
                          setSearchFocused(false);
                        }}
                        className="w-full px-3.5 py-2 text-center text-xs font-medium text-[#243B64] hover:bg-slate-50 dark:text-[#9D8FF8] dark:hover:bg-slate-800/70"
                      >
                        View all results in My Tasks
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Toggle search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Current date display */}
          <div className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 xl:flex">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <span className="whitespace-nowrap tabular-nums">{formattedDate}</span>
          </div>

          {/* Notifications popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileMenuOpen(false);
              }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={notifOpen}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8B7CF6] px-1 font-mono text-[10px] font-semibold tabular-nums text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 sm:w-96">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Upcoming Alerts
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onMarkNotificationsRead(notifications.map((n) => n.id))}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#243B64] hover:underline dark:text-[#9D8FF8]"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      You're all caught up
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      No overdue or due-today reminders right now.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                    {notifications.map((n) => {
                      const isRead = readNotificationIds.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            onMarkNotificationsRead([n.id]);
                            onSelectTask(n.task);
                            setNotifOpen(false);
                          }}
                          className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                            !isRead ? 'bg-[#F8FAFC] dark:bg-slate-800/35' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {n.task.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {n.task.subject} ·{' '}
                              <span
                                className={
                                  n.kind === 'overdue'
                                    ? 'font-medium text-red-600 dark:text-red-400'
                                    : 'font-medium text-amber-600 dark:text-amber-400'
                                }
                              >
                                {n.label}
                              </span>
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-slate-400">
                            {n.task.priority}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              className="inline-flex rounded-full transition-opacity hover:opacity-90"
            >
              <Avatar src={profile.avatar} name={profile.name} size="sm" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {profile.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {profile.email}
                  </p>
                  {profile.college && (
                    <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                      {profile.college}
                    </p>
                  )}
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('settings');
                      setProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Profile & Account Settings
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                      setProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Moon className="h-4 w-4 text-slate-400" />
                    )}
                    {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </button>
                </div>

                <div className="border-t border-slate-100 p-1.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Add Task button */}
          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#243B64] px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0] sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Row */}
      {mobileSearchOpen && (
        <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800 md:hidden">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onNavigate('tasks');
                  setMobileSearchOpen(false);
                }
              }}
              placeholder="Search tasks, subjects..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pr-8 pl-9 text-sm text-slate-900 focus:border-[#243B64] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
