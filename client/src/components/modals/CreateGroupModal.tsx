import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Loader2 } from 'lucide-react';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/ChatContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { createGroup } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupPicture, setGroupPicture] = useState('');
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setGroupPicture('');
      setQuery('');
      setSelectedUserIds([]);
      setError('');
      return;
    }

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const res = await usersApi.getAll();
        if (res.success) {
          setAllUsers(res.users);
        }
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    if (selectedUserIds.length === 0) {
      setError('Please select at least one other member for the group.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        groupPicture: groupPicture.trim() || undefined,
        members: selectedUserIds,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-teamsDark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teams-100 dark:bg-teams-900/50 flex items-center justify-center text-teams-600 dark:text-teams-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Create a Group Chat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto teams-scrollbar">
            {error && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            {/* Group Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Pulse Team, Frontend Guild"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                required
              />
            </div>

            {/* Group Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none resize-none"
              />
            </div>

            {/* Picture URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Group Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={groupPicture}
                onChange={(e) => setGroupPicture(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
              />
            </div>

            {/* Members Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Select Members ({selectedUserIds.length} selected) *
                </label>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter users..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                />
              </div>

              <div className="border border-gray-200 dark:border-teamsDark-border rounded-lg max-h-48 overflow-y-auto teams-scrollbar divide-y divide-gray-100 dark:divide-teamsDark-border">
                {isLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-teams-500" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    No users found.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        onClick={() => toggleUserSelection(u._id)}
                        className={`flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-teamsDark-cardHover cursor-pointer transition-colors ${
                          isSelected ? 'bg-teams-50/60 dark:bg-teams-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={u.displayName} imageUrl={u.profilePicture} size="sm" />
                          <div className="truncate">
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block truncate">
                              {u.displayName}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate block">
                              @{u.username}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-teams-500 border-teams-500 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 dark:bg-teamsDark-input/50 border-t border-gray-100 dark:border-teamsDark-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-teamsDark-card rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedUserIds.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-teams-500 hover:bg-teams-600 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
