// In-app notifications (no server needed). Written by admins/teachers, read by the student.
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch, type Firestore, type WriteBatch } from "firebase/firestore";

export type Msg = { en: string; bn: string };

export function addNotification(db: Firestore, b: WriteBatch, userId: string, title: Msg) {
  b.set(doc(collection(db, "notifications")), { userId, title, read: false, createdAt: serverTimestamp() });
}

// Notify every active student of a course. Failures are reported to the caller, never silent.
export async function notifyCourse(db: Firestore, courseId: string, title: Msg) {
  const en = await getDocs(query(collection(db, "enrollments"), where("courseId", "==", courseId), where("status", "==", "active")));
  const ids = Array.from(new Set(en.docs.map((d) => d.data().userId as string)));
  for (let i = 0; i < ids.length; i += 400) {
    const b = writeBatch(db);
    ids.slice(i, i + 400).forEach((u) => addNotification(db, b, u, title));
    await b.commit();
  }
  return ids.length;
}
