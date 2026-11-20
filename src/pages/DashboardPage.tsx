import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Pencil,
  Timer,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  CATEGORIES,
  CATEGORY_META,
  FocusLogEntry,
  PageId,
  StudentProfile,
  StudySession,
  Task,
  TaskCategory,
} from '../types';
import {
  addDaysISO,
  calculateDurationHours,
  calculateProductivityStreak,
  formatDurationLabel,
  formatTime12h,
  getRelativeDueLabel,
  getTimeOfDayGreeting,
  getTodayISO,
  isTaskOverdue,
  parseLocalDate,
} from '../utils/dateUtils';

interface DashboardPageProps {
  tasks: Task[];
  studySessions: StudySession[];
  focusLogs: FocusLogEntry[];
  profile: StudentProfile;
  isDark: boolean;
  dailySummaryEnabled: boolean;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
  onNavigate: (page: PageId) => void;
  onFilterCategoryAndNavigate: (category: TaskCategory) => void;
}

const PRIORITY_STYLES: Record<Task['priority'], { text: string; dot: string }> = {
  High: { text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  Medium: { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  Low: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

export function DashboardPage({
  tasks,
  studySessions,
  focusLogs,
  profile,
  isDark,
  dailySummaryEnabled,
  onToggleTask,
  onEditTask,
  onAddTask,
  onNavigate,
  onFilterCategoryAndNavigate,
}: DashboardPageProps) {
  const todayISO = getTodayISO();
  const firstName = profile.name.trim().split(/\s+/)[0] || 'Student';
  const greeting = getTimeOfDayGreeting();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status !== 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t, todayISO)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, inProgress, overdue, completionRate };
  }, [tasks, todayISO]);

  const todaysTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate === todayISO)
      .sort((a, b) => {
        if (a.status === 'Completed' && b.status !== 'Completed') return 1;
        if (a.status !== 'Completed' && b.status === 'Completed') return -1;
        return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
      });
  }, [tasks, todayISO]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'Completed')
      .sort((a, b) => {
        const dateCmp = a.dueDate.localeCompare(b.dueDate);
        if (dateCmp !== 0) return dateCmp;
        return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
      })
      .slice(0, 5);
  }, [tasks]);

  // Weekly chart using actual task data without double-counting completed items
  const weeklyChartData = useMemo(() => {
    const days: { day: string; completed: number; pending: number }[] = [];
    for (let offset = -5; offset <= 1; offset++) {
      const iso = addDaysISO(todayISO, offset);
      const d = parseLocalDate(iso);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const completedCount = tasks.filter(
        (t) => t.status === 'Completed' && (t.completedAt || t.dueDate) === iso
      ).length;
      const pendingCount = tasks.filter(
        (t) => t.status !== 'Completed' && t.dueDate === iso
      ).length;
      days.push({
        day: offset === 0 ? 'Today' : dayLabel,
        completed: completedCount,
        pending: pendingCount,
      });
    }
    return days;
  }, [tasks, todayISO]);

  const todayStudySummary = useMemo(() => {
    const todaySessions = studySessions.filter((s) => s.date === todayISO);
    const totalHours = todaySessions.reduce(
      (sum, s) => sum + calculateDurationHours(s.startTime, s.endTime),
      0
    );
    const completedSessions = todaySessions.filter((s) => s.completed).length;
    const focusCount = focusLogs.filter((l) => l.mode === 'focus').length;
    const streakDays = calculateProductivityStreak(tasks, studySessions, focusLogs, todayISO);
    return {
      totalHours,
      completedSessions,
      totalSessions: todaySessions.length,
      focusCount,
      streakDays,
    };
  }, [studySessions, focusLogs, tasks, todayISO]);

  const motivationalMessage = useMemo(() => {
    const remainingToday = todaysTasks.filter((t) => t.status !== 'Completed').length;
    if (stats.total === 0) {
      return 'Start by adding your upcoming assignments, exam dates, or study blocks for the week.';
    }
    if (stats.overdue > 0) {
      return `Focus on clearing your ${stats.overdue} overdue ${
        stats.overdue === 1 ? 'task' : 'tasks'
      } first, then stay on pace with ${remainingToday} remaining today.`;
    }
    if (remainingToday === 0 && todaysTasks.length > 0) {
      return 'Every task scheduled for today is complete. Great discipline — review tomorrow or take a break.';
    }
    if (dailySummaryEnabled && todayStudySummary.totalHours > 0) {
      return `You have ${remainingToday} ${
        remainingToday === 1 ? 'task' : 'tasks'
      } scheduled for today and ${formatDurationLabel(
        todayStudySummary.totalHours
      )} of planned study time.`;
    }
    return `You have ${remainingToday} ${
      remainingToday === 1 ? 'task' : 'tasks'
    } due today and ${stats.pending} active ${stats.pending === 1 ? 'item' : 'items'} overall.`;
  }, [stats.total, stats.overdue, stats.pending, todaysTasks, dailySummaryEnabled, todayStudySummary.totalHours]);

  // Circular progress ring math
  const ringRadius = 56;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - stats.completionRate / 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#8B7CF6]">
            {profile.college
              ? `${profile.college}${profile.major ? ` · ${profile.major}` : ''}`
              : 'Plan Smarter. Study Better. Achieve More.'}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {firstName}!
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Ready to make today productive?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {motivationalMessage}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('focus')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Timer className="h-4 w-4 text-[#8B7CF6]" />
            <span>Start Focus Session</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('planner')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EEF2F8] px-4 py-2.5 text-sm font-medium text-[#243B64] transition-colors hover:bg-[#E2E9F5] dark:bg-[#243B64]/40 dark:text-[#C5D8F6] dark:hover:bg-[#243B64]/60"
          >
            <Clock className="h-4 w-4" />
            <span>Study Plan</span>
          </button>
        </div>
      </section>

      {/* Four Statistics Cards */}
      <section aria-label="Task summary statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. Total Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2F8] text-[#243B64] dark:bg-[#243B64]/35 dark:text-[#93B4E8]">
              <ListTodo className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Across {new Set(tasks.map((t) => t.subject)).size}{' '}
            {new Set(tasks.map((t) => t.subject)).size === 1 ? 'subject' : 'subjects'}
          </p>
        </div>

        {/* 2. Pending Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Pending Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F2FF] text-[#7664F0] dark:bg-[#8B7CF6]/20 dark:text-[#B3A7FA]">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {stats.pending}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-[#7664F0] dark:text-[#B3A7FA]">
              {stats.inProgress} in progress
            </span>{' '}
            · {stats.pending - stats.inProgress} queued
          </p>
        </div>

        {/* 3. Completed Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Completed Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {stats.completed}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <span className="font-mono text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.completionRate}%
            </span>
          </div>
        </div>

        {/* 4. Overdue Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Overdue Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {stats.overdue}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {stats.overdue === 0 ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                All deadlines on track
              </span>
            ) : (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Requires immediate attention
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Productivity Overview Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Weekly Productivity Bar Chart + Study Summary */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Weekly Productivity
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Completed versus pending tasks across the current 7-day window
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#243B64] dark:bg-[#6B8CE8]" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#8B7CF6]/80" />
                Pending
              </span>
            </div>
          </div>

          <div className="mt-5 h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={weeklyChartData}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#1E293B' : '#F1F5F9'}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.03)' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                  }}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill={isDark ? '#6B8CE8' : '#243B64'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#8B7CF6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Study Activity Summary Strip */}
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Planned Study Today</p>
              <p className="mt-1 font-display text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatDurationLabel(todayStudySummary.totalHours)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {todayStudySummary.completedSessions} of {todayStudySummary.totalSessions} blocks done
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Focus Sessions Logged</p>
              <p className="mt-1 font-display text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {todayStudySummary.focusCount}{' '}
                {todayStudySummary.focusCount === 1 ? 'session' : 'sessions'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {todayStudySummary.focusCount * 25} min deep focus
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Study Streak</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-display text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                <Flame className="h-4.5 w-4.5 text-amber-500" />
                {todayStudySummary.streakDays}{' '}
                {todayStudySummary.streakDays === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {todayStudySummary.streakDays > 0
                  ? 'Consecutive active days'
                  : 'Complete a task or session today'}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Completion Circular Progress + Categories */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Completion Overview
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Overall semester task progress
            </p>

            {/* Circular Progress SVG */}
            <div className="my-5 flex items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 132 132">
                  <circle
                    cx="66"
                    cy="66"
                    r={ringRadius}
                    fill="none"
                    stroke={isDark ? '#1E293B' : '#EEF2F8'}
                    strokeWidth="10"
                  />
                  <circle
                    cx="66"
                    cy="66"
                    r={ringRadius}
                    fill="none"
                    stroke={isDark ? '#8B7CF6' : '#243B64'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-[stroke-dashoffset] duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {stats.completionRate}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {stats.completed}/{stats.total} done
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Categories quick breakdown */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="mb-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Tasks by Category
            </p>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const count = tasks.filter((t) => t.category === cat).length;
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onFilterCategoryAndNavigate(cat)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.softBg} ${meta.darkSoftBg} ${meta.textColor} ${meta.darkTextColor}`}
                      >
                        <CategoryIcon category={cat} className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium">{cat}</span>
                    </span>
                    <span className="font-mono font-medium tabular-nums text-slate-500 dark:text-slate-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Split: Today's Tasks + Upcoming Deadlines */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Today's Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Today's Tasks
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Scheduled deliverables due before midnight
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#243B64] transition-colors hover:text-[#1C2F52] dark:text-[#9D8FF8] dark:hover:text-[#B3A7FA]"
            >
              <span>View All Tasks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {todaysTasks.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No tasks due today
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add a task for today or get ahead on upcoming coursework.
              </p>
              <button
                type="button"
                onClick={onAddTask}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#243B64] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1C2F52] dark:bg-[#8B7CF6]"
              >
                Add Task for Today
              </button>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
              {todaysTasks.map((task) => {
                const isDone = task.status === 'Completed';
                const pStyle = PRIORITY_STYLES[task.priority];
                return (
                  <div
                    key={task.id}
                    className="group flex items-start justify-between gap-3 py-3.5 transition-colors"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        aria-label={
                          isDone
                            ? `Mark "${task.title}" incomplete`
                            : `Mark "${task.title}" complete`
                        }
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isDone
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white hover:border-[#243B64] dark:border-slate-600 dark:bg-slate-900 dark:hover:border-[#8B7CF6]'
                        }`}
                      >
                        {isDone && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-medium ${
                            isDone
                              ? 'text-slate-400 line-through dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{task.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${pStyle.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${pStyle.dot}`} />
                            {task.priority}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{task.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatTime12h(task.dueTime)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        aria-label={`Edit ${task.title}`}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Upcoming Deadlines
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Assignments, exams, and milestones in chronological order
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-[#243B64] hover:underline dark:text-[#9D8FF8]"
            >
              Calendar
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No upcoming deadlines
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                All current coursework has been completed.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
              {upcomingDeadlines.map((task) => {
                const rel = getRelativeDueLabel(task.dueDate, task.dueTime);
                const meta = CATEGORY_META[task.category];
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:opacity-85"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.softBg} ${meta.darkSoftBg} ${meta.textColor} ${meta.darkTextColor}`}
                      >
                        <CategoryIcon category={task.category} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {task.subject} · {task.category}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-xs font-semibold ${
                          rel.isPast
                            ? 'text-red-600 dark:text-red-400'
                            : rel.isUrgent
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {rel.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                        {formatTime12h(task.dueTime)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
