import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut as fbSignOut, type Auth, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { PlayerSave } from "../game/types";
import type { SaveAdapter } from "./adapter";
import { firebaseConfig } from "../config/firebase";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function ensureInit() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

function waitForUser(): Promise<User | null> {
  return new Promise(res => {
    ensureInit();
    const unsub = onAuthStateChanged(auth!, user => {
      unsub();
      res(user);
    });
  });
}

export const firebaseAdapter: SaveAdapter = {
  isFirebase: true,
  async load(uid: string): Promise<PlayerSave | null> {
    ensureInit();
    const ref = doc(db!, "saves", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as PlayerSave;
  },
  async save(data: PlayerSave): Promise<void> {
    ensureInit();
    const ref = doc(db!, "saves", data.uid);
    await setDoc(ref, data, { merge: false });
  },
  async signIn(): Promise<{ uid: string; displayName: string }> {
    ensureInit();
    // Already signed in?
    const existing = await waitForUser();
    if (existing) {
      return { uid: existing.uid, displayName: existing.displayName ?? "プレイヤー" };
    }
    // Try Google popup first; fall back to anonymous
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);
      return { uid: result.user.uid, displayName: result.user.displayName ?? "プレイヤー" };
    } catch {
      const anon = await signInAnonymously(auth!);
      return { uid: anon.user.uid, displayName: "ゲストプレイヤー" };
    }
  },
  async signOut() {
    ensureInit();
    await fbSignOut(auth!);
  },
};
