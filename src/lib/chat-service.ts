'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Firestore,
  getDocs,
  limit,
  writeBatch,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import type { Department } from './departments';

// ── Firestore document shapes ──────────────────────────
export interface ChatRoomDoc {
  id: string;
  name: string;
  type: 'group' | 'individual';
  department: Department;
  participants: string[]; // user IDs
  participantNames: Record<string, string>; // id → display name
  avatarColor: string;
  createdAt: Timestamp | null;
  createdBy: string;
  lastMessage?: string;
  lastMessageTime?: Timestamp | null;
  lastMessageBy?: string;
}

export interface ChatMessageDoc {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderDept: Department;
  text: string;
  createdAt: Timestamp | null;
  status: 'sent' | 'delivered' | 'read';
  // File attachment (optional)
  fileUrl?: string;
  fileName?: string;
  fileType?: string; // MIME type
  fileSize?: number; // bytes
}

// ── Avatar colour pool ─────────────────────────────────
const AVATAR_COLORS = [
  '#5856d6', '#ff2d55', '#ff9500', '#34c759',
  '#af52de', '#00c7be', '#0071e3', '#ff6482',
];

export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Subscribe to rooms for a department ────────────────
export function subscribeToRooms(
  db: Firestore,
  department: Department,
  userId: string,
  callback: (rooms: ChatRoomDoc[]) => void,
) {
  const q = query(
    collection(db, 'chatRooms'),
    where('department', '==', department),
    orderBy('lastMessageTime', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as ChatRoomDoc)
      .filter((r) => r.participants.includes(userId) || r.type === 'group');
    callback(rooms);
  });
}

// ── Subscribe to messages in a room ────────────────────
export function subscribeToMessages(
  db: Firestore,
  roomId: string,
  callback: (msgs: ChatMessageDoc[]) => void,
) {
  const q = query(
    collection(db, 'chatRooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessageDoc);
    callback(msgs);
  });
}

// ── Send a message ─────────────────────────────────────
export async function sendMessage(
  db: Firestore,
  roomId: string,
  msg: {
    senderId: string;
    senderName: string;
    senderDept: Department;
    text: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  },
) {
  const msgRef = collection(db, 'chatRooms', roomId, 'messages');

  // Build document data
  const data: Record<string, unknown> = {
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderDept: msg.senderDept,
    text: msg.text,
    createdAt: serverTimestamp(),
    status: 'sent',
  };
  if (msg.fileUrl) {
    data.fileUrl = msg.fileUrl;
    data.fileName = msg.fileName;
    data.fileType = msg.fileType;
    data.fileSize = msg.fileSize;
  }

  await addDoc(msgRef, data);

  // Update the room's last message preview
  const roomRef = doc(db, 'chatRooms', roomId);
  const preview = msg.fileUrl ? `📎 ${msg.fileName ?? 'File'}` : msg.text;
  await updateDoc(roomRef, {
    lastMessage: preview,
    lastMessageTime: serverTimestamp(),
    lastMessageBy: msg.senderId,
  });
}

// ── Upload a file and send as a message ────────────────
export function uploadFileMessage(
  storage: FirebaseStorage,
  db: Firestore,
  roomId: string,
  file: File,
  sender: {
    senderId: string;
    senderName: string;
    senderDept: Department;
  },
  onProgress?: (percent: number) => void,
): { promise: Promise<void>; cancel: () => void } {
  const path = `chatFiles/${roomId}/${Date.now()}_${file.name}`;
  const fileRef = storageRef(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    uploadTask.cancel();
  };

  const promise = new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      (err) => {
        if (cancelled) return resolve();
        reject(err);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage(db, roomId, {
            ...sender,
            text: '',
            fileUrl: url,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      },
    );
  });

  return { promise, cancel };
}

// ── Create a new chat room ─────────────────────────────
export async function createRoom(
  db: Firestore,
  room: {
    name: string;
    type: 'group' | 'individual';
    department: Department;
    participants: string[];
    participantNames: Record<string, string>;
    createdBy: string;
  },
): Promise<string> {
  const ref = await addDoc(collection(db, 'chatRooms'), {
    ...room,
    avatarColor: pickAvatarColor(room.name),
    createdAt: serverTimestamp(),
    lastMessage: room.type === 'group'
      ? `${room.participantNames[room.createdBy] ?? 'Someone'} created the group`
      : '',
    lastMessageTime: serverTimestamp(),
    lastMessageBy: room.createdBy,
  });
  return ref.id;
}

// ── Delete a single message ────────────────────────────
export async function deleteMessage(db: Firestore, roomId: string, messageId: string) {
  await deleteDoc(doc(db, 'chatRooms', roomId, 'messages', messageId));
}

// ── Clear all messages in a room (keep the room) ───────
export async function clearChat(db: Firestore, roomId: string) {
  const msgsSnap = await getDocs(
    query(collection(db, 'chatRooms', roomId, 'messages'), limit(500)),
  );
  const batch = writeBatch(db);
  msgsSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  // Reset room preview
  const roomRef = doc(db, 'chatRooms', roomId);
  await updateDoc(roomRef, {
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    lastMessageBy: '',
  });
}

// ── Delete a room ──────────────────────────────────────
export async function deleteRoom(db: Firestore, roomId: string) {
  // Delete all messages first
  const msgsSnap = await getDocs(
    query(collection(db, 'chatRooms', roomId, 'messages'), limit(500)),
  );
  const batch = writeBatch(db);
  msgsSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await deleteDoc(doc(db, 'chatRooms', roomId));
}

// ── Seed default rooms for a department (one-time) ─────
export async function seedDefaultRooms(
  db: Firestore,
  department: Department,
  userId: string,
  userName: string,
) {
  // Check if rooms already exist for this department
  const existing = await getDocs(
    query(
      collection(db, 'chatRooms'),
      where('department', '==', department),
      limit(1),
    ),
  );
  if (!existing.empty) return; // already seeded

  const names: Record<string, string> = { [userId]: userName };

  await createRoom(db, {
    name: `${department} Department`,
    type: 'group',
    department,
    participants: [userId],
    participantNames: names,
    createdBy: userId,
  });

  await createRoom(db, {
    name: `${department} HOD Updates`,
    type: 'group',
    department,
    participants: [userId],
    participantNames: names,
    createdBy: userId,
  });
}
