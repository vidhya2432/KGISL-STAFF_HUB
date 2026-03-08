'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '@/lib/auth-context';
import { useFirestore } from '@/firebase';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationDoc,
} from '@/lib/notification-service';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Check, Loader2 } from 'lucide-react';

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const { user } = useStaffAuth();
  const db = useFirestore();
  const department = user?.department ?? 'CSE';

  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) return;
    setLoading(true);
    const unsub = subscribeToNotifications(db, user.id, department, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return unsub;
  }, [db, user, department]);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const handleMarkRead = useCallback(async (id: string) => {
    if (!db) return;
    try {
      await markNotificationRead(db, id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [db]);

  const handleMarkAllRead = useCallback(async () => {
    if (!db) return;
    const ids = unreadNotifications.map((n) => n.id);
    if (ids.length === 0) return;
    try {
      await markAllNotificationsRead(db, ids);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [db, unreadNotifications]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-6 w-6 text-[#0071e3] animate-spin" />
        <p className="text-[13px] text-[#86868b]">Loading notifications…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Notifications</h1>
          <p className="text-muted-foreground">Stay up-to-date with important alerts and reminders.</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Notifications</CardTitle>
          <CardDescription>
            You have {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary">
                <div className="flex-shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <BellRing className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)}>
                  Mark as read
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No new notifications.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Read Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {readNotifications.length > 0 ? (
            readNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <div className="flex-shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Check className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-muted-foreground">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No read notifications.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
