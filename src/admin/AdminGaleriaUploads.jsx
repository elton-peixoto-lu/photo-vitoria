import { useEffect, useMemo, useRef, useState } from 'react';
import { FaFolderOpen } from 'react-icons/fa';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const FOLDERS = [
  { value: 'casamentos', label: 'Casamentos' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'femininos', label: 'Femininos' },
  { value: 'pre-weding', label: 'Pre-Weding' },
  { value: 'noivas', label: 'Noivas' },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AdminGaleriaUploads() {
  const [folder, setFolder] = useState('casamentos');
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  const adminApiUrl = import.meta.env.VITE_ADMIN_API_URL || 'https://photo-vitoria-admin-api-rxpgnk6khq-uc.a.run.app';
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const isConfigured = useMemo(() => {
    return Boolean(
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID &&
      adminApiUrl &&
      turnstileSiteKey
    );
  }, [adminApiUrl, turnstileSiteKey]);

  const totalMb = files.reduce((total, file) => total + file.size, 0) / 1024 / 1024;

  useEffect(() => {
    if (!isConfigured) {
      setAuthState('missing-config');
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthState('ready');
    });

    return () => unsub();
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured || user) return;

    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId);

    function renderWidget() {
      if (!window.turnstile || !turnstileRef.current || turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        theme: 'light',
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken('')
      });
    }

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }
  }, [isConfigured, turnstileSiteKey, user]);

  async function verifyTurnstileToken(token) {
    const response = await fetch(`${adminApiUrl}/api/admin/turnstile-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!response.ok) {
      throw new Error('Falha na validacao de seguranca.');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus('');

    if (!turnstileToken) {
      setStatus('Complete o desafio de seguranca para entrar.');
      return;
    }

    setLoginLoading(true);
    try {
      await verifyTurnstileToken(turnstileToken);
      await signInWithEmailAndPassword(auth, email, password);
      setStatus('');
    } catch (error) {
      setStatus(error?.message || 'Falha no login.');
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setTurnstileToken('');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');
    setPrUrl('');

    if (!user) {
      setStatus('Sessao expirada. Entre novamente.');
      return;
    }

    if (files.length === 0) {
      setStatus('Selecione pelo menos uma foto.');
      return;
    }

    if (totalMb > 10) {
      setStatus('Envie ate 10MB por lote.');
      return;
    }

    setSubmitting(true);

    try {
      const idToken = await user.getIdToken(true);

      const payloadFiles = await Promise.all(files.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        contentBase64: await fileToBase64(file),
      })));

      const response = await fetch(`${adminApiUrl}/api/admin/gallery-pr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ folder, files: payloadFiles }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao enviar fotos');

      setPrUrl(data.pullRequestUrl);
      setFiles([]);
      event.target.reset();
      setStatus('Envio concluido! As fotos agora entram em processamento automatico e aparecem no site em seguida.');
    } catch (error) {
      setStatus(error?.message || 'Erro ao enviar fotos.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authState === 'missing-config') {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-gray-800">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-pink-600">Admin de fotos</h1>
          <p className="mt-4 text-sm">
            Configure `VITE_FIREBASE_*`, `VITE_TURNSTILE_SITE_KEY` e `VITE_ADMIN_API_URL`.
          </p>
        </div>
      </main>
    );
  }

  if (authState === 'loading') {
    return <main className="min-h-screen bg-white px-6 py-10 text-gray-800"><div className="mx-auto max-w-3xl">Carregando...</div></main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-light tracking-[0.2em] text-gray-900 uppercase mb-3">Photo Vitoria</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400">Portal Administrativo</p>
          </div>
          <div className="bg-white border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {status && <p className="text-xs text-red-600">{status}</p>}
              <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b border-gray-200 py-3 text-sm outline-none" />
              <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-gray-200 py-3 text-sm outline-none" />
              <div className="flex justify-center"><div ref={turnstileRef} /></div>
              <button type="submit" disabled={loginLoading} className="w-full bg-gray-900 text-white py-4 text-xs uppercase tracking-[0.4em] disabled:bg-gray-400">
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-800">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-pink-600">Admin de fotos</h1>
            <p className="mt-2 text-sm text-gray-600">Envie fotos para a galeria. O sistema processa tudo automaticamente.</p>
          </div>
          <button type="button" onClick={() => signOut(auth)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Sair</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-md border border-gray-200 p-5 shadow-sm">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><FaFolderOpen className="text-pink-500" />Galeria</label>
            <select value={folder} onChange={(event) => setFolder(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-pink-500 focus:outline-none">
              {FOLDERS.map((item) => <option key={item.value} value={item.value}>{`📁 ${item.label}`}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Fotos</label>
            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif,.tif,.tiff,image/jpeg,image/png,image/webp,image/avif,image/tiff" onChange={(event) => setFiles(Array.from(event.target.files || []))} className="w-full rounded-md border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-pink-500 file:px-4 file:py-2 file:font-semibold file:text-white" />
            <p className="mt-2 text-xs text-gray-500">Limite atual: 20 fotos e 10MB por envio.</p>
          </div>

          {files.length > 0 && <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700"><p className="font-semibold">{files.length} foto(s), {totalMb.toFixed(2)}MB no total</p></div>}

          <button type="submit" disabled={submitting} className="w-full rounded-md bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-gray-300">{submitting ? 'Enviando...' : 'Enviar fotos para galeria'}</button>
        </form>

        {status && <p className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">{status}</p>}
        {prUrl && <a href={prUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-md bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-700">Ver detalhes tecnicos do envio</a>}
      </section>
    </main>
  );
}
