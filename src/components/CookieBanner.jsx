import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setShow(true);
  }, []);

  function handleAccept() {
    localStorage.setItem('cookie_consent', 'accepted');
    setShow(false);
  }

  // Futuro: função para abrir modal de ajustes
  function handleAdjust() {
    alert('Em breve você poderá ajustar suas preferências de cookies.');
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[200] flex justify-center items-end pointer-events-none">
      <div className="pointer-events-auto bg-white/95 border border-pink-200 shadow-xl rounded-t-2xl px-6 py-4 mb-2 flex flex-col md:flex-row items-center gap-3 max-w-2xl w-full mx-auto animate-fade-in">
        <span className="text-gray-700 text-sm md:text-base flex-1 text-center md:text-left">
          Este site utiliza cookies e ferramentas de terceiros para melhorar sua experiência. Saiba mais em nossa <Link to="/lgpd" className="underline text-pink-500 hover:text-pink-700">Política de Privacidade</Link>.
        </span>
        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            onClick={handleAccept}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-5 py-2 rounded-lg shadow transition-all text-sm md:text-base"
          >
            Aceitar
          </button>
          <button
            onClick={handleAdjust}
            className="bg-white border border-pink-300 text-pink-500 hover:bg-pink-50 font-bold px-4 py-2 rounded-lg shadow transition-all text-sm md:text-base"
          >
            Ajustar preferências
          </button>
        </div>
      </div>
    </div>
  );
} 
