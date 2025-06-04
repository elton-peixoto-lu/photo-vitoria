import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import Contato from './pages/Contato';
import Estudio from './pages/Estudio';
import AdminPromocoes from './admin/AdminPromocoes';
import Home from './pages/Home';
import GaleriaCloudinary from './components/GaleriaCloudinary';
import Galeria from './pages/Galeria';
import { FaImages, FaBaby, FaHeart, FaVenus, FaCameraRetro, FaCamera, FaEnvelope, FaInstagram, FaHome, FaBars, FaTimes } from 'react-icons/fa';
import { CONTATO } from './components/ContatoInfo';

const MENU = [
  { label: 'Home', path: '/', icon: <FaHome size={18} /> },
  { label: 'Galeria', path: '/galeria', icon: <FaImages size={22} /> },
  { label: 'Infantil', path: '/galeria-infantil', icon: <FaBaby size={18} /> },
  { label: 'Casamentos', path: '/galeria-casamentos', icon: <FaHeart size={18} /> },
  { label: 'Femininos', path: '/galeria-femininos', icon: <FaVenus size={18} /> },
  { label: 'Pre-Weding', path: '/galeria-pre-weding', icon: <FaCameraRetro size={18} /> },
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

// Cache simples para preload das galerias
const galeriaCache = {};
function preloadGaleria(pasta) {
  if (galeriaCache[pasta]) return;
  const apiUrl = import.meta.env.VITE_API_URL;
  fetch(`${apiUrl}/galeria/${encodeURIComponent(pasta)}`)
    .then(res => res.json())
    .then(fotos => { galeriaCache[pasta] = fotos; });
}

function Logo() {
  return (
    <div className="flex flex-col items-center mb-10 mt-6 select-none">
      <img
        src="https://res.cloudinary.com/driuyeufs/image/upload/v1748900747/logo_xfrtze.png"
        alt="Logo Fotos da Vitória"
        className="w-32 h-auto mb-2 drop-shadow"
      />
    </div>
  );
}

function Sidebar({ mobile = false, open = false, onClose }) {
  const location = useLocation();
  // Overlay para mobile
  if (mobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-label="Fechar menu"
        />
        <motion.aside
          initial={{ x: -260 }}
          animate={{ x: open ? 0 : -260 }}
          transition={{ duration: 0.3, type: 'spring' }}
          className={`fixed left-0 top-0 z-50 bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] text-gray-700 w-60 h-screen flex flex-col px-2 py-4 shadow-2xl border-r border-[#f3e8ff] ${open ? '' : 'pointer-events-none'}`}
          style={{ width: 240 }}
        >
          <button
            className="absolute top-4 right-4 text-2xl text-pink-400 hover:text-pink-600 focus:outline-none"
            onClick={onClose}
            aria-label="Fechar menu"
            tabIndex={open ? 0 : -1}
          >
            <FaTimes />
          </button>
          <Logo />
          <nav className="flex-1 flex flex-col gap-0.5 mt-4">
            {MENU.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 justify-start py-1.5 px-2 rounded-md font-medium transition-all duration-300
                  ${location.pathname === item.path
                    ? 'bg-gradient-to-r from-[#fbc2eb] via-[#fbeffb] to-[#a5b4fc] text-[#a21caf] shadow-lg border border-[#f3e8ff] scale-105'
                    : 'bg-transparent text-gray-500 hover:text-[#a78bfa]'}
                `}
                style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 600, fontSize: '0.98rem', boxShadow: location.pathname === item.path ? '0 4px 24px #fbc2eb33' : undefined, height: '2.2rem', minHeight: '2.2rem' }}
                onClick={onClose}
                onMouseEnter={() => {
                  if (item.path.startsWith('/galeria-')) {
                    const pasta = item.path.replace('/galeria-', '');
                    preloadGaleria(pasta);
                  }
                }}
                title={item.label || 'Galeria'}
                tabIndex={open ? 0 : -1}
              >
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.label && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>
          <a
            href={CONTATO.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 mb-2 px-6 py-3 bg-pink-500 text-white font-bold rounded-full shadow hover:bg-pink-600 transition text-lg text-center flex items-center justify-center gap-2"
            style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 700, letterSpacing: '0.04em' }}
            tabIndex={open ? 0 : -1}
          >
            <FaInstagram size={22} /> Veja mais
          </a>
          <a href={CONTATO.whatsapp.url} target="_blank" rel="noopener noreferrer" className="mt-10 flex items-center gap-2 text-green-400 hover:text-green-300 text-sm" tabIndex={open ? 0 : -1}>
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.004 2.003c-5.523 0-9.997 4.474-9.997 9.997 0 1.762.464 3.484 1.345 4.997l-1.409 5.168a1 1 0 0 0 1.225 1.225l5.168-1.409a9.963 9.963 0 0 0 4.997 1.345c5.523 0 9.997-4.474 9.997-9.997s-4.474-9.997-9.997-9.997zm0 18.001a7.96 7.96 0 0 1-4.07-1.144l-.29-.172-3.067.837.822-3.016-.188-.309a7.963 7.963 0 1 1 6.793 3.804zm4.387-5.409c-.24-.12-1.418-.7-1.637-.779-.219-.08-.379-.12-.539.12-.16.239-.619.779-.759.939-.14.16-.279.18-.519.06-.24-.12-1.014-.373-1.933-1.19-.715-.637-1.197-1.426-1.338-1.666-.14-.24-.015-.369.105-.489.108-.107.24-.279.36-.419.12-.14.16-.239.24-.399.08-.16.04-.299-.02-.419-.06-.12-.539-1.299-.739-1.779-.195-.468-.393-.405-.539-.413l-.459-.008c-.16 0-.419.06-.639.299-.219.239-.839.819-.839 1.999 0 1.18.859 2.319.979 2.479.12.16 1.689 2.579 4.099 3.519.574.197 1.021.314 1.37.403.575.146 1.099.126 1.513.077.461-.055 1.418-.579 1.618-1.139.2-.56.2-1.04.14-1.139-.06-.1-.22-.16-.46-.28z"/></svg>
            WhatsApp
          </a>
        </motion.aside>
      </>
    );
  }
  // Desktop
  return (
    <motion.aside
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, type: 'spring' }}
      className="bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] text-gray-700 w-40 h-screen fixed left-0 top-0 flex flex-col px-2 py-4 shadow-2xl border-r border-[#f3e8ff] z-40 hidden md:flex"
    >
      <Logo />
      <nav className="flex-1 flex flex-col gap-0.5">
        {MENU.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 justify-start py-1.5 px-2 rounded-md font-medium transition-all duration-300
              ${location.pathname === item.path
                ? 'bg-gradient-to-r from-[#fbc2eb] via-[#fbeffb] to-[#a5b4fc] text-[#a21caf] shadow-lg border border-[#f3e8ff] scale-105'
                : 'bg-transparent text-gray-500 hover:text-[#a78bfa]'}
            `}
            style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 600, fontSize: '0.98rem', boxShadow: location.pathname === item.path ? '0 4px 24px #fbc2eb33' : undefined, height: '2.2rem', minHeight: '2.2rem' }}
            onMouseEnter={() => {
              if (item.path.startsWith('/galeria-')) {
                const pasta = item.path.replace('/galeria-', '');
                preloadGaleria(pasta);
              }
            }}
            title={item.label || 'Galeria'}
          >
            {item.icon && <span className="mr-1.5">{item.icon}</span>}
            {item.label && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      <a
        href={CONTATO.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 mb-2 px-6 py-3 bg-pink-500 text-white font-bold rounded-full shadow hover:bg-pink-600 transition text-lg text-center flex items-center justify-center gap-2"
        style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 700, letterSpacing: '0.04em' }}
      >
        <FaInstagram size={22} /> Veja mais
      </a>
      <a href={CONTATO.whatsapp.url} target="_blank" rel="noopener noreferrer" className="mt-10 flex items-center gap-2 text-green-400 hover:text-green-300 text-sm">
        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.004 2.003c-5.523 0-9.997 4.474-9.997 9.997 0 1.762.464 3.484 1.345 4.997l-1.409 5.168a1 1 0 0 0 1.225 1.225l5.168-1.409a9.963 9.963 0 0 0 4.997 1.345c5.523 0 9.997-4.474 9.997-9.997s-4.474-9.997-9.997-9.997zm0 18.001a7.96 7.96 0 0 1-4.07-1.144l-.29-.172-3.067.837.822-3.016-.188-.309a7.963 7.963 0 1 1 6.793 3.804zm4.387-5.409c-.24-.12-1.418-.7-1.637-.779-.219-.08-.379-.12-.539.12-.16.239-.619.779-.759.939-.14.16-.279.18-.519.06-.24-.12-1.014-.373-1.933-1.19-.715-.637-1.197-1.426-1.338-1.666-.14-.24-.015-.369.105-.489.108-.107.24-.279.36-.419.12-.14.16-.239.24-.399.08-.16.04-.299-.02-.419-.06-.12-.539-1.299-.739-1.779-.195-.468-.393-.405-.539-.413l-.459-.008c-.16 0-.419.06-.639.299-.219.239-.839.819-.839 1.999 0 1.18.859 2.319.979 2.479.12.16 1.689 2.579 4.099 3.519.574.197 1.021.314 1.37.403.575.146 1.099.126 1.513.077.461-.055 1.418-.579 1.618-1.139.2-.56.2-1.04.14-1.139-.06-.1-.22-.16-.46-.28z"/></svg>
        WhatsApp
      </a>
    </motion.aside>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Botão hambúrguer mobile */}
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white/90 shadow-lg border border-pink-100 text-pink-400 block md:hidden focus:outline-none"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <FaBars size={24} />
        </button>
        {/* Sidebar mobile (drawer) */}
        <Sidebar mobile open={menuOpen} onClose={() => setMenuOpen(false)} />
        {/* Sidebar desktop */}
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] md:ml-40">
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/galeria" element={<Galeria />} />
              <Route path="/galeria-infantil" element={<GaleriaCloudinary pasta="infantil" semSetasDots={true} />} />
              <Route path="/galeria-casamentos" element={<GaleriaCloudinary pasta="casamentos" semSetasDots={true} />} />
              <Route path="/galeria-femininos" element={<GaleriaCloudinary pasta="femininos" semSetasDots={true} />} />
              <Route path="/galeria-pre-weding" element={<GaleriaCloudinary pasta="pre-weding" semSetasDots={true} />} />
              <Route path="/estudio" element={<Estudio />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/admin" element={<AdminPromocoes />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
