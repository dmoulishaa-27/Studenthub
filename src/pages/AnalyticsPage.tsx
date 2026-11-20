import { CheckCircle2, Clock, Flame, Timer } from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CATEGORIES,
  CATEGORY_META,
  FocusLogEntry,
  StudySession,
  Task,
} from '../types';
import {
  addDaysISO,
  calculateDurationHours,
  calculateProductivityStreak,
  formatDurationLabel,
  getTodayISO,
  parseLocalDate,
} from '../utils/dateUtils';

interface AnalyticsPageProps {
  tasks: Task[];
  studySessions: StudySession[];
  focusLogs: FocusLogEntry[];
  isDark: boolean;
}

export function AnalyticsPage({
  tasks,
  studySessions,
  focusLogs,
  isDark,
}: AnalyticsPageProps) {
  const todayISO = getTodayISO();

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = total - completed;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const completedPlannerHours = studySessions
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + calculateDurationHours(s.startTime, s.endTime), 0);

    const plannedStudyHours = studySessions.reduce(
      (sum, s) => sum + calculateDurationHours(s.startTime, s.endTime),
      0
    );

    const focusHours =
      focusLogs
        .filter((l) => l.mode === 'focus')
        .reduce((sum, l) => sum + l.durationMinutes, 0) / 60;

    const completedStudyHours = completedPlannerHours + focusHours;
    const streakDays = calculateProductivityStreak(tasks, studySessions, focusLogs, todayISO);

    return {
      total,
      completed,
      pending,
      completionPct,
      completedStudyHours,
      plannedStudyHours,
      focusSessionCount: focusLogs.filter((l) => l.mode === 'focus').length,
      streakDays,
    };
  }, [tasks, studySessions, focusLogs, todayISO]);

  // Weekly Task Completion (7-day breakdown using live data without double-counting)
  const weeklyData = useMemo(() => {
    const rows: { day: string; completed: number; pending: number }[] = [];
    for (let offset = -5; offset <= 1; offset++) {
      const iso = addDaysISO(todayISO, offset);
      const d = parseLocalDate(iso);
      rows.push({
        day: offset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: tasks.filter(
          (t) => t.status === 'Completed' && (t.completedAt || t.dueDate) === iso
        ).length,
        pending: tasks.filter((t) => t.status !== 'Completed' && t.dueDate === iso).length,
      });
    }
    return rows;
  }, [tasks, todayISO]);

  // Monthly Productivity Trend (4 real weeks computed purely from stored tasks, study sessions, and focus logs)
  const monthlyTrendData = useMemo(() => {
    const weeks = [
      { label: '3 Wks Ago', start: -27, end: -21 },
      { label: '2 Wks Ago', start: -20, end: -14 },
      { label: 'Last Week', start: -13, end: -7 },
      { label: 'This Week', start: -6, end: 0 },
    ];

    return weeks.map((w) => {
      const startISO = addDaysISO(todayISO, w.start);
      const endISO = addDaysISO(todayISO, w.end);

      const tasksCompleted = tasks.filter((t) => {
        if (t.status !== 'Completed') return false;
        const doneDate = t.completedAt || t.dueDate;
        return doneDate >= startISO && doneDate <= endISO;
      }).length;

      const completedStudyHrs =
        studySessions
          .filter((s) => s.completed && s.date >= startISO && s.date <= endISO)
          .reduce((sum, s) => sum + calculateDurationHours(s.startTime, s.endTime), 0) +
        focusLogs
          .filter((l) => l.mode === 'focus' && l.date >= startISO && l.date <= endISO)
          .reduce((sum, l) => sum + l.durationMinutes, 0) /
          60;

      return {
        week: w.label,
        tasksCompleted,
        studyHours: Number(completedStudyHrs.toFixed(1)),
      };
    });
  }, [tasks, studySessions, focusLogs, todayISO]);

  // Subject-wise task distribution
  const subjectData = useMemo(() => {
    const map = new Map<string, { subject: string; total: number; completed: number }>();
    for (const t of tasks) {
      const entry = map.get(t.subject) || { subject: t.subject, total: 0, completed: 0 };
      entry.total += 1;
      if (t.status === 'Completed') entry.completed += 1;
      map.set(t.subject, entry);
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);
  }, [tasks]);

  // Completed vs Pending Donut
  const statusPieData = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    return [
      { name: 'Completed', value: completed, color: isDark ? '#34D399' : '#16A34A' },
      { name: 'In Progress', value: inProgress, color: '#8B7CF6' },
      { name: 'Pending', value: pending, color: isDark ? '#6B8CE8' : '#243B64' },
    ];
  }, [tasks, isDark]);

  const tooltipStyle = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E2E8F0',
    borderRadius: '12px',
    fontSize: '12px',
    color: isDark ? '#F1F5F9' : '#0F172A',
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Analytics KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Completion Rate
            </span>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {summary.completionPct}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.completed} completed · {summary.pending} remaining
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Completed Study Hours
            </span>
            <Clock className="h-4.5 w-4.5 text-[#243B64] dark:text-[#93B4E8]" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatDurationLabel(summary.completedStudyHours)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatDurationLabel(summary.plannedStudyHours)} planned in Study Planner
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Productivity Streak
            </span>
            <Flame className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {summary.streakDays} {summary.streakDays === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.streakDays > 0
              ? 'Consecutive active study days'
              : 'Complete a task or study block to start'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Focus Sessions
            </span>
            <Timer className="h-4.5 w-4.5 text-[#8B7CF6]" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {summary.focusSessionCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.focusSessionCount * 25} total deep focus minutes
          </p>
        </div>
      </section>

      {/* Row 1 Charts: Weekly Completion + Completed vs Pending Donut */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Weekly Task Completion
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Daily completed vs pending task volume
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#243B64] dark:bg-[#6B8CE8]" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#8B7CF6]" />
                Pending
              </span>
            </div>
          </div>

          <div className="mt-5 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
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
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill={isDark ? '#6B8CE8' : '#243B64'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#8B7CF6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completed vs Pending Donut */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Completed vs Pending
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Current task status breakdown
            </p>
          </div>

          <div className="relative my-3 h-52 w-full">
            {summary.total === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Add tasks to view status ratio
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {statusPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {summary.total}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Total</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Row 2 Charts: Monthly Productivity Trend + Subject-Wise Distribution */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Monthly Productivity Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Monthly Productivity Trend
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Completed study hours and finished tasks over the last 4 weeks
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#8B7CF6]" />
                Study Hrs
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#243B64] dark:bg-[#6B8CE8]" />
                Tasks Done
              </span>
            </div>
          </div>

          <div className="mt-5 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={monthlyTrendData}
                margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="studyHoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B7CF6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#8B7CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#1E293B' : '#F1F5F9'}
                />
                <XAxis
                  dataKey="week"
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
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="studyHours"
                  name="Study Hours"
                  stroke="#8B7CF6"
                  strokeWidth={2.5}
                  fill="url(#studyHoursGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="tasksCompleted"
                  name="Tasks Completed"
                  stroke={isDark ? '#6B8CE8' : '#243B64'}
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-Wise Task Distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-6">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Subject-Wise Task Distribution
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Workload volume per academic subject
            </p>
          </div>

          <div className="mt-5 h-64 w-full">
            {subjectData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Add tasks with subjects to view distribution
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={subjectData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={isDark ? '#1E293B' : '#F1F5F9'}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="subject"
                    width={118}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#CBD5E1' : '#334155', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.03)' }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar
                    dataKey="total"
                    name="Total Tasks"
                    fill={isDark ? '#6B8CE8' : '#243B64'}
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Category Completion Breakdown */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Category Completion Breakdown
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Progress across all six academic and personal task categories
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const catTasks = tasks.filter((t) => t.category === cat);
            const catCompleted = catTasks.filter((t) => t.status === 'Completed').length;
            const pct =
              catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0;
            const meta = CATEGORY_META[cat];

            return (
              <div
                key={cat}
                className="rounded-xl border border-slate-100 bg-[#F8FAFC]/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                    {cat}
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                    {catCompleted}/{catTasks.length}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: meta.color }}
                  />
                </div>
                <p className="mt-2 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {pct}% completed
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
