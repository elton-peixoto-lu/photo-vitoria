import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import PromoForm from './PromoForm';
import PromoList from './PromoList';

export default function AdminPromocoes() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  if (!user) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Acesso restrito</h2>
      <p>Faça login para acessar o painel de promoções.</p>
      <button
        className="btn btn-primary mt-4"
        onClick={async () => {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        }}
      >
        Entrar com Google
      </button>
    </div>;
  }

  return (
    <div className="ml-60 w-[calc(100vw-15rem)] min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Administração de Promoções</h1>
        <button onClick={() => signOut(auth)} className="btn btn-error">Sair</button>
      </div>
      <PromoForm user={user} />
      <PromoList user={user} />
    </div>
  );
} 
