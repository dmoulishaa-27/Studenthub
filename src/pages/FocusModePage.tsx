import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { POMODORO_MODE_CONFIG } from '../hooks/usePomodoroTimer';
import { FocusLogEntry, PomodoroMode, Task } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface FocusModePageProps {
  tasks: Task[];
  focusLogs: FocusLogEntry[];
  selectedTaskId: string;
  onSelectTaskId: (id: string) => void;
  onCompleteTask: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDark: boolean;
  timer: {
    mode: PomodoroMode;
    secondsLeft: number;
    totalSeconds: number;
    isRunning: boolean;
    cycleCount: number;
    toggle: () => void;
    reset: () => void;
    switchMode: (mode: PomodoroMode) => void;
    skip: () => void;
  };
}

export function FocusModePage({
  tasks,
  focusLogs,
  selectedTaskId,
  onSelectTaskId,
  onCompleteTask,
  soundEnabled,
  onToggleSound,
  isDark,
  timer,
}: FocusModePageProps) {
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'Completed'),
    [tasks]
  );

  const currentTask = useMemo(
    () => activeTasks.find((t) => t.id === selectedTaskId) || activeTasks[0] || null,
    [activeTasks, selectedTaskId]
  );

  useEffect(() => {
    if (!selectedTaskId && activeTasks.length > 0) {
      onSelectTaskId(activeTasks[0].id);
    }
  }, [selectedTaskId, activeTasks, onSelectTaskId]);

  const progress = (timer.totalSeconds - timer.secondsLeft) / timer.totalSeconds;

  const todayISO = getTodayISO();
  const todayFocusSessions = useMemo(
    () => focusLogs.filter((l) => l.date === todayISO && l.mode === 'focus'),
    [focusLogs, todayISO]
  );

  const totalFocusMinutesToday = todayFocusSessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  );

  const minutesDisplay = String(Math.floor(timer.secondsLeft / 60)).padStart(2, '0');
  const secondsDisplay = String(timer.secondsLeft % 60).padStart(2, '0');

  // SVG Ring geometry
  const size = 288;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const modeMeta = POMODORO_MODE_CONFIG[timer.mode];
  const activeStroke = isDark ? modeMeta.strokeDark : modeMeta.strokeLight;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Timer Workspace */}
      <section className="flex flex-col items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-6 py-8 dark:border-slate-800 dark:bg-[#111827] lg:col-span-8">
        {/* Mode Switcher */}
        <div className="flex w-full max-w-md items-center justify-between gap-2">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {(
              [
                ['focus', 'Focus · 25m'],
                ['shortBreak', 'Short · 5m'],
                ['longBreak', 'Long · 15m'],
              ] as [PomodoroMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => timer.switchMode(m)}
                className={`rounded-lg py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  timer.mode === m
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
            aria-label={soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>

        {/* Circular Pomodoro Timer */}
        <div className="my-8 flex flex-col items-center">
          <div className="relative flex h-72 w-72 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={isDark ? '#1E293B' : '#EEF2F8'}
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={activeStroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-300 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {modeMeta.label}
              </span>
              <span className="mt-1 font-mono text-6xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
                {minutesDisplay}:{secondsDisplay}
              </span>
              <span className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {timer.isRunning ? 'In progress' : modeMeta.subtitle}
              </span>
            </div>
          </div>

          {/* 4-Step Pomodoro Cycle Indicator */}
          <div className="mt-6 flex items-center gap-2">
            {[0, 1, 2, 3].map((step) => {
              const filled =
                step < timer.cycleCount % 4 ||
                (timer.cycleCount > 0 && timer.cycleCount % 4 === 0);
              return (
                <span
                  key={step}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    filled
                      ? 'bg-[#243B64] dark:bg-[#8B7CF6]'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Session {Math.min((timer.cycleCount % 4) + 1, 4)} of 4 before a long break
          </p>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={timer.reset}
            aria-label="Reset timer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={timer.toggle}
            className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#243B64] px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
          >
            {timer.isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {timer.secondsLeft < timer.totalSeconds ? 'Resume' : 'Start Focus'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={timer.skip}
            aria-label="Skip to next phase"
            title="Skip to next phase"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </button>
        </div>
      </section>

      {/* Right Column: Current Focus Task + Session Counter & History */}
      <aside className="space-y-6 lg:col-span-4">
        {/* Current Focus Task */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Current Focus Task
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Pair your timer with a single deliverable
          </p>

          {activeTasks.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              All your tasks are completed. Add a task or run an open study session.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <select
                aria-label="Select task to focus on"
                value={currentTask?.id || ''}
                onChange={(e) => onSelectTaskId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#243B64] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.subject})
                  </option>
                ))}
              </select>

              {currentTask && (
                <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {currentTask.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {currentTask.subject} · {currentTask.category} · {currentTask.priority} priority
                  </p>
                  {currentTask.description && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {currentTask.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onCompleteTask(currentTask.id)}
                    className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Task Completed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's Session Counter & Recent Log */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Focus Summary
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F8FAFC] p-3.5 dark:bg-slate-900/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Sessions Today</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {todayFocusSessions.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] p-3.5 dark:bg-slate-900/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Focused Time</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[#243B64] dark:text-[#9D8FF8]">
                {totalFocusMinutesToday}m
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Recent Completed Sessions
            </p>
            {focusLogs.filter((l) => l.mode === 'focus').length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">
                Complete a 25-minute block to build your focus history.
              </p>
            ) : (
              <div className="mt-2.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                {focusLogs
                  .filter((l) => l.mode === 'focus')
                  .slice(0, 4)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 py-2 text-xs"
                    >
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {entry.taskTitle || 'Focused Study Session'}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-slate-400">
                        {entry.durationMinutes}m
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
