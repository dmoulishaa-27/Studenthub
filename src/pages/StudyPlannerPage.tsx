import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { StudySession } from '../types';
import {
  addDaysISO,
  calculateDurationHours,
  formatDurationLabel,
  formatReadableDate,
  formatTime12h,
  getTodayISO,
  parseLocalDate,
} from '../utils/dateUtils';

interface StudyPlannerPageProps {
  sessions: StudySession[];
  onAddSession: (session: Omit<StudySession, 'id'>) => void;
  onUpdateSession: (id: string, updates: Partial<Omit<StudySession, 'id'>>) => void;
  onToggleSession: (id: string) => void;
  onDeleteSession: (session: StudySession) => void;
}

const COMMON_SUBJECTS = [
  'Computer Science',
  'Linear Algebra',
  'Data Structures',
  'Web Development',
  'Artificial Intelligence',
  'Algorithms',
  'Database Systems',
  'Operating Systems',
];

export function StudyPlannerPage({
  sessions,
  onAddSession,
  onUpdateSession,
  onToggleSession,
  onDeleteSession,
}: StudyPlannerPageProps) {
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [date, setDate] = useState(todayISO);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const daySessions = useMemo(() => {
    return sessions
      .filter((s) => s.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [sessions, selectedDate]);

  const metrics = useMemo(() => {
    const plannedHours = daySessions.reduce(
      (sum, s) => sum + calculateDurationHours(s.startTime, s.endTime),
      0
    );
    const completedHours = daySessions
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + calculateDurationHours(s.startTime, s.endTime), 0);
    const completedCount = daySessions.filter((s) => s.completed).length;
    const progressPct =
      plannedHours > 0 ? Math.round((completedHours / plannedHours) * 100) : 0;

    return {
      plannedHours,
      completedHours,
      completedCount,
      totalCount: daySessions.length,
      progressPct,
    };
  }, [daySessions]);

  // 7-day breakdown around selected date
  const weekSummary = useMemo(() => {
    const items: { iso: string; label: string; hours: number; count: number }[] = [];
    for (let offset = -2; offset <= 4; offset++) {
      const iso = addDaysISO(todayISO, offset);
      const d = parseLocalDate(iso);
      const matching = sessions.filter((s) => s.date === iso);
      const hours = matching.reduce(
        (sum, s) => sum + calculateDurationHours(s.startTime, s.endTime),
        0
      );
      items.push({
        iso,
        label:
          iso === todayISO
            ? 'Today'
            : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        hours,
        count: matching.length,
      });
    }
    return items;
  }, [sessions, todayISO]);

  // Subject breakdown across all scheduled sessions
  const subjectTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const hrs = calculateDurationHours(s.startTime, s.endTime);
      map.set(s.subject, (map.get(s.subject) || 0) + hrs);
    }
    return Array.from(map.entries())
      .map(([sub, hours]) => ({ subject: sub, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [sessions]);

  const openAddModal = () => {
    setEditingSession(null);
    setTitle('');
    setSubject('Computer Science');
    setDate(selectedDate);
    setStartTime('10:00');
    setEndTime('11:30');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (session: StudySession) => {
    setEditingSession(session);
    setTitle(session.title);
    setSubject(session.subject);
    setDate(session.date);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setNotes(session.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a study topic or session title.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Please specify a subject.');
      return;
    }
    if (!date) {
      setFormError('Please select a valid date.');
      return;
    }
    if (calculateDurationHours(startTime, endTime) <= 0) {
      setFormError('End time must be later than start time.');
      return;
    }

    if (editingSession) {
      onUpdateSession(editingSession.id, {
        title: title.trim(),
        subject: subject.trim(),
        date,
        startTime,
        endTime,
        notes: notes.trim() || undefined,
      });
    } else {
      onAddSession({
        title: title.trim(),
        subject: subject.trim(),
        date,
        startTime,
        endTime,
        completed: false,
        notes: notes.trim() || undefined,
      });
    }
    setSelectedDate(date);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Control Strip */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setSelectedDate(addDaysISO(selectedDate, -1))}
              aria-label="Previous day"
              className="rounded-l-xl p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(todayISO)}
              className="border-x border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(addDaysISO(selectedDate, 1))}
              aria-label="Next day"
              className="rounded-r-xl p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {formatReadableDate(selectedDate)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDate === todayISO ? 'Today’s daily study timeline' : 'Planned study schedule'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-[#243B64] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0] md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Study Session
        </button>
      </section>

      {/* Summary Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Planned Study Hours
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatDurationLabel(metrics.plannedHours)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {metrics.totalCount} scheduled {metrics.totalCount === 1 ? 'block' : 'blocks'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Completed Study Time
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatDurationLabel(metrics.completedHours)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {metrics.completedCount} of {metrics.totalCount} sessions completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Daily Progress</p>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#243B64] dark:text-[#9D8FF8]">
              {metrics.progressPct}%
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#243B64] transition-all duration-300 dark:bg-[#8B7CF6]"
              style={{ width: `${metrics.progressPct}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            {metrics.plannedHours > metrics.completedHours
              ? `${formatDurationLabel(metrics.plannedHours - metrics.completedHours)} remaining`
              : metrics.totalCount > 0
              ? 'All study sessions finished for this day'
              : 'Schedule blocks to track progress'}
          </p>
        </div>
      </section>

      {/* Main Split: Daily Timeline + Weekly & Subject Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Daily Timeline */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Daily Timeline
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Check off sessions as you complete them to update study hours
              </p>
            </div>
            <span className="font-mono text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
              {metrics.completedCount}/{metrics.totalCount} done
            </span>
          </div>

          {daySessions.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2F8] text-[#243B64] dark:bg-[#243B64]/30 dark:text-[#93B4E8]">
                <Clock className="h-5 w-5" />
              </div>
              <p className="mt-3 font-display text-sm font-semibold text-slate-800 dark:text-slate-200">
                No study sessions planned for {formatReadableDate(selectedDate)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Time-block focused study sessions by subject to stay ahead of exams and labs.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#243B64] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1C2F52] dark:bg-[#8B7CF6]"
              >
                <Plus className="h-3.5 w-3.5" />
                Schedule First Session
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-1">
              {daySessions.map((session, index) => {
                const durationHrs = calculateDurationHours(session.startTime, session.endTime);
                const isLast = index === daySessions.length - 1;
                return (
                  <div key={session.id} className="group flex gap-4">
                    {/* Left time column & timeline rail */}
                    <div className="flex w-20 shrink-0 flex-col items-end pt-1">
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {formatTime12h(session.startTime)}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-slate-400">
                        {formatTime12h(session.endTime)}
                      </span>
                    </div>

                    <div className="relative flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => onToggleSession(session.id)}
                        aria-label={
                          session.completed
                            ? `Mark "${session.title}" incomplete`
                            : `Mark "${session.title}" completed`
                        }
                        className={`z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          session.completed
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-[#243B64] bg-white hover:bg-[#EEF2F8] dark:border-[#8B7CF6] dark:bg-slate-900'
                        }`}
                      >
                        {session.completed && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                      {!isLast && (
                        <div className="my-1 w-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      )}
                    </div>

                    {/* Session Details */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-[#F8FAFC]/70 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-[#243B64] dark:text-[#9D8FF8]">
                              {session.subject}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {formatDurationLabel(durationHrs)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                session.completed
                                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                  : ''
                              }
                            >
                              {session.completed ? 'Completed' : 'Scheduled'}
                            </span>
                          </div>
                          <p
                            className={`mt-1 text-sm font-semibold ${
                              session.completed
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {session.title}
                          </p>
                          {session.notes && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {session.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(session)}
                            aria-label={`Edit ${session.title}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSession(session)}
                            aria-label={`Delete ${session.title}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Quick Day Switcher & Subject Hours */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              7-Day Schedule
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Jump directly to any day this week
            </p>
            <div className="mt-4 space-y-1.5">
              {weekSummary.map((day) => {
                const isSelected = day.iso === selectedDate;
                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => setSelectedDate(day.iso)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#EEF2F8] font-semibold text-[#243B64] dark:bg-[#243B64]/40 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span>{day.label}</span>
                    <span className="font-mono tabular-nums">
                      {day.hours > 0 ? formatDurationLabel(day.hours) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Planned Hours by Subject
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Total study allocation across your planner
            </p>
            {subjectTotals.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">No study hours scheduled yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {subjectTotals.map((item) => {
                  const maxHours = subjectTotals[0].hours || 1;
                  const pct = Math.round((item.hours / maxHours) * 100);
                  return (
                    <div key={item.subject}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {item.subject}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {formatDurationLabel(item.hours)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[#8B7CF6]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Add/Edit Study Session Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {editingSession ? 'Edit Study Session' : 'Add Study Session'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Session Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Linear Algebra Eigenvalue Practice"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="planner-subjects"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <datalist id="planner-subjects">
                    {COMMON_SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Study Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Chapters, practice problems, or goals for this block..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#243B64] px-5 py-2 text-sm font-medium text-white hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
                >
                  {editingSession ? 'Save Session' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
