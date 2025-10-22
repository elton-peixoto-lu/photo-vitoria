import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import Contato from './pages/Contato';
import Estudio from './pages/Estudio';
import AdminPromocoes from './admin/AdminPromocoes';
import Home from './pages/Home';
import GaleriaCloudinary from './components/GaleriaCloudinary';
import Galeria from './pages/Galeria';
import Obrigado from './pages/Obrigado';
import Lgpd from './pages/Lgpd';
import { FaImages, FaBaby, FaHeart, FaVenus, FaCameraRetro, FaCamera, FaEnvelope, FaInstagram, FaHome, FaBars, FaTimes, FaArrowLeft, FaWhatsapp, FaCrown, FaRing, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CONTATO } from './components/ContatoInfo';
import { LOGO_URL } from './constants';
import { SpeedInsights } from "@vercel/speed-insights/react";
import CookieBanner from './components/CookieBanner';
import SystemMonitor from './components/SystemMonitor';
import { loadGalleryImages } from './localAssetsLoader';
import { ConfigProvider, ConfigStatus } from './components/ConfigProvider';
import DynamicBanner from './components/DynamicBanner';
import PromocaoSite from './components/PromocaoSite';
import { SidebarProvider, useSidebar } from './context/SidebarContext';

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
  { label: 'Home', path: '/', icon: <FaHome size={18} /> },
  { label: 'Galeria', path: '/galeria', icon: <FaImages size={22} /> },
  { label: 'Infantil', path: '/galeria-infantil', icon: <FaBaby size={18} /> },
  { label: 'Casamentos', path: '/galeria-casamentos', icon: <FaHeart size={18} /> },
  { label: 'Femininos', path: '/galeria-femininos', icon: <FaVenus size={18} /> },
  { label: 'Pre-Weding', path: '/galeria-pre-weding', icon: <FaCameraRetro size={18} /> },
  { label: 'Noivas', path: '/galeria-noivas', icon: <FaCrown size={20} /> },
  { label: 'Estúdio', path: '/estudio', icon: <FaCamera size={18} /> },
  { label: 'Contato', path: '/contato', icon: <FaEnvelope size={18} /> },
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

function Logo({ collapsed = false }) {
  return (
    <div className="flex flex-col items-center mb-10 mt-6 select-none">
      <img
        src={LOGO_URL}
        alt="Logo Fotos da Vitória"
        className={`${collapsed ? 'w-10' : 'w-32'} h-auto mb-2 drop-shadow transition-all duration-300`}
      />
    </div>
  );
}

function Sidebar({ mobile = false, open = false, onClose }) {
  const location = useLocation();
  const MOBILE_MENU_PATHS = ['/', '/galeria', '/contato', '/estudio', '/galeria-noivas'];
  if (mobile) {
    return (
      <>
        {open && (
          <>
            {/* Botões de ação fixos no topo */}
            <div className="fixed top-2 left-2 z-[110] flex gap-3 items-center">
              {/* Seta de voltar */}
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 shadow border border-pink-100 text-pink-400 text-3xl focus:outline-none"
                onClick={onClose}
                aria-label="Voltar"
                tabIndex={open ? 0 : -1}
              >
                <FaArrowLeft />
              </button>
              {/* Botão coração (exemplo) */}
              <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 shadow border border-pink-100 text-pink-400 text-2xl">
                <FaHeart />
              </a>
              {/* Botão WhatsApp */}
              <a href={CONTATO.whatsapp.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 shadow border border-green-200 text-green-500 text-2xl">
                <FaWhatsapp />
              </a>
              {/* Botão Instagram */}
              <a href={CONTATO.instagram.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 shadow border border-pink-100 text-pink-400 text-2xl">
                <FaInstagram />
              </a>
              {/* Botão Email */}
              <a href={CONTATO.email.url} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 shadow border border-blue-100 text-blue-400 text-2xl">
                <FaEnvelope />
              </a>
            </div>
            <div
              className="fixed inset-0 z-[99] bg-black/40 transition-opacity duration-300 opacity-100 pointer-events-auto"
              onClick={onClose}
              aria-label="Fechar menu"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: open ? 0 : -260 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="fixed left-0 top-0 z-[100] bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] text-gray-700 w-20 h-screen flex flex-col px-2 py-4 shadow-2xl border-r border-[#f3e8ff]"
              style={{ width: 80 }}
            >
              <div className="mt-20" /> {/* Espaço para os botões fixos */}
              <Logo />
              <nav className="flex-1 flex flex-col gap-2 mt-4 items-center">
                {MENU.filter(item => MOBILE_MENU_PATHS.includes(item.path)).map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                      ${location.pathname === item.path
                        ? 'bg-gradient-to-r from-[#fbc2eb] via-[#fbeffb] to-[#a5b4fc] text-[#a21caf] shadow-lg border border-[#f3e8ff] scale-110'
                        : 'bg-transparent text-gray-500 hover:text-[#a78bfa]'}
                    `}
                    style={{ fontSize: 28 }}
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
      className="bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] text-gray-700 h-screen fixed left-0 top-0 flex flex-col py-4 shadow-2xl border-r border-[#f3e8ff] z-40 hidden md:flex overflow-hidden"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className={`px-2 ${!isOpen ? 'flex justify-center' : ''}`}>
        <Logo collapsed={!isOpen} />
      </div>
      
      <nav className={`flex-1 flex flex-col gap-0.5 mt-2 overflow-y-auto overflow-x-hidden ${!isOpen ? 'items-center px-1' : 'px-1'}`} style={{ paddingRight: isOpen ? '4px' : undefined }}>
        {MENU.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-1.5 py-2 rounded-md font-medium transition-all duration-300 ${
              !isOpen ? 'justify-center px-2' : 'justify-start px-2'
            } ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-[#fbc2eb] via-[#fbeffb] to-[#a5b4fc] text-[#a21caf] shadow-lg border border-[#f3e8ff]'
                : 'bg-transparent text-gray-500 hover:text-[#a78bfa] hover:bg-gray-50'
            }`}
            style={{ 
              fontFamily: 'Montserrat, Inter, sans-serif', 
              fontWeight: 600, 
              fontSize: !isOpen ? '1.2rem' : '0.8rem', 
              boxShadow: location.pathname === item.path ? '0 4px 24px #fbc2eb33' : undefined, 
              minHeight: '2rem',
              minWidth: !isOpen ? '2.5rem' : 'auto',
              lineHeight: '1.2'
            }}
            onMouseEnter={() => {
              if (item.path.startsWith('/galeria-')) {
                const pasta = item.path.replace('/galeria-', '');
                preloadGaleria(pasta);
              }
            }}
            title={item.label || 'Galeria'}
          >
            {item.icon && <span className={!isOpen ? '' : 'mr-1.5 flex-shrink-0'}>{item.icon}</span>}
            {isOpen && item.label && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      {isOpen && (
        <div className="flex flex-col px-2 pb-2">
          <a
            href={CONTATO.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 mb-2 px-4 py-2.5 bg-pink-500 text-white font-bold rounded-full shadow hover:bg-pink-600 transition text-sm text-center flex items-center justify-center gap-2 whitespace-nowrap"
            style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 700 }}
          >
            <FaInstagram size={18} /> Veja mais
          </a>
          <a 
            href={CONTATO.whatsapp.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-8 flex items-center gap-2 text-green-400 hover:text-green-300 text-xs justify-center whitespace-nowrap"
          >
            <FaWhatsapp size={18} />
            WhatsApp
          </a>
        </div>
      )}
      
      {!isOpen && (
        <div className="flex flex-col items-center gap-3 mb-4">
          <a
            href={CONTATO.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-500 text-white shadow hover:bg-pink-600 transition"
            title="Instagram"
          >
            <FaInstagram size={18} />
          </a>
          <a 
            href={CONTATO.whatsapp.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white shadow hover:bg-green-600 transition"
            title="WhatsApp"
          >
            <FaWhatsapp size={18} />
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
          <AppContent 
            menuOpen={menuOpen} 
            setMenuOpen={setMenuOpen} 
            showInstall={showInstall}
            handleInstallClick={handleInstallClick}
          />
        </BrowserRouter>
      </ConfigProvider>
    </SidebarProvider>
  );
}

// Componente interno que usa o context da sidebar
function AppContent({ menuOpen, setMenuOpen, showInstall, handleInstallClick }) {
  const { isOpen, toggle, sidebarWidth } = useSidebar();
  
  return (
    <>
      <PromocaoSite />
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
              <Route path="/contato" element={<Contato />} />
              <Route path="/admin" element={<AdminPromocoes />} />
              <Route path="/obrigado" element={<Obrigado />} />
              <Route path="/lgpd" element={<Lgpd />} />
            </Routes>
          </div>
        </div>
      </div>
      <SpeedInsights />
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
