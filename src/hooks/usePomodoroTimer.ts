import { useCallback, useEffect, useRef, useState } from 'react';
import { FocusLogEntry, PomodoroMode } from '../types';

export const POMODORO_MODE_CONFIG: Record<
  PomodoroMode,
  { label: string; minutes: number; subtitle: string; strokeLight: string; strokeDark: string }
> = {
  focus: {
    label: 'Focus Session',
    minutes: 25,
    subtitle: 'Deep academic focus block',
    strokeLight: '#243B64',
    strokeDark: '#8B7CF6',
  },
  shortBreak: {
    label: 'Short Break',
    minutes: 5,
    subtitle: 'Step away and reset your mind',
    strokeLight: '#8B7CF6',
    strokeDark: '#A78BFA',
  },
  longBreak: {
    label: 'Long Break',
    minutes: 15,
    subtitle: 'Extended recharge after a full cycle',
    strokeLight: '#16A34A',
    strokeDark: '#34D399',
  },
};

function playCompletionChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.5);
    });
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

interface UsePomodoroTimerOptions {
  soundEnabled: boolean;
  activeTaskId?: string;
  activeTaskTitle?: string;
  onSessionComplete: (entry: Omit<FocusLogEntry, 'id' | 'date' | 'completedAt'>) => void;
}

export function usePomodoroTimer({
  soundEnabled,
  activeTaskId,
  activeTaskTitle,
  onSessionComplete,
}: UsePomodoroTimerOptions) {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_MODE_CONFIG.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const secondsLeftRef = useRef(secondsLeft);
  const completingRef = useRef(false);

  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  const completePhase = useCallback(
    (skipped: boolean) => {
      if (completingRef.current) return;
      completingRef.current = true;
      setIsRunning(false);
      endTimeRef.current = null;

      if (!skipped) {
        if (soundEnabled) playCompletionChime();
        onSessionComplete({
          durationMinutes: POMODORO_MODE_CONFIG[mode].minutes,
          mode,
          taskId: activeTaskId,
          taskTitle: activeTaskTitle,
        });
      }

      if (mode === 'focus') {
        const nextCycle = cycleCount + 1;
        setCycleCount(nextCycle);
        const nextMode: PomodoroMode = nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setSecondsLeft(POMODORO_MODE_CONFIG[nextMode].minutes * 60);
      } else {
        setMode('focus');
        setSecondsLeft(POMODORO_MODE_CONFIG.focus.minutes * 60);
      }

      window.setTimeout(() => {
        completingRef.current = false;
      }, 150);
    },
    [mode, cycleCount, soundEnabled, onSessionComplete, activeTaskId, activeTaskTitle]
  );

  useEffect(() => {
    if (!isRunning) {
      endTimeRef.current = null;
      return;
    }

    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + secondsLeftRef.current * 1000;
    }

    const tick = () => {
      if (endTimeRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft((prev) => (prev !== remaining ? remaining : prev));
      if (remaining <= 0) {
        completePhase(false);
      }
    };

    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [isRunning, completePhase]);

  const start = useCallback(() => {
    const startingSeconds =
      secondsLeftRef.current <= 0
        ? POMODORO_MODE_CONFIG[mode].minutes * 60
        : secondsLeftRef.current;
    if (secondsLeftRef.current <= 0) {
      setSecondsLeft(startingSeconds);
    }
    endTimeRef.current = Date.now() + startingSeconds * 1000;
    setIsRunning(true);
  }, [mode]);

  const pause = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setSecondsLeft(POMODORO_MODE_CONFIG[mode].minutes * 60);
  }, [mode]);

  const switchMode = useCallback((nextMode: PomodoroMode) => {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode(nextMode);
    setSecondsLeft(POMODORO_MODE_CONFIG[nextMode].minutes * 60);
  }, []);

  const skip = useCallback(() => {
    completePhase(true);
  }, [completePhase]);

  const resetAll = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode('focus');
    setCycleCount(0);
    setSecondsLeft(POMODORO_MODE_CONFIG.focus.minutes * 60);
  }, []);

  return {
    mode,
    secondsLeft,
    totalSeconds: POMODORO_MODE_CONFIG[mode].minutes * 60,
    isRunning,
    cycleCount,
    start,
    pause,
    toggle,
    reset,
    switchMode,
    skip,
    resetAll,
  };
}
