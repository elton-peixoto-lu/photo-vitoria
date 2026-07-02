import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaUserCircle } from 'react-icons/fa';
import { CONTATO } from '../components/ContatoInfo.jsx';
import SafeImageWithBlur from '../components/ImageWithBlur';
import { LOGO_URL } from '../constants';
import { loadGalleryImages } from '../localAssetsLoader';
import ServicosSection from '../components/ServicosSection';
import { useResponsive } from '../hooks/useResponsive';

const DEPOIMENTOS = [
  {
    nome: 'Ana Paula',
    texto: 'O estúdio é lindo e aconchegante! As fotos ficaram maravilhosas, recomendo demais.'
  },
  {
    nome: 'Carlos Silva',
    texto: 'Ambiente super profissional e acolhedor. Experiência incrível!'
  },
  {
    nome: 'Juliana M.',
    texto: 'Me senti em casa, e o resultado das fotos foi perfeito. Obrigada, Vitoria!'
  },
];

// Carrega fotos das galerias usando sistema híbrido
function useImagensEstudio() {
  const [fotos, setFotos] = useState([]);
  const [fotoAtual, setFotoAtual] = useState(0);
  
  useEffect(() => {
    async function carregarImagens() {
      console.log('🎨 Carregando imagens para página Estúdio...');
      
      const todasImagens = [];
      const galerias = ['casamentos', 'femininos', 'infantil', 'noivas', 'pre-weding'];
      
      // Carrega algumas imagens de cada galeria
      for (const galeria of galerias) {
        try {
          const imagens = await loadGalleryImages(galeria);
          if (imagens && imagens.length > 0) {
            // Pega até 2 imagens aleatórias de cada galeria
            const imagensAleatorias = imagens
              .sort(() => Math.random() - 0.5)
              .slice(0, 2);
            todasImagens.push(...imagensAleatorias);
          }
        } catch (error) {
          console.warn(`Erro ao carregar galeria ${galeria}:`, error);
        }
      }
      
      // Embaralha todas e pega até 12 para o grid
      const imagensFinais = todasImagens
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);
      
      setFotos(imagensFinais);
      console.log(`✅ ${imagensFinais.length} imagens carregadas para Estúdio`);
    }
    
    carregarImagens();
  }, []);
  
  // Rotaciona a imagem de fundo a cada 6 segundos
  useEffect(() => {
    if (fotos.length <= 1) return;
    
    const timer = setInterval(() => {
      setFotoAtual(prev => (prev + 1) % fotos.length);
    }, 6000);
    
    return () => clearInterval(timer);
  }, [fotos]);
  
  return { fotos, fotoAtual };
}

export default function Estudio() {
  const [depoIndex, setDepoIndex] = React.useState(0);
  const { fotos: imagensEstudio, fotoAtual } = useImagensEstudio();
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDepoIndex(i => (i + 1) % DEPOIMENTOS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col w-full">
      {/* Fundo gradiente + blur de imagem */}
      <div className="absolute inset-0 z-0 w-full h-full min-h-screen">
        <div className="w-full h-full min-h-screen absolute inset-0" style={{
          background: 'linear-gradient(135deg, #ffe4ef 0%, #fffbe9 60%, #fff 100%)',
          opacity: 0.7,
        }} />
        {imagensEstudio.length > 0 && (
          <div className="w-full h-full min-h-screen absolute inset-0 transition-all duration-1000" style={{
            backgroundImage: `url(${imagensEstudio[fotoAtual]?.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(32px) brightness(0.7)',
            opacity: 0.8,
          }} />
        )}
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
        <div className="w-full max-w-7xl flex-1 flex flex-col items-center justify-center px-4 md:px-8">
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            {/* Descrição sobre o estúdio */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, type: 'spring' }}
              className="w-full text-center mb-4"
            >
              <p className="text-lg md:text-xl text-pink-300 mb-2 font-medium font-sans drop-shadow-sm">
                <span className="text-3xl md:text-4xl text-pink-200 font-bold mr-2 align-top">"</span>
                Nosso estúdio é um espaço acolhedor, pensado para que você se sinta à vontade e viva uma experiência fotográfica única. Aqui, cada detalhe é preparado com carinho para eternizar seus melhores momentos!
                <span className="text-3xl md:text-4xl text-pink-200 font-bold ml-2 align-bottom">"</span>
              </p>
              <a
                href="/contato"
                className="inline-block underline text-pink-200 hover:text-pink-400 transition-all text-xl font-bold decoration-pink-200 decoration-2 underline-offset-4 px-3 py-1 rounded-lg shadow-sm hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-300 font-sans"
              >
                "Venha conhecer nosso estúdio!"
              </a>
            </motion.div>
            {/* Grid de fotos, mapa e depoimentos */}
            {imagensEstudio.length > 0 && (
              <div className="flex-1 flex flex-col justify-center w-full">
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 max-w-7xl mx-auto">
                  {imagensEstudio.slice(0, 8).map((foto, i) => (
                    <div className="relative" key={`estudio-${i}`}>
                      <SafeImageWithBlur
                        src={foto?.url}
                        fallback="/images/fallback.avif"
                        alt={`Imagem Estúdio ${i + 1}`}
                        className="rounded-lg shadow-md w-full h-48 object-cover opacity-80 transition duration-500 hover:opacity-100 hover:scale-105"
                      />
                      <div className="absolute inset-0 z-20 pointer-events-none select-none">
                        {[...Array(3)].map((_, j) => (
                          <img
                            key={j}
                            src={LOGO_URL}
                            alt="Marca d'água logo"
                            className="absolute opacity-10 w-12 md:w-20"
                            style={{
                              top: `${20 + 25 * j}%`,
                              left: `${j % 2 === 0 ? 10 : 60}%`,
                              transform: `rotate(${j % 2 === 0 ? 8 : -12}deg)`
                            }}
                            draggable={false}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mapa centralizado verticalmente */}
                <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto mb-8 rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    title="Mapa do Estúdio"
                    src="https://www.google.com/maps?q=Estr.+do+Carneiro,+2923+-+Jardim+Sampaio+Vidal,+Mauá+-+SP,+09330-550&output=embed"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <div className="bg-white text-gray-700 p-2 text-center font-semibold">Endereço: Estr. do Carneiro, 2923 - Jardim Sampaio Vidal, Mauá - SP, 09330-550</div>
                </div>
                {/* Depoimentos centralizados */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200"
                >
                  <div className="flex flex-col items-center gap-3">
                    <FaUserCircle className="text-3xl text-pink-200 mt-1" />
                    <span className="font-bold text-gray-700 mr-2">{DEPOIMENTOS[depoIndex].nome}</span>
                    <span className="text-gray-700 italic">{DEPOIMENTOS[depoIndex].texto}</span>
                    <button className="mt-2 flex items-center group" tabIndex={-1} aria-label="Curtir">
                      <FaHeart className="text-gray-300 group-hover:text-pink-400 transition" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Seção de Serviços */}
      <div className="relative z-10 bg-gradient-to-b from-white/90 to-gray-50/90">
        <ServicosSection />
      </div>
    </div>
  );
} 
