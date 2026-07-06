import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ---------- User profile ----------
export async function upsertUserProfile(profile) {
  const id = profile.id || profile.email;
  await setDoc(doc(db, 'userProfiles', id), profile, { merge: true });
  return profile;
}

export async function getUserProfileByEmail(email) {
  const snap = await getDoc(doc(db, 'userProfiles', email));
  return snap.exists() ? snap.data() : null;
}

// ---------- Literacy progress ----------
export async function getLiteracyProgress(userId) {
  const snap = await getDoc(doc(db, 'lessonCompletions', userId));
  return snap.exists() ? snap.data() : { userId, lessons: {} };
}

export async function upsertLiteracyProgress(userId, lessons) {
  await setDoc(doc(db, 'lessonCompletions', userId), { id: userId, userId, lessons });
}

// ---------- Income entries ----------
export async function getIncomeEntries(userId) {
  const snap = await getDocs(query(collection(db, 'incomeEntries'), where('userId', '==', userId)));
  return snap.docs.map(d => d.data());
}

export async function addIncomeEntry(entry) {
  await setDoc(doc(db, 'incomeEntries', entry.id), entry);
  return entry;
}

export async function updateIncomeEntry(id, entry) {
  await setDoc(doc(db, 'incomeEntries', id), entry);
  return entry;
}

export async function deleteIncomeEntry(id) {
  await deleteDoc(doc(db, 'incomeEntries', id));
}

// ---------- Spending entries ----------
export async function getSpendingEntries(userId) {
  const snap = await getDocs(query(
    collection(db, 'spendingEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  ));
  return snap.docs.map(d => d.data());
}

export async function addSpendingEntry(entry) {
  await setDoc(doc(db, 'spendingEntries', entry.id), entry);
  return entry;
}

export async function updateSpendingEntry(id, entry) {
  await setDoc(doc(db, 'spendingEntries', id), entry);
  return entry;
}

export async function deleteSpendingEntry(id) {
  await deleteDoc(doc(db, 'spendingEntries', id));
}

// ---------- Savings goals ----------
export async function getSavingsGoals(userId) {
  const snap = await getDocs(query(collection(db, 'savingsGoals'), where('userId', '==', userId)));
  return snap.docs.map(d => d.data());
}

export async function addSavingsGoal(goal) {
  await setDoc(doc(db, 'savingsGoals', goal.id), goal);
  return goal;
}

export async function updateSavingsGoal(id, goal) {
  await setDoc(doc(db, 'savingsGoals', id), goal);
  return goal;
}

export async function deleteSavingsGoal(id) {
  await deleteDoc(doc(db, 'savingsGoals', id));
}

// ---------- Community threads & replies ----------
// Replies live in a `replies` subcollection (not an array field) so Firestore
// security rules can enforce per-reply ownership directly.
export async function getCommunityThreads() {
  const snap = await getDocs(collection(db, 'communityThreads'));
  return Promise.all(snap.docs.map(async (d) => {
    const thread = d.data();
    const repliesSnap = await getDocs(
      query(collection(db, 'communityThreads', d.id, 'replies'), orderBy('createdAt', 'asc'))
    );
    return {
      ...thread,
      replies: repliesSnap.docs.map(r => r.data()),
      createdBy: thread.userId ? `Created by: ${thread.userId}` : 'Created by: Unknown',
    };
  }));
}

export async function createThread(thread) {
  const id = thread.id || randomId();
  const toStore = {
    ...thread,
    id,
    createdAt: thread.createdAt || new Date().toISOString(),
  };
  delete toStore.replies;
  await setDoc(doc(db, 'communityThreads', id), toStore);
  return { ...toStore, replies: [] };
}

export async function updateThread({ id, userId, title, body }) {
  const ref = doc(db, 'communityThreads', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Thread not found');
  if (snap.data().userId !== userId) throw new Error('Not authorized to edit this thread');
  await updateDoc(ref, { title, body });
  return { ...snap.data(), title, body };
}

export async function deleteThread(id, userId) {
  const ref = doc(db, 'communityThreads', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (snap.data().userId !== userId) throw new Error('Not authorized to delete this thread');
  await deleteDoc(ref);
}

export async function addReply({ threadId, userId, body }) {
  const replyId = randomId();
  const reply = { replyId, userId, body, createdAt: new Date().toISOString() };
  await setDoc(doc(db, 'communityThreads', threadId, 'replies', replyId), reply);
  return reply;
}

export async function editReply({ threadId, replyId, userId, body }) {
  const ref = doc(db, 'communityThreads', threadId, 'replies', replyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Reply not found');
  if (snap.data().userId !== userId) throw new Error('Not authorized to edit this reply');
  const editedAt = new Date().toISOString();
  await updateDoc(ref, { body, editedAt });
  return { reply: { ...snap.data(), body, editedAt } };
}

export async function deleteReply({ threadId, replyId, userId }) {
  const ref = doc(db, 'communityThreads', threadId, 'replies', replyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (snap.data().userId !== userId) throw new Error('Not authorized to delete this reply');
  await deleteDoc(ref);
}
