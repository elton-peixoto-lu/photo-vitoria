import { useEffect, useState, useRef } from 'react';
import GaleriaCloudinary from '../components/GaleriaCloudinary';
import { CONTATO } from '../components/ContatoInfo';
import ImageWithBlur from '../components/ImageWithBlur';
import { FaImages } from 'react-icons/fa';
import { LOGO_URL } from '../constants';

// export default function Home() {
//   return null;
// }

export default function Home() {
  const [fotos, setFotos] = useState([]);
  const [quatro, setQuatro] = useState([]);
  const intervalRef = useRef();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/galeria/destaques`)
      .then(res => res.json())
      .then(arr => {
        setFotos(arr);
        if (arr.length >= 4) {
          setQuatro(getRandomQuatro(arr));
        }
      });
  }, []);

  useEffect(() => {
    if (fotos.length < 4) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setQuatro(getRandomQuatro(fotos));
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fotos]);

  function getRandomQuatro(arr) {
    if (arr.length < 4) return arr;
    let idxs = [];
    while (idxs.length < 4) {
      let idx = Math.floor(Math.random() * arr.length);
      if (!idxs.includes(idx)) idxs.push(idx);
    }
    return idxs.map(i => arr[i]);
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
      {quatro[0] && (
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none">
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${quatro[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(32px) brightness(0.7)',
              opacity: 0.7,
            }}
            className="w-full h-full"
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
      {/* Grid de fotos de destaque centralizado e responsivo */}
      <section className="flex flex-col items-center justify-center w-full z-10 py-8 md:py-12">
        <h2 className="text-xl md:text-3xl font-bold text-pink-400 mb-6 md:mb-8 text-center drop-shadow">Destaques recentes</h2>
        <div className="w-full max-w-4xl md:max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-2 md:px-8">
          {quatro.map((foto, i) => (
            <div key={i} className="relative w-full h-60 flex items-center justify-center">
              <ImageWithBlur
                src={foto}
                alt={`Destaque ${i + 1}`}
                className="rounded-xl shadow-lg w-full h-full object-cover"
                style={{ background: '#fff' }}
              />
            </div>
          ))}
        </div>
      </section>
      {/* Balão de incentivo ao WhatsApp */}
      <div className="w-full flex justify-center mb-4 z-20">
        <a
          href="https://wa.me/5511975184864?text=Ol%C3%A1%2C%20vim%20pelo%20site%2C%20pode%20me%20ajudar%3F"
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
