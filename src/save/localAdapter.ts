import type { PlayerSave } from "../game/types";
import type { SaveAdapter } from "./adapter";

const KEY = "apartment_bishoujo_save_v1";
const UID_KEY = "apartment_bishoujo_uid";

function getOrMakeUid(): { uid: string; displayName: string } {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = "local_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem(UID_KEY, uid);
  }
  return { uid, displayName: "ローカルプレイヤー" };
}

export const localAdapter: SaveAdapter = {
  isFirebase: false,
  async load(uid: string): Promise<PlayerSave | null> {
    const raw = localStorage.getItem(`${KEY}_${uid}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlayerSave;
    } catch {
      return null;
    }
  },
  async save(data: PlayerSave): Promise<void> {
    localStorage.setItem(`${KEY}_${data.uid}`, JSON.stringify(data));
  },
  async signIn() {
    return getOrMakeUid();
  },
  async signOut() {
    // Keep data, just remove uid pointer
  },
};
