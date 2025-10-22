import { useEffect, useState } from 'react';
import GaleriaCloudinary from '../components/GaleriaCloudinary';
import { CONTATO } from '../components/ContatoInfo';
import SafeImageWithBlur from '../components/ImageWithBlur';
import { FaImages } from 'react-icons/fa';
import { LOGO_URL } from '../constants';
import { loadGalleryImages } from '../localAssetsLoader';
import { gerarUrlWhatsApp, MENSAGENS_WHATSAPP } from '../utils/whatsappUtils';
import { useResponsive } from '../hooks/useResponsive';

// export default function Home() {
//   return null;
// }

export default function Home() {
  const [fotosDestaque, setFotosDestaque] = useState([]);
  const { columnsForGallery, isMobile, isDesktop } = useResponsive();

  // Todas as galerias disponíveis
  const galerias = [
    { key: 'casamentos', label: 'Casamentos', url: '/galeria-casamentos' },
    { key: 'infantil', label: 'Infantil', url: '/galeria-infantil' },
    { key: 'femininos', label: 'Femininos', url: '/galeria-femininos' },
    { key: 'pre-weding', label: 'Pre-Wedding', url: '/galeria-pre-weding' },
    { key: 'noivas', label: 'Noivas', url: '/galeria-noivas' }
  ];

  // Carrega 1 imagem aleatória de cada galeria
  useEffect(() => {
    async function carregarImagensDestaque() {
      console.log('🏠 Carregando imagens de destaque para Home...');
      
      const imagensDestaque = [];
      
      for (const galeria of galerias) {
        try {
          const imagens = await loadGalleryImages(galeria.key);
          
          if (imagens && imagens.length > 0) {
            // Seleciona uma imagem aleatória da galeria
            const imagemAleatoria = imagens[Math.floor(Math.random() * imagens.length)];
            
            imagensDestaque.push({
              ...imagemAleatoria,
              galeria: galeria.key,
              galeriaLabel: galeria.label,
              galeriaUrl: galeria.url
            });
            
            console.log(`✅ Imagem selecionada da galeria ${galeria.label}`);
          } else {
            console.warn(`⚠️ Nenhuma imagem encontrada na galeria ${galeria.label}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao carregar galeria ${galeria.label}:`, error);
        }
      }
      
      setFotosDestaque(imagensDestaque);
      console.log(`🎉 ${imagensDestaque.length} imagens de destaque carregadas!`);
    }
    
    carregarImagensDestaque();
  }, []);


  // Função para obter sempre 4 imagens para exibir (completa com repetições se necessário)
  function get4ImagensDestaque() {
    if (fotosDestaque.length === 0) return [];
    
    const imagens = [];
    for (let i = 0; i < 4; i++) {
      const index = i % fotosDestaque.length;
      imagens.push(fotosDestaque[index]);
    }
    return imagens;
  }

  return (
    <div className="relative min-h-screen flex flex-col w-full md:ml-40">
      {/* Botão flutuante para Galeria no mobile */}
      <a
        href="/galeria"
        className="fixed bottom-6 right-6 z-[90] w-16 h-16 flex items-center justify-center rounded-full bg-pink-500 text-white text-3xl shadow-lg drop-shadow-lg md:hidden hover:bg-pink-600 transition-all"
        aria-label="Ir para Galeria"
      >
        <FaImages />
      </a>
      {/* Fundo blur absoluto com uma das fotos de destaque */}
      {fotosDestaque[galeriaAtual] && (
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none">
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${fotosDestaque[galeriaAtual]?.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(32px) brightness(0.7)',
              opacity: 0.7,
            }}
            className="w-full h-full transition-all duration-1000"
          />
        </div>
      )}
      {/* HERO de boas-vindas com logo em grid de marca d'água */}
      <section className="relative w-full flex flex-col items-center justify-center min-h-[50vh] py-8 md:py-16 z-10">
        {/* Grid de logos no fundo, menos logos no mobile */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none flex flex-col opacity-20">
          {[...Array(3)].map((_, row) => (
            <div key={row} className="flex flex-1 w-full justify-center items-center">
              {[...Array(3)].map((_, col) => (
                <img
                  key={col}
                  src={LOGO_URL}
                  alt="Logo Vitória Fotografia"
                  className="w-16 md:w-24 opacity-10 mx-2 my-1"
                  draggable={false}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Texto de boas-vindas centralizado */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-8 px-2 md:py-12 md:px-4">
          <img
            src={LOGO_URL}
            alt="Logo Vitória Fotografia"
            className="w-28 md:w-40 mb-4 md:mb-6 drop-shadow-xl"
            draggable={false}
            style={{ userSelect: 'none' }}
          />
          <h1 className="text-2xl md:text-5xl font-extrabold text-pink-500 mb-3 md:mb-4 drop-shadow-lg text-center font-sans">Bem-vindo ao universo da Vitória Fotografia</h1>
          <p className="text-base md:text-2xl text-gray-700 font-medium text-center font-sans bg-white/70 rounded-xl px-3 py-3 md:px-6 md:py-4 shadow-lg">
            "Transformando emoções em memórias inesquecíveis."<br />
            Ensaio fotográfico, eventos, casamentos, família e muito mais — com sensibilidade, técnica e olhar artístico.
          </p>
          <a
            href="/contato"
            className="mt-6 md:mt-8 inline-flex items-center gap-2 font-bold bg-gradient-to-r from-pink-200 via-pink-400 to-yellow-200 bg-clip-text text-transparent underline decoration-pink-300 decoration-2 underline-offset-4 hover:decoration-yellow-400 transition-all duration-300 group drop-shadow-md font-sans text-lg md:text-2xl min-w-[140px] py-3 px-4 rounded-lg"
            style={{ WebkitTextStroke: '0.5px #f472b6', textShadow: '0 2px 8px #fffbe9, 0 1px 2px #fbc2eb' }}
          >
            Fale com a fotógrafa
          </a>
        </div>
      </section>
      {/* Seção das galerias com imagem principal e 4 miniaturas */}
      <section className="flex flex-col items-center justify-center w-full z-10 py-8 md:py-12">
        <h2 className="text-xl md:text-3xl font-bold text-pink-400 mb-6 md:mb-8 text-center drop-shadow">
          Explore Nossas Galerias
        </h2>
        
        <div className="w-full max-w-6xl mx-auto px-4">
          {fotosDestaque.length > 0 ? (
            <>
              {/* Miniaturas das galerias - grid responsivo */}
              <div 
                className="grid gap-4 md:gap-6"
                style={{ gridTemplateColumns: `repeat(${Math.min(columnsForGallery, 4)}, 1fr)` }}
              >
                {get4ImagensDestaque().map((foto, i) => (
                  <a
                    key={`miniatura-${foto?.galeria}-${i}`}
                    href={foto?.galeriaUrl || `/galeria-${foto?.galeria}`}
                    className="group relative w-full rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white/50 block"
                  >
                    {/* Container da miniatura - também mostra imagem inteira */}
                    <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100">
                      <SafeImageWithBlur
                        src={foto?.url}
                        fallback="/images/fallback.avif"
                        alt={`${foto?.galeriaLabel} - Preview`}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: '#fefefe' }}
                      />
                      
                      {/* Label da galeria */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="p-3">
                          <p className="text-white text-xs md:text-sm font-bold truncate">
                            {foto?.galeriaLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              
              {/* Labels das categorias (botões de navegação) */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-8">
                {galerias.map((galeria) => (
                  <a
                    key={galeria.key}
                    href={galeria.url}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 no-underline bg-white/80 text-pink-500 hover:bg-pink-500 hover:text-white hover:shadow-lg hover:scale-105 shadow"
                  >
                    {galeria.label}
                  </a>
                ))}
              </div>
            </>
          ) : (
            /* Loading state */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-pink-400 text-lg">Carregando galerias...</p>
            </div>
          )}
        </div>
      </section>
      {/* Balão de incentivo ao WhatsApp */}
      <div className="w-full flex justify-center mb-4 z-20">
        <a
          href={gerarUrlWhatsApp(MENSAGENS_WHATSAPP.home)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative bg-gradient-to-r from-pink-100 via-yellow-50 to-pink-50 border border-pink-200 rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3 hover:scale-105 transition-all duration-300 group"
          style={{ maxWidth: 420 }}
          aria-label="Fale no WhatsApp e ganhe desconto"
        >
          <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-bold mr-2 shadow-sm border border-green-200">WhatsApp</span>
          <span className="text-pink-600 font-semibold text-base md:text-lg">Me mande um oi e poderá ganhar <span className="text-pink-500 font-extrabold">até 10%</span></span>
        </a>
      </div>
    </div>
  );
}
