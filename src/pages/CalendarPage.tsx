import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_META, Task } from '../types';
import {
  formatDateISO,
  formatReadableDate,
  formatShortDate,
  formatTime12h,
  getMonthGridDates,
  getTodayISO,
  getWeekDates,
  isTaskOverdue,
  parseLocalDate,
} from '../utils/dateUtils';

interface CalendarPageProps {
  tasks: Task[];
  onAddTaskForDate: (isoDate: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage({
  tasks,
  onAddTaskForDate,
  onEditTask,
  onDeleteTask,
  onToggleTask,
}: CalendarPageProps) {
  const todayISO = getTodayISO();
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [cursorDate, setCursorDate] = useState<Date>(() => parseLocalDate(todayISO));
  const [selectedISO, setSelectedISO] = useState<string>(todayISO);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.dueDate) || [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));
    }
    return map;
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks
      .filter((t) => isTaskOverdue(t, todayISO))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, todayISO]);

  const monthDates = useMemo(
    () => getMonthGridDates(cursorDate.getFullYear(), cursorDate.getMonth()),
    [cursorDate]
  );

  const weekDates = useMemo(() => getWeekDates(cursorDate), [cursorDate]);

  const selectedDayTasks = tasksByDate.get(selectedISO) || [];

  const handleNavigate = (direction: -1 | 1) => {
    const next = new Date(cursorDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + direction, 1);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    setCursorDate(next);
  };

  const handleToday = () => {
    const today = parseLocalDate(todayISO);
    setCursorDate(today);
    setSelectedISO(todayISO);
  };

  const jumpToDate = (iso: string) => {
    setSelectedISO(iso);
    setCursorDate(parseLocalDate(iso));
  };

  const headerLabel =
    viewMode === 'month'
      ? cursorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : `${weekDates[0].toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} – ${weekDates[6].toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-[#111827] sm:flex-row sm:items-center sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
              className="rounded-l-xl p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="border-x border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(1)}
              aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
              className="rounded-r-xl p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {headerLabel}
          </h2>
        </div>

        {/* Segmented Month / Week Toggle */}
        <div className="inline-flex self-start rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Weekly
          </button>
        </div>
      </section>

      {/* Main Split: Calendar Grid + Selected Date Agenda & Overdue Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Calendar Grid */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#111827] xl:col-span-8">
          {/* Category + Overdue legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {CATEGORIES.map((cat) => (
              <span key={cat} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${CATEGORY_META[cat].dotClass}`} />
                {cat}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Overdue
            </span>
          </div>

          {viewMode === 'month' ? (
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 42-day Month Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
                {monthDates.map((date) => {
                  const iso = formatDateISO(date);
                  const isCurrentMonth = date.getMonth() === cursorDate.getMonth();
                  const isToday = iso === todayISO;
                  const isSelected = iso === selectedISO;
                  const dayTasks = tasksByDate.get(iso) || [];
                  const hasOverdue = dayTasks.some((t) => isTaskOverdue(t, todayISO));

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedISO(iso)}
                      className={`flex min-h-[92px] flex-col p-2 text-left transition-colors sm:min-h-[108px] ${
                        isSelected
                          ? 'bg-[#EEF2F8]/70 dark:bg-[#243B64]/25'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      } ${!isCurrentMonth ? 'opacity-45' : ''}`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums ${
                            isToday
                              ? 'bg-[#243B64] text-white dark:bg-[#8B7CF6]'
                              : isSelected
                              ? 'text-[#243B64] dark:text-[#C4B5FD]'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <span
                            className={`font-mono text-[10px] font-semibold tabular-nums ${
                              hasOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                            }`}
                          >
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 w-full space-y-1">
                        {dayTasks.slice(0, 2).map((task) => {
                          const meta = CATEGORY_META[task.category];
                          const overdue = isTaskOverdue(task, todayISO);
                          return (
                            <div
                              key={task.id}
                              className={`flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                                overdue
                                  ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                                  : `${meta.softBg} ${meta.darkSoftBg} ${meta.textColor} ${meta.darkTextColor}`
                              } ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  overdue ? 'bg-red-500' : meta.dotClass
                                }`}
                              />
                              <span className="truncate">{task.title}</span>
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <p className="px-1 text-[10px] font-medium text-slate-400">
                            +{dayTasks.length - 2} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Weekly 7-column view */
            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-7 md:divide-x md:divide-y-0">
              {weekDates.map((date) => {
                const iso = formatDateISO(date);
                const isToday = iso === todayISO;
                const isSelected = iso === selectedISO;
                const dayTasks = tasksByDate.get(iso) || [];

                return (
                  <div
                    key={iso}
                    onClick={() => setSelectedISO(iso)}
                    className={`flex min-h-[260px] cursor-pointer flex-col p-3 transition-colors md:min-h-[420px] ${
                      isSelected
                        ? 'bg-[#EEF2F8]/55 dark:bg-[#243B64]/20'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/35'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {WEEKDAYS[date.getDay()]}
                        </p>
                        <span
                          className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-semibold tabular-nums ${
                            isToday
                              ? 'bg-[#243B64] text-white dark:bg-[#8B7CF6]'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedISO(iso);
                          onAddTaskForDate(iso);
                        }}
                        aria-label={`Add task for ${formatReadableDate(iso)}`}
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex-1 space-y-2">
                      {dayTasks.length === 0 ? (
                        <p className="py-4 text-center text-[11px] text-slate-400">Open</p>
                      ) : (
                        dayTasks.map((task) => {
                          const meta = CATEGORY_META[task.category];
                          const overdue = isTaskOverdue(task, todayISO);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className={`w-full rounded-xl p-2 text-left transition-opacity hover:opacity-85 ${
                                overdue
                                  ? 'bg-red-50 dark:bg-red-500/15'
                                  : `${meta.softBg} ${meta.darkSoftBg}`
                              }`}
                            >
                              <p
                                className={`line-clamp-2 text-xs font-semibold ${
                                  overdue
                                    ? 'text-red-700 dark:text-red-400'
                                    : `${meta.textColor} ${meta.darkTextColor}`
                                } ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}
                              >
                                {task.title}
                              </p>
                              <p className="mt-1 font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                                {formatTime12h(task.dueTime)}
                                {overdue ? ' · Overdue' : ''}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Selected Date Agenda + Overdue Tasks List */}
        <aside className="space-y-6 xl:col-span-4">
          {/* Selected Date Agenda Panel */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-medium text-[#8B7CF6]">
                  {selectedISO === todayISO ? 'Today' : 'Selected Date'}
                </p>
                <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {formatReadableDate(selectedISO)}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {selectedDayTasks.length}{' '}
                  {selectedDayTasks.length === 1 ? 'scheduled task' : 'scheduled tasks'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAddTaskForDate(selectedISO)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#243B64] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </button>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nothing scheduled on this day
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                  Click "Add Task" above to schedule an assignment, exam, or study milestone for{' '}
                  {formatReadableDate(selectedISO)}.
                </p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
                {selectedDayTasks.map((task) => {
                  const isDone = task.status === 'Completed';
                  const overdue = isTaskOverdue(task, todayISO);
                  const meta = CATEGORY_META[task.category];
                  return (
                    <div key={task.id} className="flex items-start justify-between gap-3 py-3.5">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={`Toggle ${task.title}`}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isDone
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-[#243B64] dark:border-slate-600 dark:bg-slate-900'
                          }`}
                        >
                          {isDone && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isDone
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  overdue ? 'bg-red-500' : meta.dotClass
                                }`}
                              />
                              {task.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{task.subject}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono tabular-nums ${
                                overdue ? 'font-semibold text-red-600 dark:text-red-400' : ''
                              }`}
                            >
                              {formatTime12h(task.dueTime)}
                              {overdue ? ' · Overdue' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          aria-label={`Edit ${task.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task)}
                          aria-label={`Delete ${task.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dedicated Overdue Tasks Panel */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Overdue Tasks
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-red-600 dark:text-red-400">
                {overdueTasks.length}
              </span>
            </div>

            {overdueTasks.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                No overdue tasks — every scheduled deadline is on track.
              </p>
            ) : (
              <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/80">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => jumpToDate(task.dueDate)}
                      className="min-w-0 flex-1 text-left transition-opacity hover:opacity-80"
                    >
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-400">
                        Due {formatShortDate(task.dueDate)} · {task.subject}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      title="Mark completed"
                      aria-label={`Mark ${task.title} completed`}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400"
                    >
                      Done
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
