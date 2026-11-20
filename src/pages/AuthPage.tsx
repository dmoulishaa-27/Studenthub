import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sun,
  Timer,
} from 'lucide-react';
import React, { useState } from 'react';
import { StudentHubLogo } from '../components/Sidebar';
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from '../data/seedData';
import { isValidEmail, validatePasswordStrength } from '../utils/cryptoUtils';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogin: (params: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  onRegister: (params: {
    name: string;
    email: string;
    college: string;
    major: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  onResetPassword: (params: {
    email: string;
    newPassword: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function AuthPage({
  theme,
  onToggleTheme,
  onLogin,
  onRegister,
  onResetPassword,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  // Shared & form fields
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setFormError('');
    setFormSuccess('');
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const fillDemoCredentials = () => {
    setMode('login');
    setEmail(DEMO_ACCOUNT_EMAIL);
    setPassword(DEMO_ACCOUNT_PASSWORD);
    setRememberMe(true);
    setFormError('');
    setFieldErrors({});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Please enter your password.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setFormError('');
    setSubmitting(true);
    const res = await onLogin({ email, password, rememberMe });
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Please enter your full name.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!college.trim()) {
      nextErrors.college = 'Please enter your college or university.';
    }
    const pwdIssue = validatePasswordStrength(password);
    if (pwdIssue) {
      nextErrors.password = pwdIssue;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setFormError('');
    setSubmitting(true);
    const res = await onRegister({
      name,
      email,
      college,
      major: major || 'Undergraduate Student',
      password,
      rememberMe,
    });
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = 'Please enter your registered email address.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    const pwdIssue = validatePasswordStrength(password);
    if (pwdIssue) {
      nextErrors.password = pwdIssue;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setFormError('');
    setSubmitting(true);
    const res = await onResetPassword({ email, newPassword: password });
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }

    setFormSuccess('Your password has been updated. Sign in below with your new password.');
    setMode('login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      {/* Top minimal bar */}
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <StudentHubLogo />
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </header>

      {/* Main 2-column balanced layout */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-14">
        {/* Left brand & value column */}
        <section className="space-y-8 lg:col-span-6">
          <div>
            <p className="text-sm font-semibold text-[#8B7CF6]">
              Plan Smarter. Study Better. Achieve More.
            </p>
            <h1 className="mt-3 max-w-lg font-display text-3xl font-bold tracking-tight text-slate-900 text-balance dark:text-white sm:text-4xl">
              Your complete academic workspace for every semester.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Organize assignments, track exam dates, schedule daily study sessions, run focused Pomodoro sprints, and monitor your productivity in one focused dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-800 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F8] text-[#243B64] dark:bg-[#243B64]/35 dark:text-[#93B4E8]">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Assignments & Deadlines
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Prioritize coursework by subject, due time, and category with instant status updates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F2FF] text-[#7664F0] dark:bg-[#8B7CF6]/20 dark:text-[#B3A7FA]">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Monthly & Weekly Calendar
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Spot overdue tasks and schedule exams directly on your interactive calendar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Daily Study Planner
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Time-block subject study sessions and track real completed study hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Timer className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Pomodoro Focus Mode
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Pair 25/5/15 focus sessions with your active tasks and real analytics.
                </p>
              </div>
            </div>
          </div>

          {/* Demo account info box */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Pre-populated Demo Student Account
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {DEMO_ACCOUNT_EMAIL} · {DEMO_ACCOUNT_PASSWORD}
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#243B64] transition-colors hover:bg-[#EEF2F8] dark:border-slate-700 dark:bg-slate-800 dark:text-[#C4B5FD] dark:hover:bg-slate-700"
              >
                Use Demo Credentials
              </button>
            </div>
          </div>
        </section>

        {/* Right authentication card */}
        <section className="lg:col-span-6">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111827] sm:p-8">
            {/* Mode Switch Tabs (Login / Register) */}
            {mode !== 'forgot' ? (
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Log In
              </button>
            )}

            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {mode === 'login'
                  ? 'Sign in to StudentHub'
                  : mode === 'register'
                  ? 'Create your student account'
                  : 'Reset your password'}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Access your personal assignments, schedule, and analytics.'
                  : mode === 'register'
                  ? 'Each account keeps its own private tasks, calendar, and study logs.'
                  : 'Enter your registered email to set a new local prototype password.'}
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
              >
                {formError}
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                {formSuccess}
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder="you@university.edu"
                      className={`w-full rounded-xl border bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.email
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-medium text-[#243B64] hover:underline dark:text-[#9D8FF8]"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: '' }));
                      }}
                      placeholder="Enter your password"
                      className={`w-full rounded-xl border bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.password
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#243B64] focus:ring-[#8B7CF6]"
                  />
                  <span>Remember me on this device</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#243B64] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C2F52] disabled:opacity-60 dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* REGISTRATION FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="reg-name"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g., Jordan Patel"
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                      fieldErrors.name
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((p) => ({ ...p, email: '' }));
                    }}
                    placeholder="you@university.edu"
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                      fieldErrors.email
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-college"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      College / University <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-college"
                      type="text"
                      value={college}
                      onChange={(e) => {
                        setCollege(e.target.value);
                        setFieldErrors((p) => ({ ...p, college: '' }));
                      }}
                      placeholder="e.g., State Tech Univ."
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.college
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.college && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.college}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="reg-major"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Major / Degree
                    </label>
                    <input
                      id="reg-major"
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g., Computer Science"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: '' }));
                      }}
                      placeholder="Min 8 chars, letters & numbers"
                      className={`w-full rounded-xl border bg-white py-2.5 pr-10 pl-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.password
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-confirm-password"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter your password"
                      className={`w-full rounded-xl border bg-white py-2.5 pr-10 pl-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.confirmPassword
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#243B64] focus:ring-[#8B7CF6]"
                  />
                  <span>Keep me signed in on this browser</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#243B64] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C2F52] disabled:opacity-60 dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
                >
                  {submitting ? 'Creating account...' : 'Create Student Account'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Registered Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((p) => ({ ...p, email: '' }));
                    }}
                    placeholder="you@university.edu"
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                      fieldErrors.email
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="forgot-new-password"
                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: '' }));
                      }}
                      placeholder="Min 8 chars, letters & numbers"
                      className={`w-full rounded-xl border bg-white py-2.5 pr-10 pl-3.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.password
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="forgot-confirm-password"
                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter your new password"
                      className={`w-full rounded-xl border bg-white py-2.5 pr-10 pl-3.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6] ${
                        fieldErrors.confirmPassword
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#243B64] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C2F52] disabled:opacity-60 dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
                >
                  {submitting ? 'Updating password...' : 'Update Password'}
                </button>
              </form>
            )}

            <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[11px] leading-relaxed text-slate-400 dark:border-slate-800 dark:text-slate-500">
              Prototype local authentication: credentials are salted and SHA-256 hashed inside your browser’s storage rather than stored in plain text.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
