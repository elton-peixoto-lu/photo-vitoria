import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDFY2jYKb6utD9xT-T_YSMl0HMOcRydupg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'photo-vitoria.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'photo-vitoria',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'photo-vitoria.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '674468762673',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:674468762673:web:64fdbfb31fe3b485a2f110'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
