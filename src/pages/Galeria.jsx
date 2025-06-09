import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { ActionButtons, CONTATO, BotaoWhatsapp, BotaoEmail, BotaoInstagram } from '../components/ContatoInfo';
import ImageWithBlur from '../components/ImageWithBlur';
import { LOGO_URL } from '../constants';

const ALBUNS = [
  { key: 'casamentos', label: 'Casamentos' },
  { key: 'infantil', label: 'Infantil' },
  { key: 'femininos', label: 'Femininos' },
  { key: 'pre-weding', label: 'Pre-Weding' },
  { key: 'noivas', label: 'Noivas' },
];

export default function Galeria() {
  const [fotosPorAlbum, setFotosPorAlbum] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState({ album: null, index: null });

  useEffect(() => {
    async function fetchAll() {
      setCarregando(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      const result = {};
      for (const album of ALBUNS) {
        try {
          const res = await fetch(`${apiUrl}/galeria/${album.key}`);
          const data = await res.json();
          result[album.key] = data.images || [];
        } catch { result[album.key] = []; }
      }
      setFotosPorAlbum(result);
      setCarregando(false);
    }
    fetchAll();
  }, []);

  function openModal(album, index) { setModal({ album, index }); }
  function closeModal() { setModal({ album: null, index: null }); }
  function prevFoto() {
    setModal(m => ({
      album: m.album,
      index: m.index === 0 ? (fotosPorAlbum[m.album]?.length || 1) - 1 : m.index - 1
    }));
  }
  function nextFoto() {
    setModal(m => ({
      album: m.album,
      index: m.index === (fotosPorAlbum[m.album]?.length || 1) - 1 ? 0 : m.index + 1
    }));
  }

  return (
    <div className="relative min-h-screen flex flex-col w-full">
      {/* Fundo gradiente + blur de imagem */}
      <div className="absolute inset-0 z-0 w-full h-full min-h-screen">
        <div className="w-full h-full min-h-screen absolute inset-0" style={{
          background: 'linear-gradient(135deg, #ffe4ef 0%, #fffbe9 60%, #fff 100%)',
          opacity: 0.7,
        }} />
      </div>
      {/* Marcas d'água decorativas sobre o conteúdo (glassmorphism) */}
      <div className="absolute inset-0 z-30 pointer-events-none select-none">
        {[...Array(5)].map((_, i) => (
          <img
            key={i}
            src={LOGO_URL}
            alt="Marca d'água logo"
            className="absolute opacity-5 w-32 md:w-40"
            style={{
              top: `${10 + 16 * i}%`,
              left: `${i % 2 === 0 ? 10 : 60}%`,
              transform: `rotate(${i % 2 === 0 ? 8 : -12}deg)`
            }}
            draggable={false}
          />
        ))}
      </div>
      {/* Bloco principal centralizado */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        {/* Botões de contato fixos no topo */}
        <div className="w-full flex flex-wrap justify-center gap-4 mb-8 mt-4 z-20">
          <BotaoWhatsapp className="flex-1 min-w-[180px] max-w-xs px-6 py-3 rounded-lg bg-green-500 text-white text-lg font-bold shadow-lg hover:bg-green-600 transition-all justify-center font-sans" />
          <BotaoEmail className="hidden md:flex flex-1 min-w-[180px] max-w-xs px-6 py-3 rounded-lg bg-pink-400 text-white text-lg font-bold shadow-lg hover:bg-pink-500 transition-all justify-center font-sans" />
          <BotaoInstagram className="flex-1 min-w-[180px] max-w-xs px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-400 text-white text-lg font-bold shadow-lg hover:from-yellow-400 hover:to-pink-500 transition-all justify-center font-sans" />
        </div>
        <div className="w-full max-w-7xl flex-1 flex flex-col items-center justify-center px-4 md:px-8">
          {/* Grids por álbum */}
          {!carregando && ALBUNS.map(album => (
            <section key={album.key} className="w-full mb-16 relative flex flex-col items-center justify-center">
              {/* Fundo blur da sessão com as fotos do álbum */}
              {(fotosPorAlbum[album.key]?.length > 0) && (
                <div className="absolute inset-0 w-full h-full z-0 rounded-2xl overflow-hidden" style={{ pointerEvents: 'none' }}>
                  <div className="flex w-full h-full">
                    {(fotosPorAlbum[album.key] || []).slice(0, 3).map((foto, idx) => (
                      <div key={idx} style={{
                        flex: 1,
                        backgroundImage: `url(${typeof foto === 'string' ? foto : foto.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(24px) brightness(0.7)',
                        opacity: 0.18 + 0.08 * idx,
                        minHeight: 140,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              {/* Título da sessão */}
              <h2 className="relative z-10 text-2xl md:text-3xl font-extrabold text-pink-600 mb-6 mt-8 text-left w-full pl-4 drop-shadow bg-white/80 rounded-lg inline-block px-6 py-2 shadow-lg border-l-4 border-pink-300 font-sans">{album.label}</h2>
              {(fotosPorAlbum[album.key]?.length === 0) ? (
                <p className="text-pink-300 text-center">Nenhuma foto encontrada.</p>
              ) : (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 w-full"
                >
                  {(fotosPorAlbum[album.key] || []).map((foto, idx) => {
                    const url = typeof foto === 'string' ? foto : foto.url;
                    const nome = typeof foto === 'string' ? `Foto ${idx + 1}` : (foto.nome || `Foto ${idx + 1}`);
                    return (
                      <button
                        key={url ? `${url}-${idx}` : idx}
                        className="group relative aspect-[4/5] bg-pink-100/30 rounded-lg overflow-hidden shadow hover:scale-105 transition-transform"
                        onClick={() => setModal({ album: album.key, index: idx })}
                        aria-label={`Abrir foto ${idx + 1} do álbum ${album.label}`}
                      >
                        <ImageWithBlur
                          src={url}
                          alt={nome}
                          className="object-cover w-full h-full group-hover:brightness-90 transition"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
          {carregando && <div className="text-xl text-gray-400 py-12">Carregando galeria...</div>}
        </div>
      </div>
      {/* Modal de zoom/detalhe */}
      {modal.album && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 transition-all duration-300" onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 text-white/80 hover:text-pink-300 text-4xl font-bold z-10 bg-white/20 rounded-full p-2 shadow transition-all" onClick={closeModal} aria-label="Fechar">&times;</button>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-pink-300 text-3xl font-bold z-10 bg-white/20 rounded-full p-2 shadow transition-all" onClick={prevFoto} aria-label="Anterior">&#60;</button>
            <div className="rounded-2xl shadow-2xl bg-white/90 p-2 flex items-center justify-center max-h-[85vh] w-full transition-all duration-300 relative max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto">
              <ImageWithBlur
                src={fotosPorAlbum[modal.album][modal.index]?.url || fotosPorAlbum[modal.album][modal.index]}
                alt={`Foto ${modal.index + 1}`}
                className="rounded-2xl shadow max-h-[80vh] max-w-full object-contain bg-white transition-all duration-300"
                style={{ userSelect: 'none' }}
                draggable={false}
              />
            </div>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-pink-300 text-3xl font-bold z-10 bg-white/20 rounded-full p-2 shadow transition-all" onClick={nextFoto} aria-label="Próxima">&#62;</button>
          </motion.div>
        </div>
      )}
    </div>
  );
} 

