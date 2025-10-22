import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { CONTATO, BotaoWhatsapp, BotaoEmail, BotaoInstagram } from '../components/ContatoInfo';
import SafeImageWithBlur from '../components/ImageWithBlur';
import { LOGO_URL } from '../constants';
import { loadGalleryImages } from '../localAssetsLoader';
import { useResponsive } from '../hooks/useResponsive';

const ALBUNS = [
  { key: 'casamentos', label: 'Casamentos', folder: 'casamentos' },
  { key: 'infantil', label: 'Infantil', folder: 'infantil' },
  { key: 'femininos', label: 'Femininos', folder: 'femininos' },
  { key: 'pre-weding', label: 'Pre-Weding', folder: 'pre-weding' },
  { key: 'noivas', label: 'Noivas', folder: 'noivas' },
];

export default function Galeria() {
  const [fotosPorAlbum, setFotosPorAlbum] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState({ album: null, index: null });
  const { columnsForGallery, isMobile } = useResponsive();

  useEffect(() => {
    async function fetchAll() {
      setCarregando(true);
      const result = {};
      
      // Carrega imagens usando o sistema híbrido para cada álbum
      for (const album of ALBUNS) {
        try {
          const images = await loadGalleryImages(album.key);
          result[album.key] = images || [];
        } catch (error) {
          console.error(`Erro ao carregar álbum ${album.key}:`, error);
          result[album.key] = [];
        }
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

  // Função utilitária para acesso seguro
  const safeFotos = album => Array.isArray(fotosPorAlbum[album]) ? fotosPorAlbum[album] : [];

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
        <div className="w-full flex flex-wrap justify-center gap-4 mb-8 mt-4 z-20 min-h-[56px]">
          <BotaoWhatsapp className="flex-1 min-w-[180px] min-h-[48px] max-w-xs px-6 py-3 rounded-lg bg-green-500 text-white text-lg font-bold shadow-lg hover:bg-green-600 transition-all justify-center font-sans" />
          <BotaoEmail className="hidden md:flex flex-1 min-w-[180px] min-h-[48px] max-w-xs px-6 py-3 rounded-lg bg-pink-400 text-white text-lg font-bold shadow-lg hover:bg-pink-500 transition-all justify-center font-sans" />
          <BotaoInstagram className="flex-1 min-w-[180px] min-h-[48px] max-w-xs px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-400 text-white text-lg font-bold shadow-lg hover:from-yellow-400 hover:to-pink-500 transition-all justify-center font-sans" />
        </div>
        <div className="w-full max-w-7xl flex-1 flex flex-col items-center justify-center px-4 md:px-8">
          {/* Grids por álbum */}
          {!carregando && ALBUNS.map(album => (
            <section key={album.key} className="w-full mb-16 relative flex flex-col items-center justify-center">
              {/* Fundo blur da sessão com as fotos do álbum */}
              {(safeFotos(album.key).length > 0) && (
                <div className="absolute inset-0 w-full h-full z-0 rounded-2xl overflow-hidden" style={{ pointerEvents: 'none' }}>
                  <div className="flex w-full h-full">
                    {safeFotos(album.key).slice(0, 3).map((foto, idx) => (
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
              {(safeFotos(album.key).length === 0) ? (
                <p className="text-pink-300 text-center">Nenhuma foto encontrada ou erro ao carregar.</p>
              ) : (
                <div
                  className="grid gap-4 md:gap-6 w-full"
                  style={{ gridTemplateColumns: `repeat(${columnsForGallery}, 1fr)` }}
                >
                  {safeFotos(album.key).map((foto, idx) => {
                    const url = typeof foto === 'string' ? foto : foto.url;
                    const nome = typeof foto === 'string' ? `Foto ${idx + 1}` : (foto.nome || `Foto ${idx + 1}`);
                    return (
                      <button
                        key={url ? `${url}-${idx}` : idx}
                        className="group relative aspect-[4/5] bg-pink-100/30 rounded-lg overflow-hidden shadow hover:scale-105 transition-transform"
                        onClick={() => setModal({ album: album.key, index: idx })}
                        aria-label={`Abrir foto ${idx + 1} do álbum ${album.label}`}
                      >
                        <SafeImageWithBlur
                          src={url}
                          fallback={typeof url === 'string' ? `/images/galeria/${album.key}/${url}` : `/images/galeria/${album.key}/fallback.avif`}
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
              <SafeImageWithBlur
                src={
                  safeFotos(modal.album)[modal.index]?.url ||
                  safeFotos(modal.album)[modal.index] ||
                  ''
                }
                fallback={
                  typeof safeFotos(modal.album)[modal.index]?.url === 'string'
                    ? `/images/galeria/${modal.album}/${safeFotos(modal.album)[modal.index]?.url}`
                    : `/images/galeria/${modal.album}/fallback.avif`
                }
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

