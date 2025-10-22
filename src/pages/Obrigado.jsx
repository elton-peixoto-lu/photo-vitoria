import React from 'react';
import { LOGO_URL } from '../constants';
import { Link } from 'react-router-dom';

export default function Obrigado() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] px-4 py-16 relative md:ml-40">
      {/* Fundo decorativo com logo em marca d'água */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none flex flex-col opacity-10">
        {[...Array(3)].map((_, row) => (
          <div key={row} className="flex flex-1 w-full justify-center items-center">
            {[...Array(3)].map((_, col) => (
              <img
                key={col}
                src={LOGO_URL}
                alt="Logo Vitória Fotografia"
                className="w-24 md:w-32 mx-2 my-1"
                draggable={false}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-xl mx-auto py-12 px-4 bg-white/80 rounded-2xl shadow-xl border border-pink-100">
        <img
          src={LOGO_URL}
          alt="Logo Vitória Fotografia"
          className="w-32 md:w-40 mb-6 drop-shadow-xl"
          draggable={false}
          style={{ userSelect: 'none' }}
        />
        <h1 className="text-3xl md:text-4xl font-extrabold text-pink-500 mb-4 text-center font-sans drop-shadow">Obrigado pelo contato!</h1>
        <p className="text-lg md:text-xl text-gray-700 font-medium text-center mb-6 font-sans">
          Sua mensagem foi enviada com sucesso.<br />
          Em breve entrarei em contato com você.
        </p>
        <Link
          to="/"
          className="inline-block mt-4 px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full shadow transition-all text-lg"
        >
          Voltar para a Home
        </Link>
      </div>
    </div>
  );
} 
