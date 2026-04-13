import { useEffect, useMemo, useState } from 'react';
import Keycloak from 'keycloak-js';
import { FaFolderOpen } from 'react-icons/fa';

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
  const [keycloak, setKeycloak] = useState(null);
  const [authState, setAuthState] = useState('loading');
  const [status, setStatus] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const keycloakConfig = useMemo(() => ({
    url: import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak-ff24d6d8.35-212-226-35.sslip.io',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'photo-vitoria',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'photo-vitoria-admin',
  }), []);
  const adminApiUrl = import.meta.env.VITE_ADMIN_API_URL || 'https://photo-vitoria-admin-api-rxpgnk6khq-uc.a.run.app';

  const isConfigured = Boolean(keycloakConfig.url && keycloakConfig.realm && keycloakConfig.clientId && adminApiUrl);
  const totalMb = files.reduce((total, file) => total + file.size, 0) / 1024 / 1024;

  useEffect(() => {
    if (!isConfigured) {
      setAuthState('missing-config');
      return;
    }

    const client = new Keycloak(keycloakConfig);
    let active = true;

    client
      .init({ onLoad: 'login-required', pkceMethod: 'S256', checkLoginIframe: false })
      .then((authenticated) => {
        if (!active) return;
        if (!authenticated) {
          client.login();
          return;
        }
        setKeycloak(client);
        setAuthState('authenticated');
      })
      .catch(() => {
        if (!active) return;
        setAuthState('error');
      });

    return () => {
      active = false;
    };
  }, [isConfigured, keycloakConfig]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');
    setPrUrl('');

    if (!keycloak?.token) {
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
      await keycloak.updateToken(30);

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
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({ folder, files: payloadFiles }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao criar Pull Request');

      setPrUrl(data.pullRequestUrl);
      setFiles([]);
      event.target.reset();
      setStatus('Pull Request criado. O processamento das fotos vai rodar no GitHub Actions.');
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
            Configure `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` e `VITE_ADMIN_API_URL`.
          </p>
        </div>
      </main>
    );
  }

  if (authState === 'loading') {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-gray-800">
        <div className="mx-auto max-w-3xl">Carregando login...</div>
      </main>
    );
  }

  if (authState === 'error') {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-gray-800">
        <div className="mx-auto max-w-3xl">Nao foi possivel iniciar o login.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-800">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-pink-600">Admin de fotos</h1>
            <p className="mt-2 text-sm text-gray-600">Envie fotos e acompanhe o Pull Request criado automaticamente.</p>
          </div>
          <button
            type="button"
            onClick={() => keycloak?.logout()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Sair
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-md border border-gray-200 p-5 shadow-sm">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FaFolderOpen className="text-pink-500" />
              Galeria
            </label>
            <select
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-pink-500 focus:outline-none"
            >
              {FOLDERS.map((item) => (
                <option key={item.value} value={item.value}>{`📁 ${item.label}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Fotos</label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.avif,.tif,.tiff,image/jpeg,image/png,image/webp,image/avif,image/tiff"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="w-full rounded-md border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-pink-500 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
            <p className="mt-2 text-xs text-gray-500">Limite atual: 20 fotos e 10MB por envio.</p>
          </div>

          {files.length > 0 && (
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-semibold">{files.length} foto(s), {totalMb.toFixed(2)}MB no total</p>
              <ul className="mt-2 space-y-1">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? 'Enviando...' : 'Criar Pull Request'}
          </button>
        </form>

        {status && (
          <p className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">{status}</p>
        )}

        {prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-md bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-700"
          >
            Abrir Pull Request
          </a>
        )}
      </section>
    </main>
  );
}
