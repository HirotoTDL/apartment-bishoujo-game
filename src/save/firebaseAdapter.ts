import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut as fbSignOut, type Auth, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { PlayerSave } from "../game/types";
import type { SaveAdapter, SignInMode } from "./adapter";
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

function friendlyError(code: string | undefined): string {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "ログインがキャンセルされました。もう一度お試しください。";
    case "auth/popup-blocked":
      return "ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。";
    case "auth/unauthorized-domain":
      return "このドメインはFirebaseで承認されていません。管理者にお知らせください。";
    case "auth/admin-restricted-operation":
      return "ゲストプレイは現在無効です。Firebase Consoleで匿名認証を有効化してください。";
    case "auth/network-request-failed":
      return "ネットワークエラーです。接続を確認してください。";
    default:
      return code ? `認証エラー: ${code}` : "認証中に未知のエラーが発生しました。";
  }
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
  async signIn(mode: SignInMode = "google"): Promise<{ uid: string; displayName: string }> {
    ensureInit();
    // Already signed in?
    const existing = await waitForUser();
    if (existing) {
      return { uid: existing.uid, displayName: existing.displayName ?? "プレイヤー" };
    }
    try {
      if (mode === "anonymous") {
        const anon = await signInAnonymously(auth!);
        return { uid: anon.user.uid, displayName: "ゲストプレイヤー" };
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);
      return { uid: result.user.uid, displayName: result.user.displayName ?? "プレイヤー" };
    } catch (e: any) {
      const code = e?.code as string | undefined;
      const err = new Error(friendlyError(code));
      (err as any).code = code;
      (err as any).original = e;
      throw err;
    }
  },
  async signOut() {
    ensureInit();
    await fbSignOut(auth!);
  },
};
