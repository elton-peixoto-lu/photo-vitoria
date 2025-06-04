import { useEffect, useState, useRef } from 'react';
import GaleriaCloudinary from '../components/GaleriaCloudinary';
import { CONTATO, ActionButtons } from '../components/ContatoInfo';
import ImageWithBlur from '../components/ImageWithBlur';

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
    <div className="relative min-h-screen flex flex-col w-full">
      {/* HERO de boas-vindas com logo em grid de marca d'água */}
      <section className="relative w-full flex flex-col items-center justify-center min-h-[60vh] py-16 z-10">
        {/* Grid de logos no fundo */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none flex flex-wrap opacity-20">
          {[...Array(5)].map((_, row) => (
            <div key={row} className="flex flex-1 w-full h-1/5 justify-center items-center">
              {[...Array(6)].map((_, col) => (
                <img
                  key={col}
                  src="https://res.cloudinary.com/driuyeufs/image/upload/v1748900747/logo_xfrtze.png"
                  alt="Logo Vitória Fotografia"
                  className="w-24 md:w-32 opacity-10 mx-4 my-2"
                  style={{ filter: 'blur(0.5px)' }}
                  draggable={false}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Texto de boas-vindas centralizado */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12 px-4">
          <img
            src="https://res.cloudinary.com/driuyeufs/image/upload/v1748900747/logo_xfrtze.png"
            alt="Logo Vitória Fotografia"
            className="w-40 md:w-56 mb-6 drop-shadow-xl"
            draggable={false}
            style={{ userSelect: 'none' }}
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-pink-500 mb-4 drop-shadow-lg text-center font-sans">Bem-vindo ao universo da Vitória Fotografia</h1>
          <p className="text-lg md:text-2xl text-gray-700 font-medium text-center font-sans bg-white/70 rounded-xl px-6 py-4 shadow-lg">
            "Transformando emoções em memórias inesquecíveis."<br />
            Ensaio fotográfico, eventos, casamentos, família e muito mais — com sensibilidade, técnica e olhar artístico.
          </p>
          <a
            href="/contato"
            className="mt-8 inline-flex items-center gap-2 font-bold bg-gradient-to-r from-pink-200 via-pink-400 to-yellow-200 bg-clip-text text-transparent underline decoration-pink-300 decoration-2 underline-offset-4 hover:decoration-yellow-400 transition-all duration-300 group drop-shadow-md font-sans text-xl md:text-2xl"
            style={{ WebkitTextStroke: '0.5px #f472b6', textShadow: '0 2px 8px #fffbe9, 0 1px 2px #fbc2eb' }}
          >
            Fale com a fotógrafa
          </a>
        </div>
      </section>
      {/* Grid de fotos de destaque centralizado */}
      <section className="flex flex-col items-center justify-center w-full z-10 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-pink-400 mb-8 text-center drop-shadow">Destaques recentes</h2>
        <div className="w-full max-w-5xl flex flex-row flex-wrap items-center justify-center gap-8 md:gap-10">
          {quatro.map((foto, i) => (
            <div key={i} className="relative w-64 h-80 flex items-center justify-center">
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
    </div>
  );
}
