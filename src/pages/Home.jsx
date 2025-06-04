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
      {/* Fundo gradiente + blur de imagem */}
      <div className="absolute inset-0 z-0 w-full h-full min-h-screen">
        <div className="w-full h-full min-h-screen absolute inset-0" style={{
          background: 'linear-gradient(135deg, #ffe4ef 0%, #fffbe9 60%, #fff 100%)',
          opacity: 0.7,
        }} />
        {quatro.length === 4 && (
          <div className="w-full h-full min-h-screen absolute inset-0 flex">
            {quatro.map((foto, i) => (
              <div key={i} style={{
                flex: 1,
                backgroundImage: `url(${foto})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(32px) brightness(0.7)',
                opacity: 0.8,
              }} />
            ))}
          </div>
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
      {/* Conteúdo principal */}
      <div className="flex flex-col items-center justify-center w-full z-10 pt-12 pb-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-pink-500 mb-4 drop-shadow-sm text-center font-sans">Bem-vindo ao universo da Vitória Fotografia</h1>
        <p className="text-lg md:text-xl text-gray-700 font-medium text-center max-w-2xl font-sans">
          "Transformando emoções em memórias inesquecíveis."
          <br />
          Ensaio fotográfico, eventos, casamentos, família e muito mais — com sensibilidade, técnica e olhar artístico.
          <br />
          <span className="block mt-6">
            <a
              href="/contato"
              className="inline-flex items-center gap-2 font-bold bg-gradient-to-r from-pink-200 via-pink-400 to-yellow-200 bg-clip-text text-transparent underline decoration-pink-300 decoration-2 underline-offset-4 hover:decoration-yellow-400 transition-all duration-300 group drop-shadow-md font-sans"
              style={{ WebkitTextStroke: '0.5px #f472b6', textShadow: '0 2px 8px #fffbe9, 0 1px 2px #fbc2eb' }}
            >
              Fale com a fotógrafa
            </a>
          </span>
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        <div className="w-full max-w-5xl flex flex-row items-center justify-center gap-6 py-8">
          {quatro.map((foto, i) => (
            <div key={i} className="relative w-1/4 h-72 flex items-center justify-center">
              <ImageWithBlur
                src={foto}
                alt={`Destaque ${i + 1}`}
                className="rounded-lg shadow-md w-full h-full object-cover"
                style={{ background: '#fff' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
