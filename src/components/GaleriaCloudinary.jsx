import { useEffect, useState, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaHeart, FaRegHeart, FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import BaloesAnimados from './BaloesAnimados';
import { getGaleriaCache, setGaleriaCache } from '../cacheGalerias';
import { ActionButtons, CONTATO } from './ContatoInfo';
import HTMLFlipBook from 'react-pageflip';
import React from 'react';
import { LOGO_URL } from '../constants';
import { getCloudinaryOptimizedUrl } from '../cloudinaryUtils';

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

  // Fetch das fotos (sempre igual)
  useEffect(() => {
    if (fotos.length > 0) setPrevFotos(fotos);
    setLoading(true);
    setFadeOut(true);
    clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => setFadeOut(false), 200);
    // Tenta usar o cache primeiro
    const cache = getGaleriaCache(pasta);
    if (cache) {
      setFotos(cache);
      setLoading(false);
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/galeria/${encodeURIComponent(pasta)}`)
      .then(res => res.json())
      .then(data => {
        const imagens = data.images || [];
        setFotos(imagens);
        setGaleriaCache(pasta, imagens);
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
    console.log('Fotos mobile:', fotos);
    // Mobile: lista de miniaturas
    return (
      <div className="w-full flex flex-col items-center justify-center gap-6 py-6 px-0">
        {fotos.map((foto, i) => (
          <div key={i} className="w-full flex flex-col items-center justify-center">
            <img
              src={getCloudinaryOptimizedUrl(foto.url)}
              alt={`Foto ${i + 1}`}
              className="w-full max-w-full h-auto object-contain rounded-lg shadow bg-white border-2 border-lime-400"
              draggable={false}
            />
            <div className="flex gap-3 mt-2 justify-center">
              <ActionButtons contatos={CONTATO} className="text-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (modoGridOnly) {
    return (
      <>
        {fotos.map((foto, i) => (
          <div key={i} className="relative w-full h-64 flex items-center justify-center">
            <img
              src={getCloudinaryOptimizedUrl(foto.url)}
              alt={`Foto ${i + 1}`}
              className="rounded-lg shadow-md w-full h-full object-cover"
              draggable={false}
              style={{ background: '#fff' }}
            />
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

  // Adiciona função utilitária para gerar URL borrada do Cloudinary
  function getCloudinaryBlurUrl(url) {
    if (!url) return '';
    // Exemplo: insere parâmetros de blur, qualidade e largura na URL do Cloudinary
    // Suporta URLs do tipo: https://res.cloudinary.com/<cloud>/image/upload/v123/arquivo.jpg
    return url.replace('/upload/', '/upload/e_blur:1000,q_10,w_40/');
  }

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fundo blur cobre toda a área do conteúdo */}
      {fotos.length > 0 && (
        <div className="absolute inset-0 z-0">
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${fotos[currentSlide || 0].url})`,
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
          <Slider
            ref={sliderRef}
            {...settings}
            autoplay={semSetasDots}
            autoplaySpeed={3000}
            className="w-full h-[60vw] max-h-[70vh] md:min-h-[400px] md:max-h-screen"
          >
            {fotos.map((foto, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row items-center justify-center w-full h-auto min-h-[200px] md:min-h-[400px] md:max-h-screen relative group px-2 py-4"
                tabIndex={0}
              >
                {/* Blur up: imagem borrada de fundo */}
                <img
                  src={getCloudinaryOptimizedUrl(getCloudinaryBlurUrl(foto.url))}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 transition-opacity duration-500"
                  style={{ opacity: sizes[i]?.loaded ? 0 : 1, zIndex: 1 }}
                  aria-hidden="true"
                  draggable={false}
                />
                {/* Imagem real com fade */}
                <img
                  src={getCloudinaryOptimizedUrl(foto.url)}
                  alt={`Foto ${i + 1}`}
                  className="relative z-10 max-h-[50vh] max-w-[90vw] md:max-h-[80vh] md:max-w-full w-auto h-auto object-contain rounded-lg shadow border-2 border-lime-400 transition-opacity duration-700 bg-white"
                  style={{ margin: '0 auto', opacity: sizes[i]?.loaded ? 1 : 0 }}
                  onContextMenu={e => e.preventDefault()}
                  onLoad={e => setSizes(s => ({ ...s, [i]: { ...(s[i] || {}), loaded: true, w: e.target.naturalWidth, h: e.target.naturalHeight } }))}
                  draggable={false}
                />
                {/* Botões de ação: abaixo da imagem no mobile, centralizados sobre a foto no desktop */}
                <div className="flex gap-3 mt-3 md:mt-0 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:z-30">
                  <ActionButtons
                    contatos={CONTATO}
                    className="text-2xl md:text-3xl"
                  />
                </div>
                {/* Marcas d'água visuais sobre a foto, espalhadas (desktop apenas) */}
                <div className="absolute inset-0 z-20 pointer-events-none select-none hidden md:block">
                  {[...Array(7)].map((_, j) => (
                    <img
                      key={j}
                      src={LOGO_URL}
                      alt="Marca d'água logo"
                      className="absolute opacity-10 w-24 md:w-32"
                      style={{
                        top: `${10 + 12 * j}%`,
                        left: `${j % 2 === 0 ? 5 : 60}%`,
                        transform: `rotate(${j % 2 === 0 ? 8 : -12}deg)`
                      }}
                      draggable={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Slider>
        )}
        {/* Barra de tempo status embaixo do carrossel, colada */}
        {semSetasDots && fotos.length > 0 && (
          <BarraTempo total={fotos.length} atual={currentSlide} />
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
          {fotos.map((url, i) => (
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
