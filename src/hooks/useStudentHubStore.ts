import { useCallback, useEffect, useState } from 'react';
import { createEmptyUserWorkspace, createSeedState } from '../data/seedData';
import {
  clearActiveSession,
  ensureDemoAccountSeeded,
  getSavedGlobalTheme,
  loadActiveSession,
  loadUserWorkspace,
  loginAccount,
  registerAccount,
  resetAccountPassword,
  saveGlobalTheme,
  saveUserWorkspace,
  updateAccountEmail,
} from '../services/authStorage';
import {
  AppPreferences,
  AuthSession,
  FocusLogEntry,
  StudentHubState,
  StudentProfile,
  StudySession,
  Task,
  TaskPriority,
  TaskStatus,
  ToastMessage,
} from '../types';
import { isValidEmail } from '../utils/cryptoUtils';
import { getTodayISO } from '../utils/dateUtils';

function createGuestThemeState(theme: 'light' | 'dark'): StudentHubState {
  const empty = createEmptyUserWorkspace({ name: 'Student', email: '' });
  empty.preferences.theme = theme;
  return empty;
}

export function useStudentHubStore() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [state, setState] = useState<StudentHubState>(() =>
    createGuestThemeState(getSavedGlobalTheme())
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Bootstrap demo account & restore active session on mount
  useEffect(() => {
    let active = true;
    (async () => {
      await ensureDemoAccountSeeded();
      if (!active) return;
      const restored = loadActiveSession();
      if (restored) {
        setSession(restored);
        setState(loadUserWorkspace(restored.userId, restored.email));
      } else {
        setSession(null);
        setState(createGuestThemeState(getSavedGlobalTheme()));
      }
      setAuthReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist user-isolated workspace whenever state updates while authenticated
  useEffect(() => {
    if (!authReady || !session) return;
    saveUserWorkspace(session.userId, state);
  }, [authReady, session, state]);

  // Keep document root dark class synced with theme preference (both logged in & on auth screen)
  useEffect(() => {
    const root = document.documentElement;
    if (state.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveGlobalTheme(state.preferences.theme);
  }, [state.preferences.theme]);

  const addToast = useCallback(
    (title: string, type: ToastMessage['type'] = 'success', description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth actions
  const login = useCallback(
    async (params: { email: string; password: string; rememberMe: boolean }) => {
      const result = await loginAccount(params);
      if (!result.ok) return result;
      const loaded = loadUserWorkspace(result.session.userId, result.session.email);
      setSession(result.session);
      setState(loaded);
      addToast('Welcome back', 'success', `Signed in as ${loaded.profile.name}`);
      return result;
    },
    [addToast]
  );

  const register = useCallback(
    async (params: {
      name: string;
      email: string;
      college: string;
      major: string;
      password: string;
      rememberMe: boolean;
    }) => {
      const result = await registerAccount(params);
      if (!result.ok) return result;
      const loaded = loadUserWorkspace(result.session.userId, result.session.email);
      setSession(result.session);
      setState(loaded);
      addToast('Account created', 'success', `Welcome to StudentHub, ${loaded.profile.name}!`);
      return result;
    },
    [addToast]
  );

  const resetPassword = useCallback(
    async (params: { email: string; newPassword: string }) => {
      const result = await resetAccountPassword(params);
      if (result.ok) {
        addToast('Password updated', 'success', 'You can now sign in with your new password.');
      }
      return result;
    },
    [addToast]
  );

  const logout = useCallback(() => {
    const currentTheme = state.preferences.theme;
    clearActiveSession();
    setSession(null);
    setState(createGuestThemeState(currentTheme));
    addToast('Signed out', 'info', 'Your workspace data remains safely saved.');
  }, [state.preferences.theme, addToast]);

  // Task operations
  const addTask = useCallback(
    (input: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
      const today = getTodayISO();
      const newTask: Task = {
        ...input,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: today,
        completedAt: input.status === 'Completed' ? today : undefined,
      };
      setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      addToast('Task added', 'success', newTask.title);
      return newTask;
    },
    [addToast]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const today = getTodayISO();
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id !== id) return task;
          const nextStatus = updates.status ?? task.status;
          let completedAt = task.completedAt;
          if (nextStatus === 'Completed' && task.status !== 'Completed') {
            completedAt = today;
          } else if (nextStatus !== 'Completed') {
            completedAt = undefined;
          }
          return { ...task, ...updates, status: nextStatus, completedAt };
        }),
      }));
      addToast('Task updated', 'success');
    },
    [addToast]
  );

  const toggleTaskCompleted = useCallback(
    (id: string) => {
      const today = getTodayISO();
      let toggledTitle = '';
      let becameCompleted = false;
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id !== id) return task;
          toggledTitle = task.title;
          const isNowCompleted = task.status !== 'Completed';
          becameCompleted = isNowCompleted;
          return {
            ...task,
            status: isNowCompleted ? 'Completed' : 'Pending',
            completedAt: isNowCompleted ? today : undefined,
          };
        }),
      }));
      if (toggledTitle) {
        addToast(
          becameCompleted ? 'Task completed' : 'Task restored to pending',
          becameCompleted ? 'success' : 'info',
          toggledTitle
        );
      }
    },
    [addToast]
  );

  const changeTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      const today = getTodayISO();
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id !== id) return task;
          return {
            ...task,
            status,
            completedAt: status === 'Completed' ? today : undefined,
          };
        }),
      }));
      addToast(`Status changed to ${status}`, 'info');
    },
    [addToast]
  );

  const changeTaskPriority = useCallback(
    (id: string, priority: TaskPriority) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === id ? { ...task, priority } : task)),
      }));
      addToast(`Priority updated to ${priority}`, 'info');
    },
    [addToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
      addToast('Task deleted', 'info');
    },
    [addToast]
  );

  // Study session operations
  const addStudySession = useCallback(
    (input: Omit<StudySession, 'id'>) => {
      const newSession: StudySession = {
        ...input,
        id: `study-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setState((prev) => ({
        ...prev,
        studySessions: [...prev.studySessions, newSession],
      }));
      addToast('Study session scheduled', 'success', newSession.title);
    },
    [addToast]
  );

  const updateStudySession = useCallback(
    (id: string, updates: Partial<Omit<StudySession, 'id'>>) => {
      setState((prev) => ({
        ...prev,
        studySessions: prev.studySessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
      addToast('Study session updated', 'success');
    },
    [addToast]
  );

  const toggleStudySessionCompleted = useCallback(
    (id: string) => {
      let sessionTitle = '';
      let nowDone = false;
      setState((prev) => ({
        ...prev,
        studySessions: prev.studySessions.map((s) => {
          if (s.id !== id) return s;
          sessionTitle = s.title;
          nowDone = !s.completed;
          return { ...s, completed: nowDone };
        }),
      }));
      if (sessionTitle) {
        addToast(
          nowDone ? 'Study session completed' : 'Study session reopened',
          nowDone ? 'success' : 'info',
          sessionTitle
        );
      }
    },
    [addToast]
  );

  const deleteStudySession = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        studySessions: prev.studySessions.filter((s) => s.id !== id),
      }));
      addToast('Study session removed', 'info');
    },
    [addToast]
  );

  // Focus logs
  const logFocusSession = useCallback(
    (entry: Omit<FocusLogEntry, 'id' | 'date' | 'completedAt'>) => {
      const newEntry: FocusLogEntry = {
        ...entry,
        id: `focus-${Date.now()}`,
        date: getTodayISO(),
        completedAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        focusLogs: [newEntry, ...prev.focusLogs],
      }));
      if (entry.mode === 'focus') {
        addToast(
          'Focus session complete',
          'success',
          `${entry.durationMinutes} minutes logged${entry.taskTitle ? ` · ${entry.taskTitle}` : ''}`
        );
      } else {
        addToast('Break complete', 'info', 'Ready for your next focus block.');
      }
    },
    [addToast]
  );

  // Profile & preferences
  const updateProfile = useCallback(
    (profile: StudentProfile): { ok: true } | { ok: false; error: string } => {
      if (!profile.name.trim()) {
        return { ok: false, error: 'Student name cannot be empty.' };
      }
      if (!isValidEmail(profile.email)) {
        return { ok: false, error: 'Please enter a valid email address.' };
      }

      let normalizedEmail = profile.email.trim().toLowerCase();
      if (session && normalizedEmail !== session.email.toLowerCase()) {
        const res = updateAccountEmail(session.userId, normalizedEmail);
        if (!res.ok) {
          addToast('Email update failed', 'error', res.error);
          return res;
        }
        normalizedEmail = res.email;
        setSession((prev) => (prev ? { ...prev, email: res.email } : prev));
      }

      setState((prev) => ({
        ...prev,
        profile: {
          ...profile,
          name: profile.name.trim(),
          college: profile.college.trim(),
          major: profile.major.trim(),
          year: profile.year.trim(),
          email: normalizedEmail,
        },
      }));
      addToast('Profile saved', 'success');
      return { ok: true };
    },
    [session, addToast]
  );

  const updatePreferences = useCallback(
    (updater: (prev: AppPreferences) => AppPreferences, silent = false) => {
      setState((prev) => ({
        ...prev,
        preferences: updater(prev.preferences),
      }));
      if (!silent) {
        addToast('Preferences updated', 'info');
      }
    },
    [addToast]
  );

  const toggleThemeQuick = useCallback(() => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: prev.preferences.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  }, []);

  const markNotificationsRead = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      readNotificationIds: Array.from(new Set([...prev.readNotificationIds, ...ids])),
    }));
  }, []);

  const clearAllData = useCallback(() => {
    setState((prev) => ({
      tasks: [],
      studySessions: [],
      focusLogs: [],
      profile: prev.profile,
      preferences: prev.preferences,
      readNotificationIds: [],
    }));
    addToast(
      'All workspace data cleared',
      'warning',
      'Tasks, study schedules, and focus logs were reset.'
    );
  }, [addToast]);

  const resetToSampleData = useCallback(() => {
    setState((prev) => {
      const fresh = createSeedState(prev.profile);
      return {
        ...fresh,
        profile: prev.profile,
        preferences: prev.preferences,
      };
    });
    addToast(
      'Sample data loaded',
      'success',
      'Starter assignments, schedules, and focus sessions added to your account.'
    );
  }, [addToast]);

  return {
    authReady,
    session,
    state,
    toasts,
    addToast,
    dismissToast,
    login,
    register,
    resetPassword,
    logout,
    addTask,
    updateTask,
    toggleTaskCompleted,
    changeTaskStatus,
    changeTaskPriority,
    deleteTask,
    addStudySession,
    updateStudySession,
    toggleStudySessionCompleted,
    deleteStudySession,
    logFocusSession,
    updateProfile,
    updatePreferences,
    toggleThemeQuick,
    markNotificationsRead,
    clearAllData,
    resetToSampleData,
  };
}
