'use client';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';

export interface NotificationDoc {
  id: string;
  title: string;
  description: string;
  read: boolean;
  userId: string;
  department: string;
  createdAt: Timestamp | null;
}

/** Real-time subscription to notifications for a user */
export function subscribeToNotifications(
  db: Firestore,
  userId: string,
  department: string,
  callback: (data: NotificationDoc[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('department', '==', department),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const docs: NotificationDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as NotificationDoc[];
    callback(docs);
  });
}

/** Mark a notification as read */
export async function markNotificationRead(db: Firestore, id: string) {
  return updateDoc(doc(db, 'notifications', id), { read: true });
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(db: Firestore, ids: string[]) {
  const promises = ids.map((id) => updateDoc(doc(db, 'notifications', id), { read: true }));
  return Promise.all(promises);
}
