import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_DOMINIO.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  // ...outros campos
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
