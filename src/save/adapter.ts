import type { PlayerSave } from "../game/types";
import { localAdapter } from "./localAdapter";
import { firebaseAdapter } from "./firebaseAdapter";
import { firebaseConfig } from "../config/firebase";

export type SignInMode = "google" | "anonymous";

export interface SaveAdapter {
  load(uid: string): Promise<PlayerSave | null>;
  save(data: PlayerSave): Promise<void>;
  signIn(mode?: SignInMode): Promise<{ uid: string; displayName: string }>;
  signOut(): Promise<void>;
  isFirebase: boolean;
}

// Pick adapter based on configuration. If Firebase config has empty apiKey,
// fall back to local storage (useful for first-run dev).
const useFirebase = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "REPLACE_ME";

export const saveAdapter: SaveAdapter = useFirebase ? firebaseAdapter : localAdapter;
