import { motion } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaInstagram } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { CONTATO, BotaoInstagram, BotaoWhatsapp, BotaoEmail } from '../components/ContatoInfo.jsx';
import ImageWithBlur from '../components/ImageWithBlur';

function useGridFotos() {
  const [fotos, setFotos] = useState([]);
  useEffect(() => {
    async function fetchFotos() {
      let grid = [];
      const apiUrl = import.meta.env.VITE_API_URL;
      try {
        const destaques = await fetch(`${apiUrl}/galeria/destaques`).then(r => r.json());
        grid = [...destaques];
        const faltam = 4 - grid.length;
        if (faltam > 0) {
          const albuns = ['casamentos', 'infantil', 'femininos', 'pre-weding'];
          for (let album of albuns) {
            if (grid.length >= 4) break;
            const albumFotos = await fetch(`${apiUrl}/galeria/${album}`).then(r => r.json());
            for (let f of albumFotos) {
              if (!grid.includes(f)) {
                grid.push(f);
                if (grid.length >= 4) break;
              }
            }
          }
        }
      } catch {
        // fallback vazio
      }
      setFotos(grid.slice(0, 4));
    }
    fetchFotos();
  }, []);
  return fotos;
}

export default function Contato() {
  const [formStatus, setFormStatus] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  // Pergunta e resposta do captcha
  const captchaQuestion = 'Quanto é 3 + 4?';
  const captchaAnswer = '7';

  const gridFotos = useGridFotos();
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    if (gridFotos.length > 1) {
      const timer = setInterval(() => {
        setBgIndex(i => (i + 1) % gridFotos.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [gridFotos]);

  return (
    <div className="relative min-h-screen flex flex-col w-full">
      {/* Fundo gradiente + blur de imagem */}
      <div className="absolute inset-0 z-0 w-full h-full min-h-screen">
        <div className="w-full h-full min-h-screen absolute inset-0" style={{
          background: 'linear-gradient(135deg, #ffe4ef 0%, #fffbe9 60%, #fff 100%)',
          opacity: 0.7,
        }} />
        {gridFotos.length > 0 && (
          <div className="w-full h-full min-h-screen absolute inset-0" style={{
            backgroundImage: `url(${gridFotos[bgIndex]})`,
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
            src="https://res.cloudinary.com/driuyeufs/image/upload/v1748900747/logo_xfrtze.png"
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
                src="https://res.cloudinary.com/driuyeufs/image/upload/v1748900747/logo_xfrtze.png"
                alt="Logo Vitória Fotografia"
                className="w-40 h-auto md:w-56 drop-shadow-lg"
                draggable={false}
                style={{ userSelect: 'none' }}
              />
            </motion.div>
            {/* Após o título/logo e antes do restante do conteúdo: */}
            {gridFotos.length > 0 && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 max-w-7xl mx-auto">
                {gridFotos.map((foto, i) => (
                  <div className="relative" key={i}>
                    <ImageWithBlur src={foto} alt={`Destaque ${i + 1}`} className="rounded-lg shadow-md w-full h-48 object-cover" />
                    <div className="absolute inset-0 z-20 pointer-events-none select-none">
                      {[...Array(3)].map((_, j) => (
                        <img
                          key={j}
                          src="https://res.cloudinary.com/driuyeufs/image/upload/v1748900747/logo_xfrtze.png"
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
            {/* Spacer flexível para centralização vertical */}
            <div className="flex-1" />
            {/* Formulário de contato */}
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="flex flex-col gap-5 w-full max-w-3xl bg-white/90 rounded-xl shadow-md p-8 mx-auto"
              onSubmit={e => {
                e.preventDefault();
                if (captchaInput.trim() !== captchaAnswer) {
                  setCaptchaError('Resposta incorreta. Por favor, tente novamente.');
                  return;
                }
                setCaptchaError('');
                setFormStatus('Mensagem enviada! (simulação)');
                // Aqui você pode implementar o envio real do formulário
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
              <button type="submit" className="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-all">Enviar mensagem</button>
              {formStatus && <div className="text-green-600 font-bold mt-2">{formStatus}</div>}
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
} 
