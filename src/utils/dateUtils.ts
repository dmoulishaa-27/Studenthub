import { FocusLogEntry, StudySession, Task } from '../types';

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  return formatDateISO(new Date());
}

export function addDaysISO(baseISO: string, offsetDays: number): string {
  const date = parseLocalDate(baseISO);
  date.setDate(date.getDate() + offsetDays);
  return formatDateISO(date);
}

export function parseLocalDate(iso: string): Date {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date();
  }
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatReadableDate(iso: string): string {
  const date = parseLocalDate(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const date = parseLocalDate(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatHeaderDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime12h(time24: string): string {
  if (!time24 || !time24.includes(':')) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return '';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${suffix}`;
}

export function isTaskOverdue(task: Task, referenceISO: string = getTodayISO()): boolean {
  if (task.status === 'Completed') return false;
  if (!task.dueDate) return false;
  if (task.dueDate < referenceISO) return true;
  if (task.dueDate === referenceISO && task.dueTime && task.dueTime.includes(':')) {
    const [h, m] = task.dueTime.split(':').map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      const now = new Date();
      const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      return due.getTime() < now.getTime();
    }
  }
  return false;
}

export function getRelativeDueLabel(
  iso: string,
  dueTime?: string
): { label: string; isUrgent: boolean; isPast: boolean } {
  const today = getTodayISO();
  const tomorrow = addDaysISO(today, 1);
  const yesterday = addDaysISO(today, -1);

  if (iso < today) {
    if (iso === yesterday) return { label: 'Yesterday (Overdue)', isUrgent: true, isPast: true };
    const diff = Math.round(
      (parseLocalDate(today).getTime() - parseLocalDate(iso).getTime()) / (1000 * 60 * 60 * 24)
    );
    return { label: `${diff}d overdue`, isUrgent: true, isPast: true };
  }
  if (iso === today) {
    if (dueTime && dueTime.includes(':')) {
      const [h, m] = dueTime.split(':').map(Number);
      const now = new Date();
      const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (due.getTime() < now.getTime()) {
        return { label: 'Overdue today', isUrgent: true, isPast: true };
      }
    }
    return { label: 'Today', isUrgent: true, isPast: false };
  }
  if (iso === tomorrow) return { label: 'Tomorrow', isUrgent: false, isPast: false };

  const diff = Math.round(
    (parseLocalDate(iso).getTime() - parseLocalDate(today).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 6) return { label: `In ${diff} days`, isUrgent: false, isPast: false };
  return { label: formatShortDate(iso), isUrgent: false, isPast: false };
}

export function calculateDurationHours(startTime: string, endTime: string): number {
  if (!startTime?.includes(':') || !endTime?.includes(':')) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0;
  const diffMins = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, diffMins / 60);
}

export function formatDurationLabel(hours: number): string {
  const totalMinutes = Math.round(Math.max(0, hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getMonthGridDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sun
  const gridStart = new Date(year, month, 1 - startDayOfWeek);
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getWeekDates(anchorDate: Date): Date[] {
  const start = new Date(anchorDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Calculates genuine consecutive-day productivity streak from completed tasks,
 * completed study sessions, and logged focus sessions.
 * Returns 0 when the user has no recorded productivity yet.
 */
export function calculateProductivityStreak(
  tasks: Task[],
  studySessions: StudySession[],
  focusLogs: FocusLogEntry[],
  referenceISO: string = getTodayISO()
): number {
  const activeDates = new Set<string>();

  for (const t of tasks) {
    if (t.status === 'Completed' && t.completedAt) {
      activeDates.add(t.completedAt);
    }
  }
  for (const s of studySessions) {
    if (s.completed && s.date) {
      activeDates.add(s.date);
    }
  }
  for (const f of focusLogs) {
    if (f.mode === 'focus' && f.date) {
      activeDates.add(f.date);
    }
  }

  if (activeDates.size === 0) return 0;

  let cursor = referenceISO;
  if (!activeDates.has(cursor)) {
    const yesterday = addDaysISO(referenceISO, -1);
    if (!activeDates.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}
