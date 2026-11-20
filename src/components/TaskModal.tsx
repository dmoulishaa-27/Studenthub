import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  CATEGORIES,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface TaskModalProps {
  open: boolean;
  editingTask?: Task | null;
  initialDate?: string;
  initialCategory?: TaskCategory;
  onClose: () => void;
  onSave: (
    data: Omit<Task, 'id' | 'createdAt' | 'completedAt'>,
    existingId?: string
  ) => void;
}

const SUBJECT_SUGGESTIONS = [
  'Computer Science',
  'Linear Algebra',
  'Data Structures',
  'Web Development',
  'Artificial Intelligence',
  'Algorithms',
  'Database Systems',
  'Operating Systems',
  'Mathematics',
  'Personal',
];

export function TaskModal({
  open,
  editingTask,
  initialDate,
  initialCategory,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Assignments');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [dueTime, setDueTime] = useState('18:00');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [errors, setErrors] = useState<{ title?: string; subject?: string; dueDate?: string }>({});

  useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setSubject(editingTask.subject);
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '18:00');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setSubject('');
      setCategory(initialCategory || 'Assignments');
      setDueDate(initialDate || getTodayISO());
      setDueTime('18:00');
      setPriority('Medium');
      setStatus('Pending');
    }
    setErrors({});
  }, [open, editingTask, initialDate, initialCategory]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { title?: string; subject?: string; dueDate?: string } = {};
    if (!title.trim()) nextErrors.title = 'Please enter a task title.';
    if (!subject.trim()) nextErrors.subject = 'Please specify a subject or course.';
    if (!dueDate) nextErrors.dueDate = 'Please select a due date.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        category,
        dueDate,
        dueTime: dueTime || '23:59',
        priority,
        status,
      },
      editingTask?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="task-modal-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingTask
                ? 'Update task details, deadline, or priority.'
                : 'Schedule an assignment, exam prep, project milestone, or study item.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <div>
            <label
              htmlFor="task-title"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g., Complete Java OOP Assignment"
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#8B7CF6] ${
                errors.title
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add requirements, chapters to review, or submission notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#8B7CF6]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-subject"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Subject / Course <span className="text-red-500">*</span>
              </label>
              <input
                id="task-subject"
                type="text"
                list="subject-suggestions"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                placeholder="e.g., Computer Science"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#8B7CF6] ${
                  errors.subject
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              <datalist id="subject-suggestions">
                {SUBJECT_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.subject}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-category"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-due-date"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
                }}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 transition-colors focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                  errors.dueDate
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-due-time"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Due Time
              </label>
              <input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 transition-colors focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Priority
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                {(['Low', 'Medium', 'High'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                      priority === p
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#243B64] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
            >
              {editingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
