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

export interface AnnouncementDoc {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorId: string;
  authorDept: string;
  priority: 'urgent' | 'important' | 'general';
  pinned: boolean;
  department: string;
  createdAt: Timestamp | null;
}

/** Real-time subscription to announcements for a department */
export function subscribeToAnnouncements(
  db: Firestore,
  department: string,
  callback: (data: AnnouncementDoc[]) => void
) {
  const q = query(
    collection(db, 'announcements'),
    where('department', '==', department),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const docs: AnnouncementDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AnnouncementDoc[];
    callback(docs);
  });
}

/** Post a new announcement */
export async function postAnnouncement(
  db: Firestore,
  data: {
    title: string;
    body: string;
    authorName: string;
    authorId: string;
    authorDept: string;
    department: string;
    priority: 'urgent' | 'important' | 'general';
  }
) {
  return addDoc(collection(db, 'announcements'), {
    ...data,
    pinned: false,
    createdAt: serverTimestamp(),
  });
}

/** Toggle pin status */
export async function toggleAnnouncementPin(db: Firestore, id: string, pinned: boolean) {
  return updateDoc(doc(db, 'announcements', id), { pinned });
}
