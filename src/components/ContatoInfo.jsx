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

export function BotaoInstagram({ className = '', children }) {
  return (
    <a
      href={CONTATO.instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 ${className}`}
    >
      <FaInstagram className="text-2xl" /> {children || CONTATO.instagram.label}
    </a>
  );
}

export function BotaoWhatsapp({ className = '', children }) {
  return (
    <a
      href={CONTATO.whatsapp.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 ${className}`}
    >
      <FaWhatsapp className="text-2xl" /> {children || CONTATO.whatsapp.label}
    </a>
  );
}

export function BotaoEmail({ className = '', children }) {
  return (
    <a
      href={CONTATO.email.url}
      className={`flex items-center gap-2 ${className}`}
    >
      <FaEnvelope className="text-2xl" /> {children || CONTATO.email.label}
    </a>
  );
}

export function ActionButtons({ className = '', contatos = {} }) {
  const [liked, setLiked] = useState(false);
  return (
    <div
      className={`flex gap-4 items-center justify-center absolute inset-0 z-50 ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Curtir */}
      <button
        className={`group flex items-center justify-center text-2xl transition-colors duration-200 focus:outline-none bg-transparent shadow-none border-none p-0 ${liked ? 'text-pink-400' : 'text-gray-300 hover:text-pink-300'}`}
        title={liked ? 'Descurtir' : 'Curtir'}
        aria-label={liked ? 'Descurtir' : 'Curtir'}
        onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
        type="button"
      >
        {liked ? <FaHeart className="animate-pulse" /> : <FaRegHeart />}
      </button>
      {/* WhatsApp */}
      <a
        href={contatos.whatsapp?.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center text-2xl text-green-300 hover:text-green-500 transition-colors duration-200 bg-transparent shadow-none border-none p-0"
        title={contatos.whatsapp?.label || 'WhatsApp'}
        aria-label="WhatsApp"
        onClick={e => e.stopPropagation()}
      >
        <FaWhatsapp />
      </a>
      {/* Instagram */}
      <a
        href={contatos.instagram?.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center text-2xl text-pink-300 hover:text-pink-500 transition-colors duration-200 bg-transparent shadow-none border-none p-0"
        title={contatos.instagram?.label || 'Instagram'}
        aria-label="Instagram"
        onClick={e => e.stopPropagation()}
      >
        <FaInstagram />
      </a>
      {/* Email */}
      <a
        href={contatos.email?.url || '#'}
        className="flex items-center justify-center text-2xl text-blue-300 hover:text-blue-500 transition-colors duration-200 bg-transparent shadow-none border-none p-0"
        title={contatos.email?.label || 'E-mail'}
        aria-label="E-mail"
        onClick={e => e.stopPropagation()}
      >
        <FaEnvelope />
      </a>
    </div>
  );
} 
