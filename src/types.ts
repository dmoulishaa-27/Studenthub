export type PageId =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'planner'
  | 'focus'
  | 'analytics'
  | 'completed'
  | 'settings';

export type TaskCategory =
  | 'Assignments'
  | 'Projects'
  | 'Examinations'
  | 'Coding Practice'
  | 'Study Sessions'
  | 'Personal Tasks';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface UserAccount {
  id: string;
  email: string; // normalized lowercase
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  rememberMe: boolean;
  loggedInAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  completed: boolean;
  notes?: string;
}

export interface FocusLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO string
  durationMinutes: number;
  mode: PomodoroMode;
  taskId?: string;
  taskTitle?: string;
}

export interface StudentProfile {
  name: string;
  college: string;
  major: string;
  year: string;
  email: string;
  avatar: string; // URL path, data URL, or monogram key like 'monogram:navy'
}

export interface NotificationPreferences {
  deadlineReminders: boolean;
  dailySummary: boolean;
  focusBell: boolean;
  overdueAlerts: boolean;
}

export interface AppPreferences {
  theme: 'light' | 'dark';
  notifications: NotificationPreferences;
}

export interface StudentHubState {
  tasks: Task[];
  studySessions: StudySession[];
  focusLogs: FocusLogEntry[];
  profile: StudentProfile;
  preferences: AppPreferences;
  readNotificationIds: string[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface CategoryMeta {
  name: TaskCategory;
  color: string;
  softBg: string;
  darkSoftBg: string;
  textColor: string;
  darkTextColor: string;
  dotClass: string;
}

export const CATEGORIES: TaskCategory[] = [
  'Assignments',
  'Projects',
  'Examinations',
  'Coding Practice',
  'Study Sessions',
  'Personal Tasks',
];

export const CATEGORY_META: Record<TaskCategory, CategoryMeta> = {
  Assignments: {
    name: 'Assignments',
    color: '#243B64',
    softBg: 'bg-[#EEF2F8]',
    darkSoftBg: 'dark:bg-[#243B64]/30',
    textColor: 'text-[#243B64]',
    darkTextColor: 'dark:text-[#93B4E8]',
    dotClass: 'bg-[#243B64] dark:bg-[#7CA0DE]',
  },
  Projects: {
    name: 'Projects',
    color: '#8B7CF6',
    softBg: 'bg-[#F4F2FF]',
    darkSoftBg: 'dark:bg-[#8B7CF6]/20',
    textColor: 'text-[#6D5CE7]',
    darkTextColor: 'dark:text-[#B3A7FA]',
    dotClass: 'bg-[#8B7CF6]',
  },
  Examinations: {
    name: 'Examinations',
    color: '#D97706',
    softBg: 'bg-amber-50',
    darkSoftBg: 'dark:bg-amber-500/15',
    textColor: 'text-amber-700',
    darkTextColor: 'dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  'Coding Practice': {
    name: 'Coding Practice',
    color: '#0284C7',
    softBg: 'bg-sky-50',
    darkSoftBg: 'dark:bg-sky-500/15',
    textColor: 'text-sky-700',
    darkTextColor: 'dark:text-sky-400',
    dotClass: 'bg-sky-500',
  },
  'Study Sessions': {
    name: 'Study Sessions',
    color: '#16A34A',
    softBg: 'bg-emerald-50',
    darkSoftBg: 'dark:bg-emerald-500/15',
    textColor: 'text-emerald-700',
    darkTextColor: 'dark:text-emerald-400',
    dotClass: 'bg-emerald-600',
  },
  'Personal Tasks': {
    name: 'Personal Tasks',
    color: '#64748B',
    softBg: 'bg-slate-100',
    darkSoftBg: 'dark:bg-slate-700/40',
    textColor: 'text-slate-600',
    darkTextColor: 'dark:text-slate-300',
    dotClass: 'bg-slate-500',
  },
};

export const PRESET_AVATARS = [
  {
    id: '/src/assets/images/avatar_student_1_1795183989616.jpg',
    label: 'Studio Portrait 1',
    type: 'image' as const,
  },
  {
    id: '/src/assets/images/avatar_student_4_1795183989855.jpg',
    label: 'Studio Portrait 2',
    type: 'image' as const,
  },
  {
    id: 'monogram:navy',
    label: 'Deep Navy Monogram',
    type: 'monogram' as const,
    bg: 'bg-[#243B64]',
  },
  {
    id: 'monogram:violet',
    label: 'Soft Violet Monogram',
    type: 'monogram' as const,
    bg: 'bg-[#7C6CEB]',
  },
  {
    id: 'monogram:emerald',
    label: 'Forest Green Monogram',
    type: 'monogram' as const,
    bg: 'bg-emerald-700',
  },
  {
    id: 'monogram:slate',
    label: 'Slate Ink Monogram',
    type: 'monogram' as const,
    bg: 'bg-slate-700',
  },
];
