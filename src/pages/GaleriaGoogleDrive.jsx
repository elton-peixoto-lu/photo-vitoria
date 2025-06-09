import { useEffect, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const API_KEY = 'AIzaSyA-NYwhlPJe2rHyxDESuXXA6gxith--08M';

// Recebe categoria e folderId como props
export default function GaleriaGoogleDrive({ categoria, folderId }) {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFotos = async () => {
      setLoading(true);
      setFotos([]);
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType contains 'image/'&key=${API_KEY}&fields=files(id,name,thumbnailLink)`;
      const res = await fetch(url);
      const data = await res.json();
      setFotos(data.files || []);
      setLoading(false);
    };
    fetchFotos();
  }, [folderId]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: false,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3500,
    pauseOnHover: false,
    fade: true,
    cssEase: 'ease-in-out',
    appendDots: dots => (
      <div style={{ position: 'absolute', bottom: 24, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <ul style={{ margin: 0, padding: 0, display: 'flex', gap: 8 }}>{dots}</ul>
      </div>
    ),
    customPaging: i => (
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', opacity: 0.7, border: '2px solid #ec4899' }} />
    ),
    beforeChange: () => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    },
  };

  return (
    <div className="relative flex-1 min-h-screen ml-60 w-[calc(100vw-15rem)] bg-black">
      {loading && <div className="absolute inset-0 flex items-center justify-center text-white text-xl">Carregando fotos...</div>}
      {!loading && fotos.length > 0 && (
        <Slider {...settings} className="h-screen">
          {(Array.isArray(fotos) ? fotos : []).map(foto => (
            <div key={foto.id} className="w-full h-screen flex items-center justify-center">
              <img
                src={`https://drive.google.com/uc?export=view&id=${foto.id}`}
                alt={foto.name}
                className="w-full h-screen object-cover object-center select-none"
                style={{ maxWidth: '100vw', maxHeight: '100vh', background: '#111' }}
                draggable={false}
              />
            </div>
          ))}
        </Slider>
      )}
      {(!loading && fotos.length === 0) && <div className="absolute inset-0 flex items-center justify-center text-white text-xl">Nenhuma foto encontrada nesta galeria.</div>}
    </div>
  );
} 
 