import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIza...",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "photo-vitoria.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "photo-vitoria",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "photo-vitoria.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
