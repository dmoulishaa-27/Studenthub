import { useMemo, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Sidebar } from './components/Sidebar';
import { TaskModal } from './components/TaskModal';
import { ToastContainer } from './components/ToastContainer';
import { TopHeader } from './components/TopHeader';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { useStudentHubStore } from './hooks/useStudentHubStore';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthPage } from './pages/AuthPage';
import { CalendarPage } from './pages/CalendarPage';
import { CompletedTasksPage } from './pages/CompletedTasksPage';
import { DashboardPage } from './pages/DashboardPage';
import { FocusModePage } from './pages/FocusModePage';
import { SettingsPage } from './pages/SettingsPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { TasksPage } from './pages/TasksPage';
import { PageId, StudySession, Task, TaskCategory } from './types';

export default function App() {
  const store = useStudentHubStore();
  const { state, session, authReady } = store;
  const isDark = state.preferences.theme === 'dark';

  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shared cross-page UI states
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<TaskCategory | 'All'>('All');
  const [focusTaskId, setFocusTaskId] = useState<string>('');

  // Task Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [modalInitialCategory, setModalInitialCategory] = useState<TaskCategory | undefined>(
    undefined
  );

  // Confirmation Dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Delete',
    onConfirm: () => {},
  });

  const activeFocusTask = useMemo(() => {
    const active = state.tasks.filter((t) => t.status !== 'Completed');
    return active.find((t) => t.id === focusTaskId) || active[0] || null;
  }, [state.tasks, focusTaskId]);

  const pomodoro = usePomodoroTimer({
    soundEnabled: state.preferences.notifications.focusBell,
    activeTaskId: activeFocusTask?.id,
    activeTaskTitle: activeFocusTask?.title,
    onSessionComplete: store.logFocusSession,
  });

  const focusTimeFormatted = `${String(Math.floor(pomodoro.secondsLeft / 60)).padStart(
    2,
    '0'
  )}:${String(pomodoro.secondsLeft % 60).padStart(2, '0')}`;

  const pendingCount = useMemo(
    () => state.tasks.filter((t) => t.status !== 'Completed').length,
    [state.tasks]
  );

  const completedCount = useMemo(
    () => state.tasks.filter((t) => t.status === 'Completed').length,
    [state.tasks]
  );

  // Auth wrapper handlers
  const handleLogin = async (params: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    const result = await store.login(params);
    if (result.ok) {
      setActivePage('dashboard');
      setGlobalSearch('');
      setSelectedTaskCategory('All');
      setFocusTaskId('');
      pomodoro.resetAll();
    }
    return result;
  };

  const handleRegister = async (params: {
    name: string;
    email: string;
    college: string;
    major: string;
    password: string;
    rememberMe: boolean;
  }) => {
    const result = await store.register(params);
    if (result.ok) {
      setActivePage('dashboard');
      setGlobalSearch('');
      setSelectedTaskCategory('All');
      setFocusTaskId('');
      pomodoro.resetAll();
    }
    return result;
  };

  const handleLogout = () => {
    pomodoro.resetAll();
    setGlobalSearch('');
    setSelectedTaskCategory('All');
    setFocusTaskId('');
    setTaskModalOpen(false);
    setActivePage('dashboard');
    store.logout();
  };

  // Modal helpers
  const openAddTaskModal = (opts?: { date?: string; category?: TaskCategory }) => {
    setEditingTask(null);
    setModalInitialDate(opts?.date);
    setModalInitialCategory(opts?.category);
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setModalInitialDate(undefined);
    setModalInitialCategory(undefined);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (
    data: Omit<Task, 'id' | 'createdAt' | 'completedAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      store.updateTask(existingId, data);
    } else {
      store.addTask(data);
    }
  };

  const requestDeleteTask = (task: Task) => {
    setConfirmState({
      open: true,
      title: 'Delete task?',
      description: `Are you sure you want to permanently remove "${task.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Task',
      onConfirm: () => {
        store.deleteTask(task.id);
        setConfirmState((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const requestDeleteStudySession = (sessionItem: StudySession) => {
    setConfirmState({
      open: true,
      title: 'Remove study session?',
      description: `Remove "${sessionItem.title}" from your study planner?`,
      confirmLabel: 'Remove Session',
      onConfirm: () => {
        store.deleteStudySession(sessionItem.id);
        setConfirmState((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const requestClearAllData = () => {
    setConfirmState({
      open: true,
      title: 'Clear all application data?',
      description:
        'This will permanently remove all your tasks, study sessions, and focus session logs from your account. Your login credentials, profile, and theme preference will remain intact.',
      confirmLabel: 'Clear Everything',
      onConfirm: () => {
        store.clearAllData();
        setConfirmState((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleFocusOnTask = (task: Task) => {
    setFocusTaskId(task.id);
    setActivePage('focus');
  };

  const handleFilterCategoryAndNavigate = (category: TaskCategory) => {
    setSelectedTaskCategory(category);
    setActivePage('tasks');
  };

  // Boot state while checking session
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-[#243B64] dark:border-slate-700 dark:border-t-[#8B7CF6]" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading StudentHub...
          </p>
        </div>
      </div>
    );
  }

  // Protected access: render AuthPage when not authenticated
  if (!session) {
    return (
      <>
        <AuthPage
          theme={state.preferences.theme}
          onToggleTheme={store.toggleThemeQuick}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onResetPassword={store.resetPassword}
        />
        <ToastContainer toasts={store.toasts} onDismiss={store.dismissToast} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        profile={state.profile}
        pendingCount={pendingCount}
        completedCount={completedCount}
        focusTimerRunning={pomodoro.isRunning}
        focusTimeFormatted={focusTimeFormatted}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          activePage={activePage}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onAddTask={() => openAddTaskModal()}
          onSelectTask={openEditTaskModal}
          onNavigate={setActivePage}
          onLogout={handleLogout}
          theme={state.preferences.theme}
          onToggleTheme={store.toggleThemeQuick}
          tasks={state.tasks}
          profile={state.profile}
          readNotificationIds={state.readNotificationIds}
          onMarkNotificationsRead={store.markNotificationsRead}
          overdueAlertsEnabled={state.preferences.notifications.overdueAlerts}
          deadlineRemindersEnabled={state.preferences.notifications.deadlineReminders}
        />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activePage === 'dashboard' && (
            <DashboardPage
              tasks={state.tasks}
              studySessions={state.studySessions}
              focusLogs={state.focusLogs}
              profile={state.profile}
              isDark={isDark}
              dailySummaryEnabled={state.preferences.notifications.dailySummary}
              onToggleTask={store.toggleTaskCompleted}
              onEditTask={openEditTaskModal}
              onAddTask={() => openAddTaskModal()}
              onNavigate={setActivePage}
              onFilterCategoryAndNavigate={handleFilterCategoryAndNavigate}
            />
          )}

          {activePage === 'tasks' && (
            <TasksPage
              tasks={state.tasks}
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
              selectedCategory={selectedTaskCategory}
              onSelectCategory={setSelectedTaskCategory}
              onAddTask={(category) => openAddTaskModal({ category })}
              onEditTask={openEditTaskModal}
              onDeleteTask={requestDeleteTask}
              onToggleTask={store.toggleTaskCompleted}
              onChangeStatus={store.changeTaskStatus}
              onChangePriority={store.changeTaskPriority}
              onFocusTask={handleFocusOnTask}
            />
          )}

          {activePage === 'calendar' && (
            <CalendarPage
              tasks={state.tasks}
              onAddTaskForDate={(date) => openAddTaskModal({ date })}
              onEditTask={openEditTaskModal}
              onDeleteTask={requestDeleteTask}
              onToggleTask={store.toggleTaskCompleted}
            />
          )}

          {activePage === 'planner' && (
            <StudyPlannerPage
              sessions={state.studySessions}
              onAddSession={store.addStudySession}
              onUpdateSession={store.updateStudySession}
              onToggleSession={store.toggleStudySessionCompleted}
              onDeleteSession={requestDeleteStudySession}
            />
          )}

          {activePage === 'focus' && (
            <FocusModePage
              tasks={state.tasks}
              focusLogs={state.focusLogs}
              selectedTaskId={focusTaskId}
              onSelectTaskId={setFocusTaskId}
              onCompleteTask={store.toggleTaskCompleted}
              soundEnabled={state.preferences.notifications.focusBell}
              onToggleSound={() =>
                store.updatePreferences(
                  (prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      focusBell: !prev.notifications.focusBell,
                    },
                  }),
                  true
                )
              }
              isDark={isDark}
              timer={pomodoro}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage
              tasks={state.tasks}
              studySessions={state.studySessions}
              focusLogs={state.focusLogs}
              isDark={isDark}
            />
          )}

          {activePage === 'completed' && (
            <CompletedTasksPage
              tasks={state.tasks}
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
              onRestoreTask={store.toggleTaskCompleted}
              onDeleteTask={requestDeleteTask}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              state={state}
              onUpdateProfile={store.updateProfile}
              onUpdatePreferences={store.updatePreferences}
              onRequestClearData={requestClearAllData}
              onResetSampleData={store.resetToSampleData}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Feedback */}
      <TaskModal
        open={taskModalOpen}
        editingTask={editingTask}
        initialDate={modalInitialDate}
        initialCategory={modalInitialCategory}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />

      <ToastContainer toasts={store.toasts} onDismiss={store.dismissToast} />
    </div>
  );
}
