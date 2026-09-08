import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  UserPlus,
  UserMinus,
  LogOut,
  Edit2,
  FileText,
  Image as ImageIcon,
  Check,
  Loader2,
  Film,
  Download,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';
import { messagesApi, usersApi } from '../../services/api';
import { User } from '../../types';

export const InfoPanel: React.FC = () => {
  const {
    activeConversation,
    isInfoPanelOpen,
    setIsInfoPanelOpen,
    updateGroupInfo,
    addMembersToGroup,
    removeMemberFromGroup,
    toggleAdminRole,
    leaveCurrentGroup,
  } = useChat();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'files'>('details');
  const [sharedMedia, setSharedMedia] = useState<Array<{ type: 'image' | 'gif'; url: string; name?: string; size?: number; messageId: string; createdAt: string }>>([]);
  const [sharedFiles, setSharedFiles] = useState<Array<{ type: 'file'; url: string; name: string; size: number; mimeType: string; messageId: string; createdAt: string }>>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Group editing state
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPicture, setGroupPicture] = useState('');

  // Add member modal state
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const isGroup = activeConversation?.type === 'group';
  const otherMember = !isGroup && activeConversation
    ? activeConversation.members.find((m) => m._id !== user?._id)
    : undefined;

  const isAdmin = isGroup && activeConversation
    ? activeConversation.admins?.some((a) => a._id === user?._id)
    : false;

  // Load shared media and files for conversation
  useEffect(() => {
    if (!activeConversation || !isInfoPanelOpen) return;

    let isMounted = true;
    const fetchMedia = async () => {
      setIsLoadingMedia(true);
      try {
        const res = await messagesApi.getMedia(activeConversation._id);
        if (isMounted && res.success) {
          setSharedMedia(res.media);
          setSharedFiles(res.files);
        }
      } catch (err) {
        console.error('Failed fetching media:', err);
      } finally {
        if (isMounted) setIsLoadingMedia(false);
      }
    };

    fetchMedia();
    return () => {
      isMounted = false;
    };
  }, [activeConversation?._id, isInfoPanelOpen]);

  if (!isInfoPanelOpen || !activeConversation) return null;

  const handleStartEditGroup = () => {
    setGroupName(activeConversation.name || '');
    setGroupDescription(activeConversation.description || '');
    setGroupPicture(activeConversation.groupPicture || '');
    setIsEditingGroup(true);
  };

  const handleSaveGroupEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    await updateGroupInfo(activeConversation._id, {
      name: groupName.trim(),
      description: groupDescription.trim(),
      groupPicture: groupPicture.trim(),
    });
    setIsEditingGroup(false);
  };

  const handleOpenAddMembers = async () => {
    setIsAddingMembers(true);
    setIsLoadingUsers(true);
    try {
      const res = await usersApi.getAll();
      if (res.success) {
        // Filter out existing members
        const existingIds = new Set(activeConversation.members.map((m) => m._id));
        setAvailableUsers(res.users.filter((u) => !existingIds.has(u._id)));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedUserIds.length === 0) return;
    await addMembersToGroup(activeConversation._id, selectedUserIds);
    setSelectedUserIds([]);
    setIsAddingMembers(false);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <aside className="w-80 lg:w-88 bg-teamsLight-panel dark:bg-teamsDark-panel border-l border-gray-200/80 dark:border-teamsDark-border flex flex-col h-full flex-shrink-0 select-none animate-fade-in z-20">
      {/* Header */}
      <div className="h-16 px-4 border-b border-gray-200/80 dark:border-teamsDark-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {isGroup ? 'Group Information' : 'User Profile'}
        </h3>
        <button
          type="button"
          onClick={() => setIsInfoPanelOpen(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors"
          title="Close details panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs for Details, Media, Files */}
      <div className="flex border-b border-gray-200/60 dark:border-teamsDark-border px-3 pt-2 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-teams-500 text-teams-600 dark:text-teams-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-teams-500 text-teams-600 dark:text-teams-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Photos ({sharedMedia.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-teams-500 text-teams-600 dark:text-teams-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Files ({sharedFiles.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto teams-scrollbar p-4 space-y-6">
        {activeTab === 'details' && (
          <>
            {/* Top Profile / Group Identity Card */}
            <div className="flex flex-col items-center text-center p-3">
              <Avatar
                name={isGroup ? activeConversation.name || 'Group' : otherMember?.displayName || 'User'}
                imageUrl={isGroup ? activeConversation.groupPicture : otherMember?.profilePicture}
                size="xl"
                status={otherMember?.status}
                isOnline={otherMember ? isUserOnline(otherMember._id) : undefined}
                className="mb-3"
              />

              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {isGroup ? activeConversation.name : otherMember?.displayName}
              </h4>

              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                {isGroup ? 'Group Conversation' : `@${otherMember?.username}`}
              </p>

              {!isGroup && otherMember?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {otherMember.email}
                </p>
              )}

              {/* Status pill for 1-on-1 */}
              {!isGroup && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-teamsDark-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-teamsDark-border">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isUserOnline(otherMember?._id || '') ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="capitalize">{otherMember?.status || 'Offline'}</span>
                </span>
              )}
            </div>

            {/* About / Description Section */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-teamsDark-card border border-gray-200/70 dark:border-teamsDark-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {isGroup ? 'Group Description' : 'About'}
                </span>
                {isGroup && (
                  <button
                    onClick={handleStartEditGroup}
                    className="text-xs text-teams-600 dark:text-teams-400 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {(isGroup ? activeConversation.description : otherMember?.bio) ||
                  (isGroup ? 'No description added yet.' : 'No bio available.')}
              </p>
            </div>

            {/* Group Members Section (Groups only) */}
            {isGroup && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      Members ({activeConversation.members.length})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddMembers}
                    className="text-xs font-semibold text-teams-600 dark:text-teams-400 hover:text-teams-700 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {/* Member Roster List */}
                <div className="space-y-1.5 divide-y divide-gray-100 dark:divide-teamsDark-border">
                  {activeConversation.members.map((member) => {
                    const isMemberAdmin = activeConversation.admins?.some(
                      (a) => a._id === member._id
                    );
                    const isSelf = member._id === user?._id;

                    return (
                      <div
                        key={member._id}
                        className="pt-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            name={member.displayName}
                            imageUrl={member.profilePicture}
                            size="sm"
                            isOnline={isUserOnline(member._id)}
                          />
                          <div className="truncate">
                            <span className="font-medium text-gray-800 dark:text-gray-200 block truncate">
                              {member.displayName} {isSelf && '(You)'}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate">
                              @{member.username}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isMemberAdmin && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-teams-100 dark:bg-teams-900/60 text-teams-700 dark:text-teams-300 text-[10px] font-semibold">
                              <Shield className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}

                          {/* Admin actions dropdown/buttons for other members */}
                          {isAdmin && !isSelf && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleAdminRole(activeConversation._id, member._id)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-gray-400 hover:text-teams-500"
                                title={isMemberAdmin ? 'Demote Admin' : 'Make Admin'}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMemberFromGroup(activeConversation._id, member._id)}
                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-600"
                                title="Remove member"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Leave Group Action */}
                <div className="pt-4 border-t border-gray-200 dark:border-teamsDark-border">
                  <button
                    type="button"
                    onClick={() => leaveCurrentGroup(activeConversation._id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Leave Group
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Media (Photos & GIFs) Tab */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            {isLoadingMedia ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teams-500" />
              </div>
            ) : sharedMedia.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No photos or GIFs shared in this conversation.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {sharedMedia.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative rounded-lg overflow-hidden h-28 bg-gray-100 dark:bg-teamsDark-card block"
                  >
                    <img
                      src={item.url}
                      alt={item.name || 'Shared Media'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {item.type === 'gif' && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                        GIF
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            {isLoadingMedia ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teams-500" />
              </div>
            ) : sharedFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No documents or files shared in this chat.
              </div>
            ) : (
              sharedFiles.map((f, idx) => (
                <a
                  key={idx}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  download={f.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border hover:bg-gray-50 dark:hover:bg-teamsDark-cardHover transition-colors"
                >
                  <div className="p-2 rounded bg-teams-50 dark:bg-teams-900/40 text-teams-600 dark:text-teams-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatFileSize(f.size)}</p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-gray-400 hover:text-teams-500" />
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Group Modal */}
      {isEditingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Edit Group Details
              </h4>
              <button
                onClick={() => setIsEditingGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGroupEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={groupPicture}
                  onChange={(e) => setGroupPicture(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGroup(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-teams-500 hover:bg-teams-600 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {isAddingMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Add Members to Group
              </h4>
              <button
                onClick={() => setIsAddingMembers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto teams-scrollbar space-y-1 mb-4">
              {isLoadingUsers ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-teams-500" />
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  All available users are already in this group.
                </div>
              ) : (
                availableUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() =>
                        setSelectedUserIds((prev) =>
                          isSelected ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                        )
                      }
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-teams-50 dark:bg-teams-900/30' : 'hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar name={u.displayName} imageUrl={u.profilePicture} size="sm" />
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {u.displayName}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingMembers(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedUserIds.length === 0}
                onClick={handleConfirmAddMembers}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teams-500 hover:bg-teams-600 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Add ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
