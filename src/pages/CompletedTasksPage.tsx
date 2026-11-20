import { CheckCircle2, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_META, Task, TaskCategory } from '../types';
import { formatReadableDate } from '../utils/dateUtils';

interface CompletedTasksPageProps {
  tasks: Task[];
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  onRestoreTask: (id: string) => void;
  onDeleteTask: (task: Task) => void;
}

export function CompletedTasksPage({
  tasks,
  globalSearch,
  onGlobalSearchChange,
  onRestoreTask,
  onDeleteTask,
}: CompletedTasksPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'All'>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'Completed'),
    [tasks]
  );

  const subjects = useMemo(() => {
    return Array.from(new Set(completedTasks.map((t) => t.subject))).sort();
  }, [completedTasks]);

  const filtered = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return completedTasks
      .filter((t) => {
        if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
        if (subjectFilter !== 'All' && t.subject !== subjectFilter) return false;
        if (q) {
          return (
            t.title.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) =>
        (b.completedAt || b.dueDate).localeCompare(a.completedAt || a.dueDate)
      );
  }, [completedTasks, categoryFilter, subjectFilter, globalSearch]);

  return (
    <div className="space-y-6">
      {/* Header Summary Banner */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Completed Archive
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review finished assignments, quizzes, and projects — or restore any item back to active tasks.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="font-display text-xl font-bold leading-none tabular-nums">
              {completedTasks.length}
            </p>
            <p className="mt-1 text-[11px] font-medium opacity-85">Completed tasks</p>
          </div>
        </div>
      </section>

      {/* Search, Filter & List */}
      <section className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Search completed tasks..."
              aria-label="Search completed tasks"
              className="h-9 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pr-8 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => onGlobalSearchChange('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter completed tasks by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'All')}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="All">Category: All</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter completed tasks by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="All">Subject: All</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-200">
              {completedTasks.length === 0
                ? 'No completed tasks yet'
                : 'No completed tasks match your filter'}
            </p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {completedTasks.length === 0
                ? 'Tasks you check off across Dashboard, My Tasks, or Focus Mode will appear here.'
                : 'Clear your search query or change the category filter to view more items.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 pl-6 pr-4">Task Title</th>
                  <th className="py-3 pr-4">Subject</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Completed Date</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800/80">
                {filtered.map((task) => {
                  const meta = CATEGORY_META[task.category];
                  return (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="max-w-sm py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {task.subject}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                          {task.category}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatReadableDate(task.completedAt || task.dueDate)}
                      </td>
                      <td className="py-3.5 pr-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRestoreTask(task.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task)}
                            aria-label={`Delete ${task.title}`}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
