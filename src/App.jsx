import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import Contato from './pages/Contato';
import Estudio from './pages/Estudio';
import Agendamento from './pages/Agendamento';
import AdminPromocoes from './admin/AdminPromocoes';
import AdminGaleriaUploads from './admin/AdminGaleriaUploads';
import Home from './pages/Home';
import GaleriaCloudinary from './components/GaleriaCloudinary';
import Galeria from './pages/Galeria';
import Obrigado from './pages/Obrigado';
import Lgpd from './pages/Lgpd';
import {
  FaInstagram,
  FaBars,
  FaTimes,
  FaArrowLeft,
  FaWhatsapp,
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
  FaEnvelope,
} from 'react-icons/fa';
import { PiImagesLight, PiBabyLight, PiHeartLight, PiFlowerLotusLight, PiCameraLight, PiCrownLight, PiEnvelopeSimpleLight, PiHouseLight, PiCalendarLight } from 'react-icons/pi';
import { CONTATO } from './components/ContatoInfo';
import { BRAND_ICON_URL, LOGO_URL } from './constants';
import CookieBanner from './components/CookieBanner';
import SystemMonitor from './components/SystemMonitor';
import { loadGalleryImages } from './localAssetsLoader';
import { ConfigProvider, ConfigStatus } from './components/ConfigProvider';
import { SidebarProvider, useSidebar } from './context/SidebarContext';

const TURNSTILE_VERIFY_TIMEOUT_MS = 12000;
const TURNSTILE_RENDER_TIMEOUT_MS = 10000;
const PROD_ADMIN_API_URL = 'https://photo-vitoria-admin-api-rxpgnk6khq-uc.a.run.app';
const PUBLIC_TURNSTILE_SITE_KEY = '0x4AAAAAADJksWK2ejJKf8NL';

// Importa utilitários de teste em desenvolvimento
if (import.meta.env.DEV) {
  import('./utils/testHybridSystem.js').then(() => {
    console.log('🧪 Utilitários de teste carregados - veja console para comandos disponíveis');
  });
  import('./utils/testWhatsApp.js').then(() => {
    console.log('📱 Utilitários do WhatsApp carregados - digite testWhatsApp() no console');
  });
}

const MENU = [
  { label: 'Home', path: '/', icon: <PiHouseLight size={20} /> },
  { label: 'Galeria', path: '/galeria', icon: <PiImagesLight size={22} /> },
  { label: 'Infantil', path: '/galeria-infantil', icon: <PiBabyLight size={20} /> },
  { label: 'Casamentos', path: '/galeria-casamentos', icon: <PiHeartLight size={20} /> },
  { label: 'Femininos', path: '/galeria-femininos', icon: <PiFlowerLotusLight size={20} /> },
  { label: 'Pre-Weding', path: '/galeria-pre-weding', icon: <PiCameraLight size={20} /> },
  { label: 'Noivas', path: '/galeria-noivas', icon: <PiCrownLight size={22} /> },
  { label: 'Estúdio', path: '/estudio', icon: <PiCameraLight size={20} /> },
  { label: 'Agendar', path: '/agendar', icon: <PiCalendarLight size={20} /> },
  { label: 'Contato', path: '/contato', icon: <PiEnvelopeSimpleLight size={20} /> },
];

const MENU_TITLES = {
  '/': {
    title: 'Home',
    subtitle: 'Bem-vindo ao portfólio de Vitoria! Aqui você encontra ensaios, eventos e muito mais.'
  },
  '/gestante': {
    title: 'ENSAIO GESTANTE',
    subtitle: 'Book de Gestantes em Estúdio e Externo',
  },
  '/newborn': {
    title: 'ENSAIO NEWBORN',
    subtitle: 'Os primeiros dias do seu bebê registrados com amor',
  },
  '/bebe': {
    title: 'BEBÊS',
    subtitle: 'Mês a mês e smash the cake',
  },
  '/familia': {
    title: 'ENSAIO DE FAMÍLIA',
    subtitle: 'Momentos especiais com quem você ama',
  },
  '/eventos': {
    title: 'EVENTOS',
    subtitle: 'Registros de celebrações e conquistas',
  },
  '/corporativo': {
    title: 'ENSAIO CORPORATIVO',
    subtitle: 'Imagens profissionais para sua carreira ou empresa',
  },
  '/estudio': {
    title: 'ESTÚDIO',
    subtitle: 'Retratos e ensaios em ambiente controlado',
  },
  '/contato': {
    title: 'CONTATO',
    subtitle: 'Entre em contato para agendar seu ensaio ou tirar dúvidas!',
  },
};

// Preload das galerias usando sistema híbrido
function preloadGaleria(pasta) {
  // Executa preload de forma assíncrona usando o sistema híbrido
  loadGalleryImages(pasta).catch(error => {
    console.warn(`Erro no preload da galeria ${pasta}:`, error);
  });
}

function Logo({ collapsed = false, mobile = false }) {
  const useIconMark = collapsed || mobile;
  const imageSrc = useIconMark ? BRAND_ICON_URL : LOGO_URL;
  const imageAlt = useIconMark ? 'Monograma Fotos da Vitória' : 'Logo Fotos da Vitória';
  const wrapperClassName = collapsed
    ? 'w-10 h-10'
    : mobile
      ? 'w-[56px] h-[56px]'
      : 'w-[138px] h-[44px]';

  const shellClassName = collapsed
    ? 'rounded-2xl border border-white/55 bg-white/24 p-2 shadow-[0_12px_28px_-18px_rgba(157,23,77,0.55)] backdrop-blur-xl'
    : mobile
      ? 'rounded-[22px] border border-white/60 bg-white/30 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_14px_32px_-20px_rgba(157,23,77,0.55)] backdrop-blur-xl'
      : 'rounded-[24px] border border-white/60 bg-white/36 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_40px_-24px_rgba(157,23,77,0.45)] backdrop-blur-xl';

  return (
    <div className={`flex flex-col items-center select-none ${mobile ? 'mb-8 mt-4' : 'mb-10 mt-6'}`}>
      <div className={shellClassName}>
        <div className={`${wrapperClassName} flex items-center justify-center overflow-visible`}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className="max-h-full w-full object-contain drop-shadow transition-all duration-300"
        />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ mobile = false, open = false, onClose }) {
  const location = useLocation();
  const MOBILE_MENU_PATHS = [
    '/',
    '/galeria',
    '/galeria-infantil',
    '/galeria-casamentos',
    '/galeria-femininos',
    '/galeria-pre-weding',
    '/galeria-noivas',
    '/estudio',
    '/agendar',
    '/contato',
  ];
  if (mobile) {
    return (
      <>
        {open && (
          <>
            {/* Botões de ação fixos no topo */}
            <div className="fixed top-3 left-3 z-[110] flex gap-2 items-center">
              {/* Seta de voltar */}
              <button
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/55 bg-white/28 text-3xl text-[#c92f74] shadow-[0_18px_40px_-20px_rgba(157,23,77,0.95)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/36 focus:outline-none"
                onClick={onClose}
                aria-label="Voltar"
                tabIndex={open ? 0 : -1}
              >
                <FaArrowLeft />
              </button>
              {/* Botão coração (exemplo) */}
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/22 text-2xl text-[#c65d93] shadow-[0_18px_35px_-22px_rgba(157,23,77,0.9)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/32">
                <FaHeart />
              </a>
              {/* Botão WhatsApp */}
              <a href={CONTATO.whatsapp.url} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/22 text-2xl text-emerald-500 shadow-[0_18px_35px_-22px_rgba(34,197,94,0.55)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/32">
                <FaWhatsapp />
              </a>
              {/* Botão Instagram */}
              <a href={CONTATO.instagram.url} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/22 text-2xl text-[#d43b84] shadow-[0_18px_35px_-22px_rgba(212,59,132,0.8)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/32">
                <FaInstagram />
              </a>
              {/* Botão Email */}
              <a href={CONTATO.email.url} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/22 text-2xl text-sky-400 shadow-[0_18px_35px_-22px_rgba(56,189,248,0.75)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/32">
                <FaEnvelope />
              </a>
            </div>
            <div
              className="fixed inset-0 z-[99] bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.24),transparent_35%),linear-gradient(180deg,rgba(10,10,10,0.24),rgba(10,10,10,0.5))] backdrop-blur-[2px] transition-opacity duration-300 opacity-100 pointer-events-auto"
              onClick={onClose}
              aria-label="Fechar menu"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: open ? 0 : -260 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="fixed left-0 top-0 z-[100] h-screen flex flex-col border-r border-white/40 bg-[linear-gradient(180deg,rgba(255,250,252,0.78)_0%,rgba(253,239,245,0.68)_48%,rgba(255,245,232,0.62)_100%)] px-3 py-4 text-gray-700 shadow-[0_30px_80px_-32px_rgba(88,28,60,0.95)] backdrop-blur-2xl"
              style={{ width: 120 }}
            >
              <div className="mt-20" /> {/* Espaço para os botões fixos */}
              <div className="mx-auto mb-3 rounded-[28px] border border-white/65 bg-white/38 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_12px_30px_-18px_rgba(157,23,77,0.5)]">
                <Logo mobile />
              </div>
              <nav className="mt-2 flex flex-1 flex-col items-center gap-2">
                {MENU.filter(item => MOBILE_MENU_PATHS.includes(item.path)).map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-center rounded-[20px] transition-all duration-300
                      ${location.pathname === item.path
                        ? 'h-14 w-14 border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(251,207,232,0.62),rgba(224,231,255,0.5))] text-[#a21caf] shadow-[0_18px_40px_-18px_rgba(157,23,77,0.72)] scale-105'
                        : 'h-12 w-12 border border-white/20 bg-white/10 text-[#9b7a8f] hover:border-white/45 hover:bg-white/24 hover:text-[#b43c75]'}
                    `}
                    style={{ fontSize: location.pathname === item.path ? 29 : 26 }}
                    onClick={onClose}
                    title={item.label || 'Menu'}
                    tabIndex={open ? 0 : -1}
                  >
                    {item.icon}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </>
    );
  }
  // Desktop - Sidebar colapsável
  const { isOpen, sidebarWidth } = useSidebar();
  
  return (
    <motion.aside
      initial={{ opacity: 0, x: -40 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        width: sidebarWidth 
      }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
      className="bg-[linear-gradient(180deg,rgba(255,251,253,0.94)_0%,rgba(253,239,245,0.88)_48%,rgba(255,247,237,0.84)_100%)] text-gray-700 h-screen fixed left-0 top-0 flex flex-col py-4 shadow-[0_30px_80px_-32px_rgba(88,28,60,0.95)] border-r border-white/55 z-40 hidden md:flex overflow-hidden backdrop-blur-xl"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className={`px-2 ${!isOpen ? 'flex justify-center' : ''}`}>
        <Logo collapsed={!isOpen} />
      </div>
      
      <nav className={`flex-1 flex flex-col mt-4 overflow-y-auto overflow-x-hidden ${!isOpen ? 'items-center gap-1 px-1' : 'gap-0 px-0'}`}>
        {MENU.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center transition-all duration-300 ${
                !isOpen ? 'justify-center w-11 h-11 mx-auto rounded-xl' : 'py-2.5 pl-5 pr-3'
              } ${
                isActive
                  ? !isOpen
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-pink-600'
                  : !isOpen
                    ? 'text-gray-400 hover:bg-pink-50/60 hover:text-pink-500'
                    : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{
                borderLeft: isOpen ? (isActive ? '2px solid #db2777' : '2px solid transparent') : undefined,
              }}
              onMouseEnter={() => {
                if (item.path.startsWith('/galeria-')) {
                  preloadGaleria(item.path.replace('/galeria-', ''));
                }
              }}
              title={item.label || 'Menu'}
            >
              {/* Icon */}
              <span
                className={`flex-shrink-0 transition-all duration-300 ${
                  !isOpen ? 'text-[1.3rem]' : 'text-[1.05rem]'
                } ${
                  isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                }`}
              >
                {item.icon}
              </span>
              {/* Label — only when expanded */}
              {isOpen && (
                <span
                  className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.72rem',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Bottom CTAs */}
      {isOpen ? (
        <div className="flex flex-col px-5 pb-6 pt-4 border-t border-pink-100/60" style={{ gap: '0.6rem' }}>
          <a
            href={CONTATO.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 rounded-lg border border-pink-200 py-2.5 text-pink-500 hover:border-pink-400 hover:text-pink-600 transition-all duration-300"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <FaInstagram size={14} className="opacity-80 group-hover:opacity-100 transition" />
            Instagram
          </a>
          <a
            href={CONTATO.whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 rounded-lg border border-green-200 py-2.5 text-green-600 hover:border-green-400 hover:text-green-700 transition-all duration-300"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <FaWhatsapp size={14} className="opacity-80 group-hover:opacity-100 transition" />
            WhatsApp
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 pb-5 pt-3 border-t border-pink-100/60">
          <a
            href={CONTATO.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-pink-200 text-pink-400 hover:border-pink-400 hover:text-pink-600 transition-all duration-300"
            title="Instagram"
          >
            <FaInstagram size={15} />
          </a>
          <a
            href={CONTATO.whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-500 hover:border-green-400 hover:text-green-700 transition-all duration-300"
            title="WhatsApp"
          >
            <FaWhatsapp size={15} />
          </a>
        </div>
      )}
    </motion.aside>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setShowInstall(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <SidebarProvider>
      <ConfigProvider>
          <BrowserRouter>
            <GlobalTurnstileMonitor />
            <RouteSecurityGate>
            <AppContent 
              menuOpen={menuOpen} 
              setMenuOpen={setMenuOpen} 
              showInstall={showInstall}
              handleInstallClick={handleInstallClick}
            />
            </RouteSecurityGate>
          </BrowserRouter>
      </ConfigProvider>
    </SidebarProvider>
  );
}

function GlobalTurnstileMonitor() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const siteKey =
    import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY ||
    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
    PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (typeof window === 'undefined' || isLocalHost || !siteKey) return;

    const scriptId = 'cf-turnstile-global-visible-script';
    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (value) => {
          setToken(value);
          setMessage('');
        },
        'error-callback': () => {
          setMessage('Nao foi possivel validar agora, mas voce pode continuar navegando.');
        },
        'expired-callback': () => {
          setToken('');
          setMessage('A verificacao expirou. Atualize o desafio quando quiser.');
        },
      });
    };

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      renderWidget();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [isLocalHost, siteKey]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function verifyToken() {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), TURNSTILE_VERIFY_TIMEOUT_MS);
        await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);
      } catch (error) {
        if (!cancelled) {
          console.warn('Falha na verificacao global do Turnstile:', error);
        }
      }
    }

    verifyToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120]">
      <div className="pointer-events-auto rounded-2xl border border-pink-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b13f73]">
          Verificacao Do Site
        </p>
        <div ref={containerRef} />
        {message && (
          <p className="mt-2 max-w-[260px] text-[11px] leading-relaxed text-[#8b5e74]">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

function RouteSecurityGate({ children }) {
  const location = useLocation();
  const protectedPaths = ['/agendar', '/admin'];
  const requiresGate = protectedPaths.some((path) => location.pathname.startsWith(path));

  if (!requiresGate) {
    return children;
  }

  return <ProtectedRouteGate key={location.pathname}>{children}</ProtectedRouteGate>;
}

function ProtectedRouteGate({ children }) {
  const [status, setStatus] = useState('checking');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const renderTimerRef = useRef(null);
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const shouldProtect = typeof window !== 'undefined' && !isLocalHost;
  const siteKey =
    import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY ||
    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
    PUBLIC_TURNSTILE_SITE_KEY;
  const verifyUrl = `${import.meta.env.VITE_ADMIN_API_URL || PROD_ADMIN_API_URL}/api/admin/turnstile-verify`;

  useEffect(() => {
    if (!shouldProtect) {
      setStatus('ready');
      return;
    }

    setToken('');
    setMessage('');

    if (!siteKey) {
      setStatus('challenge');
      setMessage(
        'Turnstile publico nao configurado. Defina VITE_PUBLIC_TURNSTILE_SITE_KEY para este dominio.',
      );
      return;
    }

    setStatus('challenge');
  }, [shouldProtect, siteKey]);

  useEffect(() => {
    if (status !== 'challenge' || !siteKey || !containerRef.current) return;

    const scriptId = 'cf-turnstile-global-script';
    if (renderTimerRef.current) {
      window.clearTimeout(renderTimerRef.current);
    }

    const renderWidget = () => {
      if (!window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (value) => {
          if (renderTimerRef.current) {
            window.clearTimeout(renderTimerRef.current);
            renderTimerRef.current = null;
          }
          setToken(value);
          setMessage('');
          setStatus('ready');
        },
        'expired-callback': () => {
          setToken('');
          setMessage('A verificacao expirou. Tente novamente.');
        },
        'error-callback': (code) => {
          setToken('');
          if (String(code || '') === '110200') {
            setMessage(
              'Turnstile recusou este dominio. Crie uma site key publica com os hostnames estudiovitoriafreitas.com.br e www.estudiovitoriafreitas.com.br.',
            );
            return;
          }
          setMessage('Nao foi possivel iniciar a verificacao de seguranca.');
        },
      });
    };

    renderTimerRef.current = window.setTimeout(() => {
      if (widgetIdRef.current && !token) {
        setMessage(
          'A verificacao demorou para responder. Toque em tentar novamente ou reduza protecoes de privacidade do navegador para este site.',
        );
      }
    }, TURNSTILE_RENDER_TIMEOUT_MS);

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      renderWidget();
      return () => {
        if (renderTimerRef.current) {
          window.clearTimeout(renderTimerRef.current);
          renderTimerRef.current = null;
        }
      };
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (renderTimerRef.current) {
        window.clearTimeout(renderTimerRef.current);
        renderTimerRef.current = null;
      }
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, status, token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function verifyToken() {
      if (status !== 'ready') {
        setStatus('verifying');
        setMessage('');
      }

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), TURNSTILE_VERIFY_TIMEOUT_MS);

        const response = await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);
 
        if (response.status === 503) {
          const fallbackController = new AbortController();
          const fallbackTimeoutId = window.setTimeout(
            () => fallbackController.abort(),
            TURNSTILE_VERIFY_TIMEOUT_MS,
          );
          const fallbackResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: fallbackController.signal,
          });
          window.clearTimeout(fallbackTimeoutId);

          if (!fallbackResponse.ok) {
            throw new Error('Validacao de seguranca nao autorizada.');
          }
        } else if (!response.ok) {
          throw new Error('Validacao de seguranca nao autorizada.');
        }

        if (cancelled) return;
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        console.warn('Falha ao confirmar Turnstile no servidor:', error);
      }
    }

    verifyToken();
    return () => {
      cancelled = true;
    };
  }, [status, token, verifyUrl]);

  if (status === 'ready') {
    return children;
  }

  const handleRetry = () => {
    setToken('');
    setMessage('');
    setStatus('challenge');
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.16),_transparent_35%),linear-gradient(180deg,#fff8fb_0%,#fff 48%,#fffaf1_100%)] px-6 py-10 text-[#6c2948]">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/70 bg-white/88 p-8 shadow-[0_32px_120px_rgba(219,39,119,0.15)] backdrop-blur">
          <p className="mb-4 text-center text-[11px] uppercase tracking-[0.35em] text-pink-500">Acesso protegido</p>
          <h1 className="mb-3 text-center text-4xl font-light tracking-[0.2em] text-[#7a264b]">PHOTO VITORIA</h1>
          <p className="mx-auto mb-8 max-w-xl text-center text-lg leading-relaxed text-[#8b5e74]">
            Antes de navegar, confirme que o acesso e humano. Essa verificacao protege a galeria, o agendamento e o portal contra abuso automatizado.
          </p>
          <div className="rounded-[24px] border border-pink-100 bg-[#fff9fc] p-6">
            <div ref={containerRef} className="flex min-h-[70px] justify-center" />
            {status === 'verifying' && (
              <p className="mt-4 text-center text-sm text-[#8b5e74]">Validando seguranca...</p>
            )}
            {message && (
              <p className="mt-4 text-center text-sm text-red-500">{message}</p>
            )}
            {(status === 'verifying' || message) && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-full border border-pink-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#b13f73] transition hover:border-pink-300 hover:bg-pink-50"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
            {isLocalHost && (
              <p className="mt-4 text-center text-sm text-amber-600">
                Ambiente local dispensado do gate global.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente interno que usa o context da sidebar
function AppContent({ menuOpen, setMenuOpen, showInstall, handleInstallClick }) {
  const location = useLocation();
  const { isOpen, toggle, sidebarWidth } = useSidebar();

  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    const preventDrag = (event) => event.preventDefault();
    const preventAuxClick = (event) => {
      if (event.button === 2) event.preventDefault();
    };
    const preventMouseDown = (event) => {
      if (event.button === 2) event.preventDefault();
    };
    const preventSelection = (event) => event.preventDefault();
    const preventCopy = (event) => event.preventDefault();
    const preventShortcuts = (event) => {
      const key = String(event.key || '').toLowerCase();
      const withCtrlMeta = event.ctrlKey || event.metaKey;
      if (withCtrlMeta && ['s', 'u', 'p', 'c', 'x'].includes(key)) {
        event.preventDefault();
      }
      if (key === 'f12') {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('auxclick', preventAuxClick);
    document.addEventListener('mousedown', preventMouseDown);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('keydown', preventShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('auxclick', preventAuxClick);
      document.removeEventListener('mousedown', preventMouseDown);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('keydown', preventShortcuts);
    };
  }, []);

  if (location.pathname === '/admin/galeria') {
    return (
      <>
        <div className="min-h-screen bg-[#fafafa]">
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ir para o site
            </Link>
          </div>
          <Routes>
            <Route path="/admin/galeria" element={<AdminGaleriaUploads />} />
          </Routes>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="flex min-h-screen">
        {/* Botão hambúrguer mobile */}
        <button
          className="fixed top-4 left-4 z-[100] p-2 rounded-md bg-white/90 shadow-lg border border-pink-100 text-pink-400 block md:hidden focus:outline-none"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <FaBars size={24} />
        </button>
        
        {/* Botão toggle sidebar desktop */}
        <button
          onClick={toggle}
          className="fixed top-4 z-[100] p-2 rounded-full bg-pink-500 text-white shadow-lg hover:bg-pink-600 transition-all duration-300 hidden md:block"
          style={{ 
            left: `${sidebarWidth - 16}px`,
            transition: 'left 0.3s ease'
          }}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          title={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
        </button>
        
        {/* Sidebar mobile (drawer) */}
        <Sidebar mobile open={menuOpen} onClose={() => setMenuOpen(false)} />
        {/* Sidebar desktop */}
        <Sidebar />
        
        <div 
          className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] transition-all duration-300"
          style={{ 
            marginLeft: window.innerWidth >= 768 ? `${sidebarWidth}px` : '0'
          }}
        >
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/galeria" element={<Galeria />} />
              <Route path="/galeria-infantil" element={<GaleriaCloudinary pasta="infantil" semSetasDots={true} />} />
              <Route path="/galeria-casamentos" element={<GaleriaCloudinary pasta="casamentos" semSetasDots={true} />} />
              <Route path="/galeria-femininos" element={<GaleriaCloudinary pasta="femininos" semSetasDots={true} />} />
              <Route path="/galeria-pre-weding" element={<GaleriaCloudinary pasta="pre-weding" semSetasDots={true} />} />
              <Route path="/galeria-noivas" element={<GaleriaCloudinary pasta="noivas" semSetasDots={true} />} />
              <Route path="/estudio" element={<Estudio />} />
              <Route path="/agendar" element={<Agendamento />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/admin" element={<AdminPromocoes />} />
              <Route path="/admin/galeria" element={<AdminGaleriaUploads />} />
              <Route path="/obrigado" element={<Obrigado />} />
              <Route path="/lgpd" element={<Lgpd />} />
            </Routes>
          </div>
        </div>
      </div>
      {/* Botão flutuante de instalar app (PWA) */}
      {showInstall && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-6 right-6 z-[200] bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-full shadow-xl text-lg animate-bounce-slow"
          style={{ boxShadow: '0 4px 24px #fbc2eb55' }}
        >
          Instalar app
        </button>
      )}
      
      {/* Monitor do sistema (apenas em desenvolvimento) */}
      <SystemMonitor isVisible={import.meta.env.DEV} />
      
      {/* Status das configurações (apenas em desenvolvimento) */}
      <ConfigStatus />
      
      {/* Banner de cookies (LGPD) */}
      <CookieBanner />
    </>
  );
}
