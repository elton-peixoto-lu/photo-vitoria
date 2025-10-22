import { motion } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaInstagram } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { CONTATO, BotaoInstagram, BotaoWhatsapp, BotaoEmail } from '../components/ContatoInfo.jsx';
import SafeImageWithBlur from '../components/ImageWithBlur';
import { LOGO_URL } from '../constants';
import { loadGalleryImages } from '../localAssetsLoader';
import { useResponsive } from '../hooks/useResponsive';

// Hook para carregar imagens da galeria usando sistema híbrido
function useImagensContato() {
  const [fotos, setFotos] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  
  useEffect(() => {
    async function carregarImagens() {
      console.log('📧 Carregando imagens para página Contato...');
      
      const todasImagens = [];
      const galerias = ['casamentos', 'femininos', 'noivas', 'infantil', 'pre-weding'];
      
      // Carrega 1 imagem de cada galeria
      for (const galeria of galerias) {
        try {
          const imagens = await loadGalleryImages(galeria);
          if (imagens && imagens.length > 0) {
            // Pega 1 imagem aleatória de cada galeria
            const imagemAleatoria = imagens[Math.floor(Math.random() * imagens.length)];
            todasImagens.push({
              ...imagemAleatoria,
              galeria: galeria
            });
          }
        } catch (error) {
          console.warn(`Erro ao carregar galeria ${galeria}:`, error);
        }
      }
      
      setFotos(todasImagens);
      console.log(`✅ ${todasImagens.length} imagens carregadas para Contato`);
    }
    
    carregarImagens();
  }, []);
  
  // Rotaciona imagem de fundo a cada 5 segundos
  useEffect(() => {
    if (fotos.length <= 1) return;
    
    const timer = setInterval(() => {
      setBgIndex(prev => (prev + 1) % fotos.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [fotos]);
  
  return { fotos, bgIndex };
}

export default function Contato() {
  const [formStatus, setFormStatus] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  // Pergunta e resposta do captcha
  const captchaQuestion = 'Quanto é 3 + 4?';
  const captchaAnswer = '7';

  const { fotos: imagensContato, bgIndex } = useImagensContato();

  const formspreeId = import.meta.env.VITE_FORMSPREE_ID;
  const formAction = `https://formspree.io/${formspreeId}`;
  const [formEnviado, setFormEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const navigate = window.location ? (path => window.location.assign(path)) : () => {};

  return (
    <div className="relative min-h-screen flex flex-col w-full">
      {/* Fundo gradiente + blur de imagem */}
      <div className="absolute inset-0 z-0 w-full h-full min-h-screen">
        <div className="w-full h-full min-h-screen absolute inset-0" style={{
          background: 'linear-gradient(135deg, #ffe4ef 0%, #fffbe9 60%, #fff 100%)',
          opacity: 0.7,
        }} />
        {imagensContato.length > 0 && (
          <div className="w-full h-full min-h-screen absolute inset-0 transition-all duration-1000" style={{
            backgroundImage: `url(${imagensContato[bgIndex]?.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(32px) brightness(0.7)',
            opacity: 0.8,
          }} />
        )}
      </div>
      
      {/* Marcas d'água decorativas sobre o conteúdo */}
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
            {/* Logo imagem */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, type: 'spring' }}
              className="mb-8 mt-2 select-none flex justify-center relative"
            >
              <img
                src={LOGO_URL}
                alt="Logo Vitória Fotografia"
                className="w-40 h-auto md:w-56 drop-shadow-lg"
                draggable={false}
                style={{ userSelect: 'none' }}
              />
            </motion.div>
            
            {/* Grid de fotos das galerias */}
            {imagensContato.length > 0 && (
              <div className="w-full mb-8">
                <h3 className="text-lg md:text-xl font-bold text-pink-400 mb-4 text-center">
                  Nosso Portfólio
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto">
                  {imagensContato.map((foto, i) => (
                    <div className="relative group" key={`contato-${foto.galeria}-${i}`}>
                      <SafeImageWithBlur
                        src={foto?.url}
                        fallback="/images/fallback.avif"
                        alt={`${foto.galeria} - ${i + 1}`}
                        className="rounded-lg shadow-md w-full h-48 object-cover transition duration-500 hover:shadow-lg hover:scale-105"
                      />
                      
                      {/* Label da galeria */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="p-2">
                          <p className="text-white text-xs font-bold capitalize">
                            {foto.galeria.replace('-', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Marca d'água sutil */}
                      <div className="absolute inset-0 z-20 pointer-events-none select-none">
                        <img
                          src={LOGO_URL}
                          alt="Marca d'água logo"
                          className="absolute opacity-5 w-16 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12"
                          draggable={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Breve história */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="max-w-3xl w-full text-center text-lg md:text-xl text-pink-300 mb-8 mx-auto font-medium font-sans drop-shadow-sm"
            >
              <span className="text-3xl md:text-4xl text-pink-200 font-bold mr-2 align-top">"</span>
              Olá! Sou Vitória, apaixonada por eternizar momentos especiais através da fotografia.<br />
              <span className="block mt-2">
                <span className="font-semibold text-pink-400">1.</span> Agende seu ensaio<br />
                <span className="font-semibold text-pink-400">2.</span> Tire dúvidas<br />
                <span className="font-semibold text-pink-400">3.</span> Conheça mais sobre meu trabalho
              </span>
              <br />Será um prazer registrar sua história!
              <span className="text-3xl md:text-4xl text-pink-200 font-bold ml-2 align-bottom">"</span>
            </motion.p>
            
            {/* Contatos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="flex flex-wrap w-full justify-center gap-6 mb-10"
            >
              <BotaoWhatsapp className="w-full flex-[1_1_0] px-8 py-4 rounded-lg bg-green-500 text-white text-xl font-bold shadow-lg hover:bg-green-600 transition-all justify-center min-w-[220px] font-sans" />
              <BotaoEmail className="w-full flex-[1_1_0] px-8 py-4 rounded-lg bg-pink-400 text-white text-xl font-bold shadow-lg hover:bg-pink-500 transition-all justify-center min-w-[220px] font-sans" />
              <BotaoInstagram className="w-full flex-[1_1_0] px-8 py-4 rounded-lg bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-400 text-white text-xl font-bold shadow-lg hover:from-yellow-400 hover:to-pink-500 transition-all justify-center min-w-[220px] font-sans" />
            </motion.div>
            
            {/* Balão de incentivo ao WhatsApp */}
            <div className="w-full flex justify-center mb-4">
              <div className="relative bg-gradient-to-r from-pink-100 via-yellow-50 to-pink-50 border border-pink-200 rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3 animate-bounce-slow hover:animate-none transition-all duration-300" style={{ maxWidth: 420 }}>
                <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-bold mr-2 shadow-sm border border-green-200">WhatsApp</span>
                <span className="text-pink-600 font-semibold text-base md:text-lg">Me mande um oi e poderá ganhar <span className="text-pink-500 font-extrabold">até 10%</span></span>
              </div>
            </div>
            
            {/* Spacer flexível para centralização vertical */}
            <div className="flex-1" />
            
            {/* Formulário de contato */}
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="flex flex-col gap-5 w-full max-w-3xl bg-white/90 rounded-xl shadow-md p-8 mx-auto"
              onSubmit={async e => {
                e.preventDefault();
                setErroEnvio('');
                if (captchaInput.trim() !== captchaAnswer) {
                  setCaptchaError('Resposta incorreta. Por favor, tente novamente.');
                  return;
                }
                setCaptchaError('');
                setEnviando(true);
                const data = new FormData(e.target);
                try {
                  const res = await fetch(formAction, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' },
                  });
                  if (res.ok) {
                    setFormEnviado(true);
                    setTimeout(() => navigate('/obrigado'), 500);
                  } else {
                    setErroEnvio('Erro ao enviar. Tente novamente mais tarde.');
                  }
                } catch {
                  setErroEnvio('Erro ao enviar. Tente novamente mais tarde.');
                } finally {
                  setEnviando(false);
                }
              }}
            >
              <h2 className="text-xl font-bold text-pink-500 mb-2">Ou envie sua mensagem:</h2>
              <input type="text" name="nome" placeholder="Seu nome" required className="rounded border border-pink-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
              <input type="email" name="email" placeholder="Seu e-mail" required className="rounded border border-pink-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
              <textarea name="mensagem" placeholder="Sua mensagem" required rows={4} className="rounded border border-pink-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
              
              {/* Captcha de pergunta simples */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">{captchaQuestion}</label>
                <input
                  type="text"
                  name="captcha"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  required
                  className="rounded border border-pink-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  autoComplete="off"
                />
                {captchaError && <span className="text-xs text-red-500 mt-1">{captchaError}</span>}
              </div>
              
              {/* LGPD consentimento */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" required id="lgpd" className="accent-pink-400" />
                <label htmlFor="lgpd">Li e concordo com a <a href="/lgpd" className="underline text-pink-500 hover:text-pink-700" target="_blank" rel="noopener noreferrer">Política de Privacidade (LGPD)</a>.</label>
              </div>
              
              <button type="submit" className="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-all" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar mensagem'}
              </button>
              {erroEnvio && <div className="text-red-600 font-bold mt-2">{erroEnvio}</div>}
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}
