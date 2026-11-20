import {
  createEmptyUserWorkspace,
  createSeedState,
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_PASSWORD,
} from '../data/seedData';
import {
  AuthSession,
  CATEGORIES,
  StudentHubState,
  StudySession,
  Task,
  UserAccount,
} from '../types';
import {
  generateSalt,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from '../utils/cryptoUtils';

const ACCOUNTS_KEY = 'studenthub_accounts_v2';
const SESSION_KEY = 'studenthub_session_v2';
const WORKSPACE_PREFIX = 'studenthub_workspace_v2_';
const THEME_KEY = 'studenthub_theme_v2';
const DEMO_USER_ID = 'user-demo-maya';

function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore quota or storage restrictions
  }
}

function safeRemoveItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function getSavedGlobalTheme(): 'light' | 'dark' {
  const saved = safeGetItem(localStorage, THEME_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

export function saveGlobalTheme(theme: 'light' | 'dark'): void {
  safeSetItem(localStorage, THEME_KEY, theme);
}

export function loadAccounts(): UserAccount[] {
  const raw = safeGetItem(localStorage, ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is UserAccount =>
        typeof a === 'object' &&
        a !== null &&
        typeof a.id === 'string' &&
        typeof a.email === 'string' &&
        typeof a.passwordSalt === 'string' &&
        typeof a.passwordHash === 'string'
    );
  } catch {
    return [];
  }
}

function saveAccounts(accounts: UserAccount[]): void {
  safeSetItem(localStorage, ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function ensureDemoAccountSeeded(): Promise<void> {
  const accounts = loadAccounts();
  if (accounts.length > 0) return;

  const salt = generateSalt();
  const passwordHash = await hashPassword(DEMO_ACCOUNT_PASSWORD, salt);
  const demoAccount: UserAccount = {
    id: DEMO_USER_ID,
    email: normalizeEmail(DEMO_ACCOUNT_EMAIL),
    passwordSalt: salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  saveAccounts([demoAccount]);

  const existingWorkspace = safeGetItem(localStorage, `${WORKSPACE_PREFIX}${DEMO_USER_ID}`);
  if (!existingWorkspace) {
    saveUserWorkspace(DEMO_USER_ID, createSeedState());
  }
}

export function loadActiveSession(): AuthSession | null {
  const checkStorage = (storage: Storage): AuthSession | null => {
    const raw = safeGetItem(storage, SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (typeof parsed.userId === 'string' && typeof parsed.email === 'string') {
        return {
          userId: parsed.userId,
          email: parsed.email,
          rememberMe: Boolean(parsed.rememberMe),
          loggedInAt: typeof parsed.loggedInAt === 'string' ? parsed.loggedInAt : new Date().toISOString(),
        };
      }
      return null;
    } catch {
      safeRemoveItem(storage, SESSION_KEY);
      return null;
    }
  };

  const session = checkStorage(sessionStorage) || checkStorage(localStorage);
  if (!session) return null;

  // Verify the session corresponds to a real stored account
  const accounts = loadAccounts();
  const matched = accounts.find((a) => a.id === session.userId);
  if (!matched) {
    clearActiveSession();
    return null;
  }
  return session;
}

export function saveActiveSession(session: AuthSession): void {
  clearActiveSession();
  const target = session.rememberMe ? localStorage : sessionStorage;
  safeSetItem(target, SESSION_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  safeRemoveItem(localStorage, SESSION_KEY);
  safeRemoveItem(sessionStorage, SESSION_KEY);
}

export async function registerAccount(params: {
  name: string;
  email: string;
  college: string;
  major: string;
  password: string;
  rememberMe: boolean;
}): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  const email = normalizeEmail(params.email);
  const accounts = loadAccounts();

  if (accounts.some((a) => normalizeEmail(a.email) === email)) {
    return {
      ok: false,
      error: 'An account with this email address already exists. Please log in instead.',
    };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(params.password, salt);
  const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newAccount: UserAccount = {
    id: userId,
    email,
    passwordSalt: salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, newAccount]);

  const workspace = createEmptyUserWorkspace({
    name: params.name.trim(),
    email,
    college: params.college.trim() || 'University',
    major: params.major.trim() || 'Undergraduate Student',
    avatar: 'monogram:navy',
  });
  workspace.preferences.theme = getSavedGlobalTheme();
  saveUserWorkspace(userId, workspace);

  const session: AuthSession = {
    userId,
    email,
    rememberMe: params.rememberMe,
    loggedInAt: new Date().toISOString(),
  };
  saveActiveSession(session);

  return { ok: true, session };
}

export async function loginAccount(params: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  const email = normalizeEmail(params.email);
  const accounts = loadAccounts();
  const account = accounts.find((a) => normalizeEmail(a.email) === email);

  if (!account) {
    return {
      ok: false,
      error: 'No account found with that email address. Please check your email or register.',
    };
  }

  const valid = await verifyPassword(params.password, account.passwordSalt, account.passwordHash);
  if (!valid) {
    return {
      ok: false,
      error: 'Incorrect password. Please try again or use Forgot Password.',
    };
  }

  const session: AuthSession = {
    userId: account.id,
    email: account.email,
    rememberMe: params.rememberMe,
    loggedInAt: new Date().toISOString(),
  };
  saveActiveSession(session);
  return { ok: true, session };
}

export async function resetAccountPassword(params: {
  email: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizeEmail(params.email);
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => normalizeEmail(a.email) === email);

  if (idx === -1) {
    return {
      ok: false,
      error: 'No registered student account was found for that email address.',
    };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(params.newPassword, salt);
  const updated = [...accounts];
  updated[idx] = {
    ...updated[idx],
    passwordSalt: salt,
    passwordHash,
  };
  saveAccounts(updated);
  return { ok: true };
}

export function updateAccountEmail(
  userId: string,
  newEmailRaw: string
): { ok: true; email: string } | { ok: false; error: string } {
  const newEmail = normalizeEmail(newEmailRaw);
  const accounts = loadAccounts();
  const duplicate = accounts.find(
    (a) => a.id !== userId && normalizeEmail(a.email) === newEmail
  );
  if (duplicate) {
    return {
      ok: false,
      error: 'Another account is already registered with that email address.',
    };
  }

  const updated = accounts.map((a) => (a.id === userId ? { ...a, email: newEmail } : a));
  saveAccounts(updated);

  // Sync active session email if present
  const session = loadActiveSession();
  if (session && session.userId === userId) {
    saveActiveSession({ ...session, email: newEmail });
  }
  return { ok: true, email: newEmail };
}

function sanitizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .filter((t) => typeof t.id === 'string' && typeof t.title === 'string')
    .map((t) => ({
      id: String(t.id),
      title: String(t.title),
      description: typeof t.description === 'string' ? t.description : '',
      subject: typeof t.subject === 'string' && t.subject.trim() ? t.subject : 'General',
      category: CATEGORIES.includes(t.category as Task['category'])
        ? (t.category as Task['category'])
        : 'Assignments',
      dueDate: typeof t.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)
        ? t.dueDate
        : new Date().toISOString().slice(0, 10),
      dueTime: typeof t.dueTime === 'string' && t.dueTime.includes(':') ? t.dueTime : '18:00',
      priority:
        t.priority === 'High' || t.priority === 'Medium' || t.priority === 'Low'
          ? t.priority
          : 'Medium',
      status:
        t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Completed'
          ? t.status
          : 'Pending',
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString().slice(0, 10),
      completedAt: typeof t.completedAt === 'string' ? t.completedAt : undefined,
    }));
}

function sanitizeStudySessions(raw: unknown): StudySession[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .filter((s) => typeof s.id === 'string' && typeof s.title === 'string')
    .map((s) => ({
      id: String(s.id),
      title: String(s.title),
      subject: typeof s.subject === 'string' && s.subject.trim() ? s.subject : 'General',
      date: typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
        ? s.date
        : new Date().toISOString().slice(0, 10),
      startTime: typeof s.startTime === 'string' && s.startTime.includes(':') ? s.startTime : '09:00',
      endTime: typeof s.endTime === 'string' && s.endTime.includes(':') ? s.endTime : '10:00',
      completed: Boolean(s.completed),
      notes: typeof s.notes === 'string' ? s.notes : undefined,
    }));
}

export function loadUserWorkspace(userId: string, fallbackEmail: string): StudentHubState {
  const defaultState = createEmptyUserWorkspace({
    name: fallbackEmail.split('@')[0] || 'Student',
    email: fallbackEmail,
  });

  const raw = safeGetItem(localStorage, `${WORKSPACE_PREFIX}${userId}`);
  if (!raw) {
    return userId === DEMO_USER_ID ? createSeedState() : defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StudentHubState>;
    const parsedProfile: Partial<StudentHubState['profile']> = parsed.profile || {};
    const parsedNotifs: Partial<StudentHubState['preferences']['notifications']> =
      parsed.preferences?.notifications || {};

    return {
      tasks: sanitizeTasks(parsed.tasks),
      studySessions: sanitizeStudySessions(parsed.studySessions),
      focusLogs: Array.isArray(parsed.focusLogs)
        ? parsed.focusLogs.filter(
            (l) =>
              typeof l === 'object' &&
              l !== null &&
              typeof l.id === 'string' &&
              typeof l.date === 'string' &&
              typeof l.durationMinutes === 'number'
          )
        : [],
      profile: {
        name:
          typeof parsedProfile.name === 'string' && parsedProfile.name.trim()
            ? parsedProfile.name
            : defaultState.profile.name,
        college:
          typeof parsedProfile.college === 'string'
            ? parsedProfile.college
            : defaultState.profile.college,
        major:
          typeof parsedProfile.major === 'string'
            ? parsedProfile.major
            : defaultState.profile.major,
        year:
          typeof parsedProfile.year === 'string'
            ? parsedProfile.year
            : defaultState.profile.year,
        email:
          typeof parsedProfile.email === 'string' && parsedProfile.email.trim()
            ? parsedProfile.email
            : fallbackEmail,
        avatar:
          typeof parsedProfile.avatar === 'string'
            ? parsedProfile.avatar
            : defaultState.profile.avatar,
      },
      preferences: {
        theme: parsed.preferences?.theme === 'dark' ? 'dark' : 'light',
        notifications: {
          deadlineReminders:
            typeof parsedNotifs.deadlineReminders === 'boolean'
              ? parsedNotifs.deadlineReminders
              : true,
          dailySummary:
            typeof parsedNotifs.dailySummary === 'boolean' ? parsedNotifs.dailySummary : true,
          focusBell:
            typeof parsedNotifs.focusBell === 'boolean' ? parsedNotifs.focusBell : true,
          overdueAlerts:
            typeof parsedNotifs.overdueAlerts === 'boolean' ? parsedNotifs.overdueAlerts : true,
        },
      },
      readNotificationIds: Array.isArray(parsed.readNotificationIds)
        ? parsed.readNotificationIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return defaultState;
  }
}

export function saveUserWorkspace(userId: string, state: StudentHubState): void {
  safeSetItem(localStorage, `${WORKSPACE_PREFIX}${userId}`, JSON.stringify(state));
  saveGlobalTheme(state.preferences.theme);
}
