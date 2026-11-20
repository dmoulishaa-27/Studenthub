import {
  ArrowUpDown,
  Check,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  CATEGORIES,
  CATEGORY_META,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types';
import {
  formatShortDate,
  formatTime12h,
  getTodayISO,
  isTaskOverdue,
} from '../utils/dateUtils';

interface TasksPageProps {
  tasks: Task[];
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  selectedCategory: TaskCategory | 'All';
  onSelectCategory: (cat: TaskCategory | 'All') => void;
  onAddTask: (category?: TaskCategory) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onFocusTask: (task: Task) => void;
}

type SortOption = 'dueDateAsc' | 'dueDateDesc' | 'priority' | 'title';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export function TasksPage({
  tasks,
  globalSearch,
  onGlobalSearchChange,
  selectedCategory,
  onSelectCategory,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  onChangeStatus,
  onChangePriority,
  onFocusTask,
}: TasksPageProps) {
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('dueDateAsc');
  const todayISO = getTodayISO();

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: tasks.length };
    for (const cat of CATEGORIES) {
      counts[cat] = tasks.filter((t) => t.category === cat).length;
    }
    return counts;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;
        if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
        if (statusFilter !== 'All' && task.status !== statusFilter) return false;
        if (q) {
          const hit =
            task.title.toLowerCase().includes(q) ||
            task.description.toLowerCase().includes(q) ||
            task.subject.toLowerCase().includes(q) ||
            task.category.toLowerCase().includes(q);
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDateAsc') {
          const cmp = a.dueDate.localeCompare(b.dueDate);
          return cmp !== 0 ? cmp : (a.dueTime || '').localeCompare(b.dueTime || '');
        }
        if (sortBy === 'dueDateDesc') {
          const cmp = b.dueDate.localeCompare(a.dueDate);
          return cmp !== 0 ? cmp : (b.dueTime || '').localeCompare(a.dueTime || '');
        }
        if (sortBy === 'priority') {
          const cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
          return cmp !== 0 ? cmp : a.dueDate.localeCompare(b.dueDate);
        }
        return a.title.localeCompare(b.title);
      });
  }, [tasks, selectedCategory, priorityFilter, statusFilter, globalSearch, sortBy]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    priorityFilter !== 'All' ||
    statusFilter !== 'All' ||
    globalSearch.trim().length > 0;

  const clearFilters = () => {
    onSelectCategory('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    onGlobalSearchChange('');
  };

  return (
    <div className="space-y-6">
      {/* Categories Overview Bar */}
      <section aria-label="Task categories">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <button
            type="button"
            onClick={() => onSelectCategory('All')}
            className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
              selectedCategory === 'All'
                ? 'border-[#243B64] bg-[#243B64] text-white dark:border-[#8B7CF6] dark:bg-[#8B7CF6]'
                : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-medium opacity-85">All Tasks</span>
            <span className="mt-2 font-display text-xl font-bold tabular-nums">
              {categoryCounts.All}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-[#243B64] bg-[#EEF2F8] dark:border-[#8B7CF6] dark:bg-[#243B64]/40'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.softBg} ${meta.darkSoftBg} ${meta.textColor} ${meta.darkTextColor}`}
                  >
                    <CategoryIcon category={cat} className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                    {categoryCounts[cat]}
                  </span>
                </div>
                <span className="mt-2.5 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters, Search & Task Table Container */}
      <section className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#111827]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          {/* Search input */}
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Search by title, subject, or notes..."
              aria-label="Filter tasks"
              className="h-9 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pr-8 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#8B7CF6]"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => onGlobalSearchChange('')}
                aria-label="Clear search query"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdowns + Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'All')}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="All">Priority: All</option>
              <option value="High">Priority: High</option>
              <option value="Medium">Priority: Medium</option>
              <option value="Low">Priority: Low</option>
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'All')}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="All">Status: All</option>
              <option value="Pending">Status: Pending</option>
              <option value="In Progress">Status: In Progress</option>
              <option value="Completed">Status: Completed</option>
            </select>

            <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                aria-label="Sort tasks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none dark:text-slate-200"
              >
                <option value="dueDateAsc">Due Date (Earliest)</option>
                <option value="dueDateDesc">Due Date (Latest)</option>
                <option value="priority">Priority (High First)</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 rounded-xl px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-200">
              {tasks.length === 0 ? 'No tasks created yet' : 'No matching tasks found'}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {tasks.length === 0
                ? 'Start organizing your semester by creating your first assignment, project, or study task.'
                : 'Try adjusting your search keywords, category, priority, or status filters.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onAddTask(selectedCategory === 'All' ? undefined : selectedCategory)
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#243B64] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="w-12 py-3 pl-5 pr-2">Done</th>
                  <th className="py-3 pr-4">Task & Subject</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Priority</th>
                  <th className="py-3 pr-4">Due Date</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800/80">
                {filteredTasks.map((task) => {
                  const isDone = task.status === 'Completed';
                  const overdue = isTaskOverdue(task, todayISO);
                  const meta = CATEGORY_META[task.category];

                  return (
                    <tr
                      key={task.id}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3.5 pl-5 pr-2 align-top">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={
                            isDone
                              ? `Mark "${task.title}" pending`
                              : `Mark "${task.title}" completed`
                          }
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                            isDone
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-[#243B64] dark:border-slate-600 dark:bg-slate-900 dark:hover:border-[#8B7CF6]'
                          }`}
                        >
                          {isDone && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </button>
                      </td>

                      <td className="max-w-sm py-3.5 pr-4 align-top">
                        <p
                          className={`font-medium ${
                            isDone
                              ? 'text-slate-400 line-through dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {task.subject}
                          {task.description ? ` · ${task.description}` : ''}
                        </p>
                      </td>

                      <td className="py-3.5 pr-4 align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                          {task.category}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 align-top whitespace-nowrap">
                        <select
                          aria-label={`Change priority for ${task.title}`}
                          value={task.priority}
                          onChange={(e) =>
                            onChangePriority(task.id, e.target.value as TaskPriority)
                          }
                          className={`rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold transition-colors hover:border-slate-300 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-900 ${
                            task.priority === 'High'
                              ? 'text-red-600 dark:text-red-400'
                              : task.priority === 'Medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>

                      <td className="py-3.5 pr-4 align-top whitespace-nowrap">
                        <p
                          className={`font-mono text-xs font-medium tabular-nums ${
                            overdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatShortDate(task.dueDate)}
                          {overdue && ' · Overdue'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                          {formatTime12h(task.dueTime)}
                        </p>
                      </td>

                      <td className="py-3.5 pr-4 align-top whitespace-nowrap">
                        <select
                          aria-label={`Change status for ${task.title}`}
                          value={task.status}
                          onChange={(e) => onChangeStatus(task.id, e.target.value as TaskStatus)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      <td className="py-3.5 pr-5 align-top whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => onFocusTask(task)}
                              title="Focus on this task"
                              aria-label={`Focus on ${task.title}`}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#F4F2FF] hover:text-[#7664F0] dark:hover:bg-[#8B7CF6]/20 dark:hover:text-[#B3A7FA]"
                            >
                              <Timer className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            title="Edit task"
                            aria-label={`Edit ${task.title}`}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task)}
                            title="Delete task"
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
