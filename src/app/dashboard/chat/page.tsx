'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStaffAuth } from '@/lib/auth-context';
import { type Department } from '@/lib/departments';
import { useFirestore, useStorage } from '@/firebase';
import {
  subscribeToRooms,
  subscribeToMessages,
  sendMessage,
  createRoom,
  deleteRoom,
  deleteMessage,
  clearChat,
  seedDefaultRooms,
  pickAvatarColor,
  uploadFileMessage,
  type ChatRoomDoc,
  type ChatMessageDoc,
} from '@/lib/chat-service';
import EmojiPicker from '@/components/chat/emoji-picker';
import {
  Send,
  Users,
  Search,
  ArrowLeft,
  MessageSquare,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  Check,
  CheckCheck,
  X,
  Plus,
  Loader2,
  UserPlus,
  Hash,
  Trash2,
  AlertTriangle,
  Eraser,
  FileText,
  Download,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

// ── Avatar colors ──────────────────────────────────────
const AVATAR_COLORS = ['#5856d6', '#ff2d55', '#ff9500', '#34c759', '#af52de', '#00c7be', '#0071e3', '#ff6482'];

// ── Helpers ────────────────────────────────────────────
function tsToDate(ts: Timestamp | null | undefined): Date {
  if (!ts) return new Date();
  return ts.toDate();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatChatListTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 24) return formatTime(date);
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Main Component ─────────────────────────────────────
export default function DepartmentChatPage() {
  const { user } = useStaffAuth();
  const db = useFirestore();
  const storage = useStorage();
  const department = user?.department ?? 'CSE';

  // — State —
  const [rooms, setRooms] = useState<ChatRoomDoc[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomDoc | null>(null);
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deleteRoom' | 'clearChat' | 'deleteMessage';
    roomId: string;
    messageId?: string;
    title: string;
    description: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // — Seed default rooms on first visit —
  useEffect(() => {
    if (!db || !user) return;
    seedDefaultRooms(db, department, user.id, user.name).catch(console.error);
  }, [db, department, user]);

  // — Subscribe to rooms —
  useEffect(() => {
    if (!db || !user) return;
    setRoomsLoading(true);
    const unsub = subscribeToRooms(db, department, user.id, (data) => {
      setRooms(data);
      setRoomsLoading(false);
    });
    return unsub;
  }, [db, department, user]);

  // — Subscribe to messages for selected room —
  useEffect(() => {
    if (!db || !selectedRoom) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    const unsub = subscribeToMessages(db, selectedRoom.id, (data) => {
      setMessages(data);
      setMessagesLoading(false);
    });
    return unsub;
  }, [db, selectedRoom]);

  // — Close header menu when clicking outside —
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    if (showHeaderMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeaderMenu]);

  // — Auto-scroll on new messages —
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // — Auto-focus input —
  useEffect(() => {
    if (selectedRoom) inputRef.current?.focus();
  }, [selectedRoom]);

  // — Filtered rooms —
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    return rooms.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [rooms, searchQuery]);

  // — Send message —
  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedRoom || !user || !db || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await sendMessage(db, selectedRoom.id, {
        senderId: user.id,
        senderName: user.name,
        senderDept: department,
        text,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setInput(text); // restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, selectedRoom, user, db, department, sending]);

  // — Create new room —
  const handleCreateRoom = useCallback(async (name: string, type: 'group' | 'individual') => {
    if (!db || !user) return;
    const names: Record<string, string> = { [user.id]: user.name };
    const roomId = await createRoom(db, {
      name,
      type,
      department,
      participants: [user.id],
      participantNames: names,
      createdBy: user.id,
    });
    setShowNewChat(false);
    // Select the new room once it appears
    const newRoom: ChatRoomDoc = {
      id: roomId,
      name,
      type,
      department,
      participants: [user.id],
      participantNames: names,
      avatarColor: pickAvatarColor(name),
      createdAt: null,
      createdBy: user.id,
      lastMessage: type === 'group' ? `${user.name} created the group` : '',
      lastMessageTime: null,
      lastMessageBy: user.id,
    };
    setSelectedRoom(newRoom);
  }, [db, user, department]);

  // — Delete handlers —
  const handleDeleteMessage = useCallback((msgId: string) => {
    if (!selectedRoom) return;
    setConfirmAction({
      type: 'deleteMessage',
      roomId: selectedRoom.id,
      messageId: msgId,
      title: 'Delete Message',
      description: 'Are you sure you want to delete this message? This action cannot be undone.',
    });
  }, [selectedRoom]);

  const handleClearChat = useCallback(() => {
    if (!selectedRoom) return;
    setShowHeaderMenu(false);
    setConfirmAction({
      type: 'clearChat',
      roomId: selectedRoom.id,
      title: 'Clear Chat',
      description: `Delete all messages in "${selectedRoom.name}"? The conversation will remain but all messages will be permanently removed.`,
    });
  }, [selectedRoom]);

  const handleDeleteRoom = useCallback((roomId: string, roomName: string) => {
    setShowHeaderMenu(false);
    setConfirmAction({
      type: 'deleteRoom',
      roomId,
      title: 'Delete Conversation',
      description: `Permanently delete "${roomName}" and all its messages? This action cannot be undone.`,
    });
  }, []);

  const executeConfirmAction = useCallback(async () => {
    if (!confirmAction || !db) return;
    try {
      if (confirmAction.type === 'deleteMessage' && confirmAction.messageId) {
        await deleteMessage(db, confirmAction.roomId, confirmAction.messageId);
      } else if (confirmAction.type === 'clearChat') {
        await clearChat(db, confirmAction.roomId);
      } else if (confirmAction.type === 'deleteRoom') {
        await deleteRoom(db, confirmAction.roomId);
        if (selectedRoom?.id === confirmAction.roomId) setSelectedRoom(null);
      }
    } catch (err) {
      console.error('Delete action failed:', err);
    } finally {
      setConfirmAction(null);
    }
  }, [confirmAction, db, selectedRoom]);

  // — Emoji handler —
  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  // — File upload handler —
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom || !user || !db || !storage) return;

    // Max 25 MB
    if (file.size > 25 * 1024 * 1024) {
      alert('File size must be less than 25 MB');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      const { promise } = uploadFileMessage(
        storage,
        db,
        selectedRoom.id,
        file,
        { senderId: user.id, senderName: user.name, senderDept: department },
        (pct) => setUploadProgress(pct),
      );
      await promise;
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [selectedRoom, user, db, storage, department]);

  // — Group messages by date —
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessageDoc[] }[] = [];
    let currentDate = '';
    messages.forEach((msg) => {
      const dateStr = formatDateHeader(tsToDate(msg.createdAt));
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ date: dateStr, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [messages]);

  // Keep selected room in sync with live data
  useEffect(() => {
    if (!selectedRoom) return;
    const updated = rooms.find((r) => r.id === selectedRoom.id);
    if (updated) setSelectedRoom(updated);
  }, [rooms]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      {/* Page header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-[#1d1d1f]">Messages</h1>
          <p className="text-[15px] text-[#86868b] mt-1">{department} Department Chat</p>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          className="h-9 px-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      <div className="flex h-[calc(100vh-240px)] min-h-[500px] overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-lg">
        {/* ═══ LEFT PANEL — Conversation List ═══ */}
        <div
          className={cn(
            'w-full md:w-[340px] lg:w-[380px] md:flex flex-col border-r border-[#d2d2d7] bg-[#f5f5f7]/60',
            selectedRoom ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Sidebar header */}
          <div className="h-[56px] px-4 flex items-center justify-between border-b border-[#d2d2d7] bg-white/80 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold bg-[#0071e3]">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1d1d1f] leading-tight">{user?.name ?? 'User'}</p>
                <p className="text-[11px] text-[#86868b] leading-tight">{department}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showSearch ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'text-[#86868b] hover:bg-[#f5f5f7]'
                )}
              >
                {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="px-3 py-2.5 bg-white border-b border-[#d2d2d7]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/50 text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all"
                />
              </div>
            </div>
          )}

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 text-[#0071e3] animate-spin" />
                <p className="text-[13px] text-[#86868b]">Loading chats…</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                {searchQuery ? (
                  <>
                    <Search className="h-8 w-8 text-[#d2d2d7] mb-3" />
                    <p className="text-[14px] text-[#86868b]">No conversations match &ldquo;{searchQuery}&rdquo;</p>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-8 w-8 text-[#d2d2d7] mb-3" />
                    <p className="text-[14px] text-[#86868b]">No conversations yet</p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="mt-3 text-[13px] text-[#0071e3] font-medium hover:underline"
                    >
                      Start a new chat
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredRooms.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  isSelected={selectedRoom?.id === room.id}
                  onClick={() => setSelectedRoom(room)}
                  onDelete={() => handleDeleteRoom(room.id, room.name)}
                />
              ))
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Chat Area ═══ */}
        <div className={cn('flex-1 flex flex-col bg-white', !selectedRoom ? 'hidden md:flex' : 'flex')}>
          {selectedRoom ? (
            <>
              {/* Chat header */}
              <div className="h-[56px] px-4 flex items-center justify-between border-b border-[#d2d2d7] bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <button
                    className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#f5f5f7] transition-colors text-[#86868b]"
                    onClick={() => setSelectedRoom(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[14px] font-semibold"
                      style={{ backgroundColor: selectedRoom.avatarColor }}
                    >
                      {selectedRoom.type === 'group' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        selectedRoom.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">
                      {selectedRoom.name}
                    </p>
                    <p className="text-[12px] text-[#86868b] leading-tight">
                      {selectedRoom.type === 'group'
                        ? `${selectedRoom.participants.length} participant${selectedRoom.participants.length !== 1 ? 's' : ''}`
                        : `${department} Department`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors">
                    <Video className="h-4 w-4" />
                  </button>
                  <div className="relative" ref={headerMenuRef}>
                    <button
                      onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        showHeaderMenu ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'text-[#86868b] hover:bg-[#f5f5f7]'
                      )}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {showHeaderMenu && (
                      <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-xl border border-[#d2d2d7] shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={handleClearChat}
                          className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] flex items-center gap-2.5 transition-colors"
                        >
                          <Eraser className="h-4 w-4 text-[#86868b]" />
                          Clear Messages
                        </button>
                        <div className="h-px bg-[#d2d2d7]/50 mx-2" />
                        <button
                          onClick={() => handleDeleteRoom(selectedRoom.id, selectedRoom.name)}
                          className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-[#f5f5f7]/40">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 text-[#0071e3] animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="h-14 w-14 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center mb-4">
                      <MessageSquare className="h-7 w-7 text-[#0071e3]" />
                    </div>
                    <p className="text-[15px] font-medium text-[#1d1d1f] mb-1">No messages yet</p>
                    <p className="text-[13px] text-[#86868b]">Send the first message to start the conversation.</p>
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7]/60 text-[12px] font-medium text-[#86868b] shadow-sm">
                          {group.date}
                        </span>
                      </div>

                      {group.messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        const msgDate = tsToDate(msg.createdAt);
                        return (
                          <div
                            key={msg.id}
                            className={cn('group/msg flex mb-2 items-end', isMe ? 'justify-end' : 'justify-start')}
                          >
                            {/* Delete button — appears on hover before the bubble (for own messages) */}
                            {isMe && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-lg text-[#86868b] hover:bg-red-50 hover:text-red-500 mr-1 shrink-0"
                                title="Delete message"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Avatar for others in individual chats */}
                            {!isMe && selectedRoom.type === 'individual' && (
                              <div
                                className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold mt-auto mr-2 shrink-0"
                                style={{ backgroundColor: selectedRoom.avatarColor }}
                              >
                                {msg.senderName.charAt(0)}
                              </div>
                            )}

                            <div
                              className={cn(
                                'relative max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm',
                                isMe
                                  ? 'bg-[#0071e3] text-white rounded-br-md'
                                  : 'bg-white border border-[#d2d2d7]/40 text-[#1d1d1f] rounded-bl-md'
                              )}
                            >
                              {/* Sender name in group chats */}
                              {!isMe && selectedRoom.type === 'group' && (
                                <p
                                  className="text-[12px] font-semibold mb-0.5"
                                  style={{ color: AVATAR_COLORS[msg.senderName.length % AVATAR_COLORS.length] }}
                                >
                                  {msg.senderName}
                                </p>
                              )}

                              {/* File attachment */}
                              {msg.fileUrl && (
                                <div className="mb-1.5">
                                  {msg.fileType?.startsWith('image/') ? (
                                    /* Image preview */
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                      <img
                                        src={msg.fileUrl}
                                        alt={msg.fileName ?? 'Image'}
                                        className="max-w-[240px] max-h-[200px] rounded-lg object-cover border border-black/5"
                                      />
                                    </a>
                                  ) : (
                                    /* Generic file */
                                    <a
                                      href={msg.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        'flex items-center gap-2.5 p-2.5 rounded-xl transition-colors',
                                        isMe
                                          ? 'bg-white/15 hover:bg-white/20'
                                          : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-[#d2d2d7]/30'
                                      )}
                                    >
                                      <div className={cn(
                                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                                        isMe ? 'bg-white/20' : 'bg-[#0071e3]/10'
                                      )}>
                                        {msg.fileType?.includes('pdf') ? (
                                          <FileText className={cn('h-5 w-5', isMe ? 'text-white' : 'text-[#0071e3]')} />
                                        ) : (
                                          <FileIcon className={cn('h-5 w-5', isMe ? 'text-white' : 'text-[#0071e3]')} />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={cn(
                                          'text-[13px] font-medium truncate',
                                          isMe ? 'text-white' : 'text-[#1d1d1f]'
                                        )}>
                                          {msg.fileName ?? 'File'}
                                        </p>
                                        <p className={cn(
                                          'text-[11px]',
                                          isMe ? 'text-white/60' : 'text-[#86868b]'
                                        )}>
                                          {msg.fileSize ? (msg.fileSize < 1024 * 1024
                                            ? `${(msg.fileSize / 1024).toFixed(1)} KB`
                                            : `${(msg.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                          ) : 'File'}
                                        </p>
                                      </div>
                                      <Download className={cn(
                                        'h-4 w-4 shrink-0',
                                        isMe ? 'text-white/60' : 'text-[#86868b]'
                                      )} />
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Message text + meta */}
                              <div className="flex items-end gap-2">
                                {msg.text && (
                                  <p className={cn(
                                    'text-[14px] leading-[20px] break-words',
                                    isMe ? 'text-white' : 'text-[#1d1d1f]'
                                  )}>
                                    {msg.text}
                                  </p>
                                )}
                                <span className="flex items-center gap-0.5 shrink-0 translate-y-[1px]">
                                  <span className={cn(
                                    'text-[10px] whitespace-nowrap',
                                    isMe ? 'text-white/60' : 'text-[#86868b]'
                                  )}>
                                    {formatTime(msgDate)}
                                  </span>
                                  {isMe && (
                                    msg.status === 'read' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-white" />
                                    ) : msg.status === 'delivered' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-white/50" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-white/50" />
                                    )
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Delete button — appears on hover after the bubble (for others' messages) */}
                            {!isMe && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-lg text-[#86868b] hover:bg-red-50 hover:text-red-500 ml-1 shrink-0"
                                title="Delete message"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Upload progress bar */}
              {uploadingFile && (
                <div className="px-4 py-2 border-t border-[#d2d2d7]/50 bg-[#f5f5f7]/50">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 text-[#0071e3] animate-spin shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-[#86868b]">Uploading file…</span>
                        <span className="text-[12px] font-medium text-[#1d1d1f]">{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#d2d2d7]/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0071e3] transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Input bar */}
              <div className="relative px-4 py-3 flex items-center gap-2 border-t border-[#d2d2d7] bg-white">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv"
                  onChange={handleFileSelect}
                />

                {/* Emoji button + picker */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      showEmojiPicker
                        ? 'bg-[#0071e3]/10 text-[#0071e3]'
                        : 'text-[#86868b] hover:bg-[#f5f5f7]'
                    )}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>

                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors shrink-0 disabled:opacity-50"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                  className="flex-1 h-10 px-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/50 text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all disabled:opacity-50"
                />
                {input.trim() ? (
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="h-10 w-10 rounded-full bg-[#0071e3] hover:bg-[#0077ed] flex items-center justify-center transition-all shrink-0 shadow-sm disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 text-white" />
                    )}
                  </button>
                ) : (
                  <button className="p-2 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors shrink-0">
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f5f5f7]/30">
              <div className="h-20 w-20 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center mb-5">
                <MessageSquare className="h-10 w-10 text-[#0071e3]" />
              </div>
              <h3 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight mb-2">
                Start a Conversation
              </h3>
              <p className="text-[15px] text-[#86868b] max-w-[360px] leading-relaxed">
                Select a chat from the sidebar or create a new conversation to collaborate with your {department} department colleagues.
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-5 h-10 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Confirm Delete Dialog ═══ */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          description={confirmAction.description}
          onConfirm={executeConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* ═══ New Chat Modal ═══ */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}

// ── New Chat Modal ─────────────────────────────────────
function NewChatModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, type: 'group' | 'individual') => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'group' | 'individual'>('group');
  const [creating, setCreating] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), type);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-[#d2d2d7]/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setType('group')}
              className={cn(
                'flex-1 h-[72px] rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all',
                type === 'group'
                  ? 'border-[#0071e3] bg-[#0071e3]/5'
                  : 'border-[#d2d2d7]/50 hover:border-[#d2d2d7]'
              )}
            >
              <Users className={cn('h-5 w-5', type === 'group' ? 'text-[#0071e3]' : 'text-[#86868b]')} />
              <span className={cn('text-[13px] font-medium', type === 'group' ? 'text-[#0071e3]' : 'text-[#86868b]')}>
                Group Chat
              </span>
            </button>
            <button
              onClick={() => setType('individual')}
              className={cn(
                'flex-1 h-[72px] rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all',
                type === 'individual'
                  ? 'border-[#0071e3] bg-[#0071e3]/5'
                  : 'border-[#d2d2d7]/50 hover:border-[#d2d2d7]'
              )}
            >
              <UserPlus className={cn('h-5 w-5', type === 'individual' ? 'text-[#0071e3]' : 'text-[#86868b]')} />
              <span className={cn('text-[13px] font-medium', type === 'individual' ? 'text-[#0071e3]' : 'text-[#86868b]')}>
                Direct Message
              </span>
            </button>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#1d1d1f]">
              {type === 'group' ? 'Group Name' : 'Contact Name'}
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
              <input
                ref={nameRef}
                type="text"
                placeholder={type === 'group' ? 'e.g. Project Discussion' : 'e.g. Dr. Ramesh Kumar'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/50 text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#d2d2d7]/50 text-[14px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="flex-1 h-10 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl border border-[#d2d2d7]/50 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 text-center">
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1.5">{title}</h3>
          <p className="text-[13px] text-[#86868b] leading-relaxed">{description}</p>
        </div>
        <div className="flex border-t border-[#d2d2d7]/50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 text-[14px] font-medium text-[#0071e3] hover:bg-[#f5f5f7] transition-colors rounded-bl-2xl disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="w-px bg-[#d2d2d7]/50" />
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 text-[14px] font-semibold text-red-500 hover:bg-red-50 transition-colors rounded-br-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Room Item ──────────────────────────────────────────
function RoomItem({
  room,
  isSelected,
  onClick,
  onDelete,
}: {
  room: ChatRoomDoc;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group/room relative">
      <button
        onClick={onClick}
        className={cn(
          'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
          isSelected ? 'bg-[#0071e3]/8' : 'hover:bg-white/60'
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center text-white text-[15px] font-semibold"
            style={{ backgroundColor: room.avatarColor }}
          >
            {room.type === 'group' ? <Users className="h-5 w-5" /> : room.name.charAt(0)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-1 border-b border-[#d2d2d7]/30">
          <div className="flex items-center justify-between mb-0.5">
            <span className={cn(
              'text-[15px] truncate',
              isSelected ? 'font-semibold text-[#0071e3]' : 'font-medium text-[#1d1d1f]'
            )}>
              {room.name}
            </span>
            <span className="text-[11px] shrink-0 ml-2 font-medium text-[#86868b]">
              {formatChatListTime(room.lastMessageTime)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            {room.lastMessage ? (
              <p className="text-[13px] text-[#86868b] truncate pr-2">
                {room.type === 'group' && <span className="text-[#86868b]">~ </span>}
                {room.lastMessage}
              </p>
            ) : (
              <p className="text-[13px] text-[#86868b]/50 italic truncate">No messages yet</p>
            )}
          </div>
        </div>
      </button>

      {/* Delete button on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/room:opacity-100 transition-all p-1.5 rounded-lg bg-white/90 border border-[#d2d2d7]/50 text-[#86868b] hover:text-red-500 hover:bg-red-50 hover:border-red-200 shadow-sm z-10"
        title="Delete chat"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
