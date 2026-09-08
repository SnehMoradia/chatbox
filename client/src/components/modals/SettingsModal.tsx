import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  User as UserIcon,
  LogOut,
  Check,
  Loader2,
  Upload,
  Camera,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { soundService } from '../../utils/sound';
import { UserStatus } from '../../types';
import { Avatar } from '../common/Avatar';
import { uploadsApi } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, updateStatus, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket } = useSocket();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [status, setStatus] = useState<UserStatus>(user?.status || 'available');
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, GIF, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size must be less than 15MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);
    try {
      const res = await uploadsApi.uploadSingle(file);
      if (res.success && res.file?.url) {
        setProfilePicture(res.file.url);
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload image from system.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePicture: profilePicture.trim(),
      });
      if (status !== user.status) {
        await updateStatus(status);
        if (socket) {
          socket.emit('statusChange', { status });
        }
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setEnabled(next);
    if (next) soundService.playNotification();
  };

  const statusOptions: Array<{ value: UserStatus; label: string; color: string }> = [
    { value: 'available', label: 'Available', color: 'bg-emerald-500' },
    { value: 'busy', label: 'Busy', color: 'bg-rose-500' },
    { value: 'dnd', label: 'Do not disturb', color: 'bg-red-600' },
    { value: 'away', label: 'Be right back', color: 'bg-amber-500' },
    { value: 'offline', label: 'Appear offline', color: 'bg-gray-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-teamsDark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teams-100 dark:bg-teams-900/50 flex items-center justify-center text-teams-600 dark:text-teams-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Settings & Preferences
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto teams-scrollbar">
          {/* Hidden File Input for System Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Profile Overview */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 dark:bg-teamsDark-input border border-gray-200/70 dark:border-teamsDark-border">
            {/* Clickable Avatar to Upload */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload new photo from device"
            >
              <Avatar
                name={displayName || user.displayName}
                imageUrl={profilePicture}
                size="lg"
                status={status}
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                {isUploadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 drop-shadow" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {displayName || user.displayName}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teams-100 dark:bg-teams-900/60 text-teams-700 dark:text-teams-300 font-medium">
                  {status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Profile Details
            </h4>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                About / Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What is your current focus?"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
              />
            </div>

            {/* Profile Picture Upload Section */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Profile Picture
              </label>

              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teams-50 dark:bg-teams-900/40 text-teams-700 dark:text-teams-300 border border-teams-200 dark:border-teams-800 hover:bg-teams-100 dark:hover:bg-teams-900/60 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-teams-500" />
                      <span>Uploading from device...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-teams-500" />
                      <span>Upload from Device</span>
                    </>
                  )}
                </button>

                {profilePicture && (
                  <button
                    type="button"
                    onClick={() => setProfilePicture('')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-teamsDark-input text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 border border-gray-200 dark:border-teamsDark-border transition-colors cursor-pointer"
                    title="Remove custom picture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-rose-500 mb-2">{uploadError}</p>
              )}

              {/* Or manual URL */}
              <div className="relative">
                <input
                  type="url"
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  placeholder="Or paste an image URL (https://...)"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none placeholder-gray-400"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Upload PNG, JPG, WebP, or GIF from your computer or paste an external image link.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Presence Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${
                      status === opt.value
                        ? 'border-teams-500 bg-teams-50/50 dark:bg-teams-900/30 text-teams-700 dark:text-teams-300'
                        : 'border-gray-200 dark:border-teamsDark-border hover:bg-gray-50 dark:hover:bg-teamsDark-input text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || isUploadingPhoto}
              className="w-full py-2 px-4 rounded-lg bg-teams-500 hover:bg-teams-600 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved Successfully
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </form>

          {/* Preferences */}
          <div className="pt-2 border-t border-gray-100 dark:border-teamsDark-border space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Appearance & Alerts
            </h4>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-teamsDark-input">
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-teams-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Theme Mode
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    Currently set to {theme === 'dark' ? 'Dark' : 'Light'} Mode
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-md shadow-xs hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors cursor-pointer"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Sound Notification Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-teamsDark-input">
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Notification Sound
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    Play Microsoft Teams chime on incoming messages
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  soundEnabled ? 'bg-teams-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Logout button */}
          <div className="pt-2 border-t border-gray-100 dark:border-teamsDark-border">
            <button
              type="button"
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Teams Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
