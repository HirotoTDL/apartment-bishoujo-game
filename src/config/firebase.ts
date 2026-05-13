// Firebase configuration.
// To enable cloud save: replace these placeholders with your project's web app config
// from https://console.firebase.google.com/project/_/settings/general
//
// Until you replace `apiKey`, the game falls back to localStorage-only saves.
// You can also override via env variables (Vite-style):
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
//
// On GitHub Pages deploy, set repository "Pages" environment variables in the
// repo settings (Settings -> Secrets and variables -> Actions) and rebuild.

const env = (import.meta as any).env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "REPLACE_ME",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "your-project.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "your-project",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "your-project.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  appId: env.VITE_FIREBASE_APP_ID ?? "0:0:web:0",
};
