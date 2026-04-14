// Informações de contato centralizadas para reutilização
export const CONTATO = {
  instagram: {
    url: 'https://www.instagram.com/estudiovitoriafreitass/?igsh=MXhpcTg5MmJrc2hk#',
    user: 'estudiovitoriafreitass',
    label: 'Instagram',
  },
  whatsapp: {
    url: 'https://wa.me/5511975184864?text=Ol%C3%A1%2C%20vim%20pelo%20site%2C%20pode%20me%20ajudar%3F',
    number: '+55 11 97518-4864',
    label: 'WhatsApp',
  },
  email: {
    url: 'mailto:estudiovitoriafreitas@gmail.com',
    address: 'estudiovitoriafreitas@gmail.com',
    label: 'E-mail',
  },
};

import { FaHeart, FaRegHeart, FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import React, { useState } from 'react';

const btnBase = {
  fontFamily: "'Montserrat', sans-serif",
  fontWeight: 600,
  fontSize: '0.68rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

export function BotaoInstagram({ className = '', children }) {
  return (
    <a
      href={CONTATO.instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-200 text-pink-500 hover:border-pink-400 hover:text-pink-600 transition-all duration-300"
      style={btnBase}
    >
      <FaInstagram size={13} /> {children || CONTATO.instagram.label}
    </a>
  );
}

export function BotaoWhatsapp({ className = '', children }) {
  return (
    <a
      href={CONTATO.whatsapp.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 text-green-600 hover:border-green-400 hover:text-green-700 transition-all duration-300"
      style={btnBase}
    >
      <FaWhatsapp size={13} /> {children || CONTATO.whatsapp.label}
    </a>
  );
}

export function BotaoEmail({ className = '', children }) {
  return (
    <a
      href={CONTATO.email.url}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all duration-300"
      style={btnBase}
    >
      <FaEnvelope size={13} /> {children || CONTATO.email.label}
    </a>
  );
}

export function ActionButtons({ contatos = {} }) {
  const [liked, setLiked] = useState(false);
  return (
    <div
      className="flex items-center gap-2"
      onClick={e => e.stopPropagation()}
    >
      {/* Curtir */}
      <button
        className={`flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-md transition-all duration-200 focus:outline-none border ${
          liked
            ? 'bg-pink-500/90 border-pink-400 text-white'
            : 'bg-white/60 border-white/40 text-gray-500 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-500'
        }`}
        title={liked ? 'Descurtir' : 'Curtir'}
        aria-label={liked ? 'Descurtir' : 'Curtir'}
        onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
        type="button"
      >
        {liked ? <FaHeart size={12} className="animate-pulse" /> : <FaRegHeart size={12} />}
      </button>
      {/* WhatsApp */}
      <a
        href={contatos.whatsapp?.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-md bg-white/60 border border-white/40 text-gray-500 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-200"
        title={contatos.whatsapp?.label || 'WhatsApp'}
        aria-label="WhatsApp"
        onClick={e => e.stopPropagation()}
      >
        <FaWhatsapp size={13} />
      </a>
      {/* Instagram */}
      <a
        href={contatos.instagram?.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-md bg-white/60 border border-white/40 text-gray-500 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-500 transition-all duration-200"
        title={contatos.instagram?.label || 'Instagram'}
        aria-label="Instagram"
        onClick={e => e.stopPropagation()}
      >
        <FaInstagram size={13} />
      </a>
      {/* Email */}
      <a
        href={contatos.email?.url || '#'}
        className="flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-md bg-white/60 border border-white/40 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700 transition-all duration-200"
        title={contatos.email?.label || 'E-mail'}
        aria-label="E-mail"
        onClick={e => e.stopPropagation()}
      >
        <FaEnvelope size={12} />
      </a>
    </div>
  );
} 
