import { useEffect, useState, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaChevronLeft, FaChevronRight, FaHeart, FaPause, FaPlay, FaRegHeart, FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import BaloesAnimados from './BaloesAnimados';
import { ActionButtons, CONTATO } from './ContatoInfo';
import HTMLFlipBook from 'react-pageflip';
import React from 'react';
import { getCloudinaryOptimizedUrl, getCloudinaryBlurUrl } from '../cloudinaryUtils';
import { filterRenderableGalleryImages, getGalleryFallbackUrl, loadGalleryImages, resolveGalleryImageUrl } from '../localAssetsLoader';
import { useResponsive } from '../hooks/useResponsive';

function toRasterCandidate(url) {
  if (!url) return '';
  if (/\.avif(\?.*)?$/i.test(url)) {
    return url.replace(/\.avif(\?.*)?$/i, '.jpg$1');
  }
  return url;
}

export default function GaleriaCloudinary({ pasta, autoAvancarFimAlbum = false, onFimAlbum, semSetasDots = false, modoGridOnly = false }) {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sizes, setSizes] = useState({}); // {index: {w, h}}
  const [liked, setLiked] = useState({}); // {index: true}
  const [prevFotos, setPrevFotos] = useState([]);
  const [fadeOut, setFadeOut] = useState(false);
  const fadeTimeout = useRef();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const sliderRef = useRef();
  const [paused, setPaused] = useState(false);
  const { isMobile: isMobileResponsive, shouldAutoplayCarousel, prefersReducedMotion } = useResponsive();

  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    const preventDrag = (event) => event.preventDefault();
    const preventShortcuts = (event) => {
      const key = String(event.key || '').toLowerCase();
      const withCtrlMeta = event.ctrlKey || event.metaKey;

      if (withCtrlMeta && ['s', 'u', 'p'].includes(key)) {
        event.preventDefault();
      }
      if (key === 'f12') {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('keydown', preventShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('keydown', preventShortcuts);
    };
  }, []);

  // Fetch das fotos usando sistema híbrido (local + API fallback)
  useEffect(() => {
    if (fotos.length > 0) setPrevFotos(fotos);
    setLoading(true);
    setFadeOut(true);
    clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => setFadeOut(false), 200);
    
    // Carrega imagens usando o sistema híbrido
    loadGalleryImages(pasta)
      .then(imagens => {
        setFotos(filterRenderableGalleryImages(imagens || [], pasta));
      })
      .catch(error => {
        console.error('Erro ao carregar imagens:', error);
        setFotos([]);
      })
      .finally(() => setLoading(false));
  }, [pasta]);

  // Detecção de mobile apenas para renderização
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (!autoAvancarFimAlbum) return;
    if (fotos.length === 0) return;
    if (currentSlide === fotos.length - 1) {
      // Última foto
      if (onFimAlbum) {
        setTimeout(() => onFimAlbum(), 800); // pequena pausa para transição
      }
      sliderRef.current?.slickPause();
    }
  }, [currentSlide, fotos.length, autoAvancarFimAlbum, onFimAlbum]);

  const handleImgLoad = (e, i) => {
    const { naturalWidth, naturalHeight } = e.target;
    setSizes(s => ({ ...s, [i]: { w: naturalWidth, h: naturalHeight } }));
  };

  const handleLike = i => setLiked(l => ({ ...l, [i]: !l[i] }));
  const handlePrevSlide = () => {
    sliderRef.current?.slickPrev?.();
    setPaused(true);
  };
  const handleNextSlide = () => {
    sliderRef.current?.slickNext?.();
    setPaused(true);
  };
  const toggleCarouselPlayback = () => {
    setPaused((currentPaused) => !currentPaused);
  };

  let appendDots = undefined;
  if (!semSetasDots) {
    appendDots = (dots) => (
      <div
        style={{ position: 'absolute', bottom: 24, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}
      >
        <div className="flex gap-2 w-full max-w-2xl mx-auto px-4">{dots}</div>
      </div>
    );
  }
  const settings = {
    dots: !semSetasDots,
    arrows: !semSetasDots,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: false,
    autoplay: autoAvancarFimAlbum && !paused,
    autoplaySpeed: 3000,
    pauseOnHover: false,
    fade: true,
    cssEase: 'ease-in-out',
    beforeChange: (_, next) => setCurrentSlide(next),
    appendDots,
    customPaging: () => <></>,
  };

  // Depuração: verifique se as fotos estão chegando
  console.log('fotos:', fotos, 'pasta:', pasta);

  // Controle de pausa/play do carrossel
  useEffect(() => {
    if (!sliderRef.current) return;
    if (paused) {
      sliderRef.current.slickPause && sliderRef.current.slickPause();
    } else {
      sliderRef.current.slickPlay && sliderRef.current.slickPlay();
    }
  }, [paused]);

  // Barra de tempo animada (status)
  function BarraTempo({ total, atual }) {
    return (
      <div className="flex gap-2 w-full max-w-2xl mx-auto px-4 mt-2 mb-0 select-none z-30" style={{ position: 'relative' }}>
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-2.5 bg-pink-200 rounded-full overflow-hidden relative shadow cursor-pointer border border-pink-100"
            style={{ boxShadow: '0 2px 8px #ec489955' }}
            onClick={() => setPaused(p => !p)}
            title={paused ? 'Clique para retomar' : 'Clique para pausar'}
          >
            <div
              className={`absolute left-0 top-0 h-full bg-pink-400 transition-all duration-3000 ${idx < atual ? 'w-full' : idx === atual && !paused ? 'w-full animate-timer-bar' : 'w-0'}`}
              style={idx === atual && !paused ? { animationDuration: '3s' } : {}}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isMobile) {
    if (loading) return <div className="w-full flex items-center justify-center py-12 text-lg text-gray-400">Carregando fotos...</div>;
    if (!fotos || fotos.length === 0) return <div className="w-full flex items-center justify-center py-12 text-lg text-pink-300">Nenhuma foto encontrada.</div>;
    // Mobile: lista de miniaturas
    return (
      <div className="w-full flex flex-col items-center justify-center gap-6 py-6 px-0 select-none" onContextMenu={(e) => e.preventDefault()}>
        {(Array.isArray(fotos) ? fotos : []).map((foto, i) => (
          <div key={foto?.public_id || foto?.url || i} className="w-full flex flex-col items-center justify-center">
            <picture className="w-full">
              <source srcSet={getCloudinaryOptimizedUrl(resolveGalleryImageUrl(foto))} type="image/avif" />
              <img
                src={toRasterCandidate(getCloudinaryOptimizedUrl(resolveGalleryImageUrl(foto))) || '/images/fallback.jpg'}
                alt={`Foto ${i + 1}`}
                className="w-full max-w-full h-auto object-contain rounded-lg shadow bg-white"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onError={(event) => {
                  event.currentTarget.src = '/images/fallback.jpg';
                }}
              />
            </picture>
          </div>
        ))}
        {/* Action bar: abaixo de todas as fotos no mobile */}
        <ActionButtons contatos={CONTATO} />
      </div>
    );
  }

  if (modoGridOnly) {
    return (
      <>
        {(Array.isArray(fotos) ? fotos : []).map((foto, i) => (
          <div key={foto?.public_id || foto?.url || i} className="relative w-full h-64 flex items-center justify-center">
            <picture className="w-full h-full">
              <source srcSet={getCloudinaryOptimizedUrl(resolveGalleryImageUrl(foto))} type="image/avif" />
              <img
                src={toRasterCandidate(getCloudinaryOptimizedUrl(resolveGalleryImageUrl(foto))) || '/images/fallback.jpg'}
                alt={`Foto ${i + 1}`}
                className="rounded-lg shadow-md w-full h-full object-cover"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ background: '#fff' }}
                onError={(event) => {
                  event.currentTarget.src = '/images/fallback.jpg';
                }}
              />
            </picture>
          </div>
        ))}
      </>
    );
  }

  useEffect(() => {
    if (!semSetasDots) return;
    if (!sliderRef.current) return;
    sliderRef.current.slickPlay && sliderRef.current.slickPlay();
  }, [semSetasDots, fotos.length]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Fundo blur cobre toda a área do conteúdo */}
      {fotos.length > 0 && (
        <div className="absolute inset-0 z-0">
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${resolveGalleryImageUrl(fotos[currentSlide || 0]) || getGalleryFallbackUrl(pasta)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(32px) brightness(0.7)',
              opacity: 0.8,
            }}
          />
        </div>
      )}
      {/* Carrossel centralizado acima do blur */}
      <div className="relative z-10 w-full max-w-full md:max-w-7xl h-[60vw] max-h-[70vh] md:min-h-[400px] md:max-h-screen flex flex-col items-center justify-center px-2 md:px-0">
        {!loading && fotos.length > 0 && (
          <div className="relative w-full">
            {/* Prev */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 z-30 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 border border-gray-200 text-gray-500 shadow-md hover:bg-white hover:text-pink-500 hover:border-pink-200 hover:shadow-pink-100 transition-all duration-200 focus:outline-none"
              aria-label="Foto anterior"
            >
              <FaChevronLeft size={11} />
            </button>
            {/* Next */}
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 z-30 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 border border-gray-200 text-gray-500 shadow-md hover:bg-white hover:text-pink-500 hover:border-pink-200 hover:shadow-pink-100 transition-all duration-200 focus:outline-none"
              aria-label="Próxima foto"
            >
              <FaChevronRight size={11} />
            </button>
            <Slider
              ref={sliderRef}
              {...settings}
              autoplay={semSetasDots}
              autoplaySpeed={3000}
              className="w-full h-[60vw] max-h-[70vh] md:min-h-[400px] md:max-h-screen"
            >
              {(Array.isArray(fotos) ? fotos : []).map((foto, i) => {
                const imageUrl = resolveGalleryImageUrl(foto) || getGalleryFallbackUrl(pasta);
                const blurUrl = getCloudinaryOptimizedUrl(getCloudinaryBlurUrl(imageUrl));
                const optimizedImageUrl = getCloudinaryOptimizedUrl(imageUrl);
                const rasterCandidate = toRasterCandidate(optimizedImageUrl) || '/images/fallback.jpg';
                return (
                <div
                  key={foto?.public_id || foto?.url || i}
                  className="flex flex-col md:flex-row items-center justify-center w-full h-auto min-h-[200px] md:min-h-[400px] md:max-h-screen relative group px-2 py-4"
                  tabIndex={0}
                >
                  {/* Blur up: imagem borrada de fundo */}
                  <img
                    src={blurUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 transition-opacity duration-500"
                    style={{ opacity: sizes[i]?.loaded ? 0 : 1, zIndex: 1 }}
                    aria-hidden="true"
                    draggable={false}
                  />
                  {/* Foto real com fade */}
                  <picture className="relative z-10">
                    <source srcSet={optimizedImageUrl} type="image/avif" />
                    <img
                      src={rasterCandidate}
                      alt={`Foto ${i + 1}`}
                      className="relative z-10 max-h-[50vh] max-w-[90vw] md:max-h-[80vh] md:max-w-full w-auto h-auto object-contain rounded-lg shadow transition-opacity duration-700 bg-white"
                      style={{ margin: '0 auto', opacity: sizes[i]?.loaded ? 1 : 0 }}
                      onContextMenu={e => e.preventDefault()}
                      onLoad={e => setSizes(s => ({ ...s, [i]: { ...(s[i] || {}), loaded: true, w: e.target.naturalWidth, h: e.target.naturalHeight } }))}
                      onError={(event) => {
                        event.currentTarget.src = '/images/fallback.jpg';
                        setSizes(s => ({ ...s, [i]: { ...(s[i] || {}), loaded: true } }));
                      }}
                      draggable={false}
                    />
                  </picture>
                </div>
                );
              })}
            </Slider>
          </div>
        )}
        {/* Barra de progresso — apenas quando semSetasDots */}
        {semSetasDots && fotos.length > 0 && (
          <div className="mt-3 flex w-full max-w-xl flex-col items-center gap-2 px-4">
            <BarraTempo total={fotos.length} atual={currentSlide} />
            <span
              className="text-white/60 select-none"
              style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              {Math.min(currentSlide + 1, fotos.length)} / {fotos.length}
            </span>
          </div>
        )}
        {loading && <div className="text-2xl text-gray-500">Carregando...</div>}
        {!loading && fotos.length === 0 && <div className="text-2xl text-gray-500">Nenhuma foto encontrada.</div>}
      </div>
    </div>
  );
}

export function GaleriaFlipbook({ fotos = [], onFimAlbum }) {
  const flipBookRef = useRef();
  const [erro, setErro] = useState(false);

  const handleFlip = (e) => {
    if (e.data === fotos.length - 1 && onFimAlbum) {
      setTimeout(() => onFimAlbum(), 900); // pequena pausa para transição
    }
  };

  // Detecta se o flipbook está renderizando corretamente
  useEffect(() => {
    setErro(false);
    setTimeout(() => {
      if (flipBookRef.current && flipBookRef.current.pageFlip && !flipBookRef.current.pageFlip().getPageCount()) {
        setErro(true);
      }
    }, 1000);
  }, [fotos]);

  if (!fotos || fotos.length === 0) return null;
  return (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <div className="mb-2 text-sm text-gray-400 select-none text-center">
        Arraste para o lado para folhear o álbum
        <span className="ml-2 animate-bounce inline-block">👉</span>
      </div>
      {erro ? (
        <div className="text-center text-red-400 py-8">
          Não foi possível exibir o efeito de álbum analógico neste navegador/dispositivo.<br />
          Tente atualizar a página ou usar outro navegador.
        </div>
      ) : (
        <HTMLFlipBook
          ref={flipBookRef}
          width={420}
          height={600}
          size="stretch"
          minWidth={320}
          maxWidth={700}
          minHeight={400}
          maxHeight={900}
          drawShadow={true}
          showCover={false}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="mx-auto shadow-2xl rounded-2xl bg-white"
          style={{ boxShadow: '0 8px 32px #fbc2eb55', borderRadius: '1.2rem', touchAction: 'pan-y pinch-zoom' }}
        >
          {(Array.isArray(fotos) ? fotos : []).map((url, i) => (
            <div key={i} className="w-full h-full flex items-center justify-center bg-white rounded-2xl overflow-hidden">
              <img
                src={getCloudinaryOptimizedUrl(url)}
                alt={`Foto ${i + 1}`}
                className="object-cover w-full h-full rounded-2xl select-none"
                style={{ background: '#fff', maxHeight: '100%', maxWidth: '100%' }}
                draggable={false}
              />
            </div>
          ))}
        </HTMLFlipBook>
      )}
    </div>
  );
}

/* CSS extra para animação spin-slow */
/* Adicione no seu CSS global se necessário:
@keyframes spin { 100% { transform: rotate(360deg); } }
.animate-spin-slow { animation: spin 2.5s linear infinite; } */

/* CSS para animação da barra de tempo */
/* Adicione no seu CSS global:
@keyframes timer-bar { from { width: 0; } to { width: 100%; } }
.animate-timer-bar { animation: timer-bar linear forwards; } */
