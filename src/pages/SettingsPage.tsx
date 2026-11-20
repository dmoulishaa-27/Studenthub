import {
  Check,
  Download,
  LogOut,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import {
  AppPreferences,
  PRESET_AVATARS,
  StudentHubState,
  StudentProfile,
} from '../types';
import { isValidEmail } from '../utils/cryptoUtils';

interface SettingsPageProps {
  state: StudentHubState;
  onUpdateProfile: (profile: StudentProfile) => { ok: true } | { ok: false; error: string };
  onUpdatePreferences: (updater: (prev: AppPreferences) => AppPreferences) => void;
  onRequestClearData: () => void;
  onResetSampleData: () => void;
  onLogout: () => void;
}

export function SettingsPage({
  state,
  onUpdateProfile,
  onUpdatePreferences,
  onRequestClearData,
  onResetSampleData,
  onLogout,
}: SettingsPageProps) {
  const [name, setName] = useState(state.profile.name);
  const [college, setCollege] = useState(state.profile.college);
  const [major, setMajor] = useState(state.profile.major);
  const [year, setYear] = useState(state.profile.year);
  const [email, setEmail] = useState(state.profile.email);
  const [avatar, setAvatar] = useState(state.profile.avatar);
  const [profileError, setProfileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(state.profile.name);
    setCollege(state.profile.college);
    setMajor(state.profile.major);
    setYear(state.profile.year);
    setEmail(state.profile.email);
    setAvatar(state.profile.avatar);
  }, [state.profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Student name cannot be empty.');
      return;
    }
    if (!isValidEmail(email)) {
      setProfileError('Please enter a valid email address.');
      return;
    }
    setProfileError('');
    const result = onUpdateProfile({
      name: name.trim(),
      college: college.trim() || 'University',
      major: major.trim() || 'Undergraduate Student',
      year: year.trim() || 'Current Semester',
      email: email.trim().toLowerCase(),
      avatar,
    });
    if (!result.ok) {
      setProfileError(result.error);
    }
  };

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setProfileError('Please choose an image smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        setProfileError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studenthub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { theme, notifications } = state.preferences;

  const notificationOptions: {
    key: keyof AppPreferences['notifications'];
    title: string;
    description: string;
  }[] = [
    {
      key: 'deadlineReminders',
      title: 'Deadline Reminders',
      description: 'Surface tasks due today inside the header alert tray.',
    },
    {
      key: 'overdueAlerts',
      title: 'Overdue Task Alerts',
      description: 'Highlight missed assignment deadlines requiring immediate action.',
    },
    {
      key: 'focusBell',
      title: 'Focus Timer Audio Chime',
      description: 'Play a gentle acoustic chime when a Pomodoro session or break ends.',
    },
    {
      key: 'dailySummary',
      title: 'Daily Study Summary',
      description: 'Include planned study hours in your dashboard morning greeting.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 1. Student Profile */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Student Profile
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Update your name, college information, academic program, email, and avatar.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-6" noValidate>
          {profileError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
            >
              {profileError}
            </div>
          )}

          {/* Avatar selector */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar src={avatar} name={name || 'Student'} size="xl" />
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatar === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatar(preset.id)}
                      title={preset.label}
                      className={`relative rounded-full p-0.5 transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#243B64] ring-offset-2 dark:ring-[#8B7CF6] dark:ring-offset-slate-900'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Avatar src={preset.id} name={name || 'Student'} size="md" />
                    </button>
                  );
                })}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Photo
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a studio portrait, monogram badge, or upload your own square photo.
              </p>
            </div>
          </div>

          {/* Profile fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (profileError) setProfileError('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Account Email <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (profileError) setProfileError('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="profile-college"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                College / University
              </label>
              <input
                id="profile-college"
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g., Pacific Institute of Technology"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-major"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Degree / Major
              </label>
              <input
                id="profile-major"
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-year"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Academic Year / Term
              </label>
              <input
                id="profile-year"
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#243B64] focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-[#8B7CF6]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[#243B64] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C2F52] dark:bg-[#8B7CF6] dark:hover:bg-[#7664F0]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* 2. Appearance (Light / Dark Theme) */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Appearance
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Switch between crisp daytime light mode and low-glare dark mode for late study sessions.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onUpdatePreferences((prev) => ({ ...prev, theme: 'light' }))}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
              theme === 'light'
                ? 'border-[#243B64] bg-[#EEF2F8]/60 dark:border-[#8B7CF6] dark:bg-[#243B64]/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#243B64]">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Light Theme</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Soft off-white canvas & crisp navy
                </p>
              </div>
            </div>
            {theme === 'light' && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#243B64] text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onUpdatePreferences((prev) => ({ ...prev, theme: 'dark' }))}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
              theme === 'dark'
                ? 'border-[#8B7CF6] bg-[#8B7CF6]/10'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0B1120] text-[#9D8FF8]">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Dark Theme</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deep slate canvas for evening focus
                </p>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B7CF6] text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        </div>
      </section>

      {/* 3. Notification Preferences */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Notification Preferences
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Control which reminders and audio alerts appear across your workspace.
          </p>
        </div>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/80">
          {notificationOptions.map((opt) => {
            const enabled = notifications[opt.key];
            return (
              <div key={opt.key} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {opt.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={opt.title}
                  onClick={() =>
                    onUpdatePreferences((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [opt.key]: !prev.notifications[opt.key],
                      },
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    enabled
                      ? 'bg-[#243B64] dark:bg-[#8B7CF6]'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition-transform ${
                      enabled ? 'translate-x-5.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Data Management */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Workspace Data
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Your workspace data is isolated to your account in browser storage. Export a backup or reset records.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Export Backup (JSON)
            </button>

            <button
              type="button"
              onClick={onResetSampleData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Load Sample Data
            </button>
          </div>

          <button
            type="button"
            onClick={onRequestClearData}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All Application Data
          </button>
        </div>
      </section>
    </div>
  );
}
