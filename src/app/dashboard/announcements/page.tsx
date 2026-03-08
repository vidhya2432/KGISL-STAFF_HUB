'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStaffAuth } from '@/lib/auth-context';
import { useFirestore } from '@/firebase';
import {
  subscribeToAnnouncements,
  postAnnouncement,
  toggleAnnouncementPin,
  type AnnouncementDoc,
} from '@/lib/announcement-service';
import { Timestamp } from 'firebase/firestore';
import {
  Megaphone,
  Plus,
  Pin,
  Clock,
  User,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'urgent' | 'important' | 'general';

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: AlertCircle },
  important: { label: 'Important', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Info },
  general: { label: 'General', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
};

function tsToDate(ts: Timestamp | null | undefined): Date {
  if (!ts) return new Date();
  return ts.toDate();
}

function formatDate(ts: Timestamp | null | undefined): string {
  const date = tsToDate(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ──────────────────────────────────────────
export default function DepartmentAnnouncementsPage() {
  const { user } = useStaffAuth();
  const db = useFirestore();
  const department = user?.department ?? 'CSE';

  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [posting, setPosting] = useState(false);

  // New announcement form state
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('general');

  // Subscribe to announcements
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsub = subscribeToAnnouncements(db, department, (data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return unsub;
  }, [db, department]);

  const sortedAnnouncements = useMemo(() => {
    let filtered = announcements;
    if (filterPriority !== 'all') {
      filtered = filtered.filter((a) => a.priority === filterPriority);
    }
    // Pinned first, then by date
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime();
    });
  }, [announcements, filterPriority]);

  const handlePost = useCallback(async () => {
    if (!newTitle.trim() || !newBody.trim() || !user || !db || posting) return;
    setPosting(true);
    try {
      await postAnnouncement(db, {
        title: newTitle.trim(),
        body: newBody.trim(),
        authorName: user.name,
        authorId: user.id,
        authorDept: department,
        department,
        priority: newPriority,
      });
      setNewTitle('');
      setNewBody('');
      setNewPriority('general');
      setShowCompose(false);
    } catch (err) {
      console.error('Failed to post announcement:', err);
    } finally {
      setPosting(false);
    }
  }, [newTitle, newBody, user, db, department, newPriority, posting]);

  const handleTogglePin = useCallback(async (id: string, currentPinned: boolean) => {
    if (!db) return;
    try {
      await toggleAnnouncementPin(db, id, !currentPinned);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  }, [db]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-[#1d1d1f]">
            Announcements
          </h1>
          <p className="text-[15px] text-[#86868b]">
            {department} Department — Official notices &amp; updates
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="apple-button-primary flex items-center gap-2 self-start"
        >
          {showCompose ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCompose ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {/* Compose form */}
      {showCompose && (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 mb-6 shadow-sm">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-4">
            Post New Announcement
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Announcement title..."
                className="w-full h-10 px-3 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-[14px] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Message</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Write your announcement..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-[14px] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="h-10 px-3 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 appearance-none pr-8"
                >
                  <option value="general">General</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                onClick={handlePost}
                disabled={!newTitle.trim() || !newBody.trim() || posting}
                className="apple-button-primary flex items-center gap-2 disabled:opacity-50"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {posting ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {(['all', 'urgent', 'important', 'general'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterPriority(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap',
              filterPriority === f
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-[#f5f5f7] text-[#1d1d1f]/70 hover:bg-[#e8e8ed]'
            )}
          >
            {f === 'all' ? 'All' : priorityConfig[f].label}
          </button>
        ))}
      </div>

      {/* Announcements list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 text-[#0071e3] animate-spin" />
            <p className="text-[13px] text-[#86868b]">Loading announcements…</p>
          </div>
        ) : sortedAnnouncements.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="h-12 w-12 text-[#86868b] mx-auto mb-3" />
            <p className="text-[15px] text-[#86868b]">No announcements found.</p>
          </div>
        ) : (
          sortedAnnouncements.map((ann) => {
            const pConfig = priorityConfig[ann.priority];
            const PriorityIcon = pConfig.icon;
            return (
              <div
                key={ann.id}
                className={cn(
                  'bg-white rounded-2xl border p-6 transition-all hover:shadow-sm',
                  ann.pinned ? 'border-[#0071e3]/30 bg-[#0071e3]/[0.02]' : 'border-[#d2d2d7]'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Priority badge + pin */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                          pConfig.bgColor,
                          pConfig.color
                        )}
                      >
                        <PriorityIcon className="h-3 w-3" />
                        {pConfig.label}
                      </span>
                      {ann.pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071e3]">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </span>
                      )}
                    </div>

                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1.5">
                      {ann.title}
                    </h3>
                    <p className="text-[14px] text-[#1d1d1f]/80 leading-relaxed mb-3">
                      {ann.body}
                    </p>

                    <div className="flex items-center gap-4 text-[12px] text-[#86868b]">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ann.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ann.createdAt as any)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTogglePin(ann.id, ann.pinned)}
                    className={cn(
                      'shrink-0 p-2 rounded-lg transition-colors',
                      ann.pinned
                        ? 'text-[#0071e3] hover:bg-[#0071e3]/10'
                        : 'text-[#86868b] hover:bg-[#f5f5f7]'
                    )}
                    title={ann.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
