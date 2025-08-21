import React, { useState, useEffect } from 'react';
import { getConfig } from '../utils/edgeConfig';
import { FaTimes, FaGift } from 'react-icons/fa';

/**
 * Banner promocional dinâmico usando Edge Config
 * Pode ser ligado/desligado e o conteúdo alterado sem deploy
 */
export default function DynamicBanner() {
  const [banner, setBanner] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanner() {
      try {
        // Buscar configurações do banner
        const bannerActive = await getConfig('promotion_banner_active', false);
        const bannerMessage = await getConfig('promotion_banner', null);
        const bannerColor = await getConfig('promotion_banner_color', 'pink');
        const bannerIcon = await getConfig('promotion_banner_icon', 'gift');

        if (bannerActive && bannerMessage) {
          setBanner({
            message: bannerMessage,
            color: bannerColor,
            icon: bannerIcon
          });
        }
      } catch (error) {
        console.error('Erro ao carregar banner dinâmico:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBanner();
  }, []);

  // Não mostrar se não há banner ou se foi fechado
  if (loading || !banner || !isVisible) {
    return null;
  }

  const getIconComponent = () => {
    switch (banner.icon) {
      case 'gift': return <FaGift size={20} />;
      default: return <FaGift size={20} />;
    }
  };

  const getColorClasses = () => {
    switch (banner.color) {
      case 'pink': return 'bg-pink-500 text-white border-pink-600';
      case 'purple': return 'bg-purple-500 text-white border-purple-600';
      case 'blue': return 'bg-blue-500 text-white border-blue-600';
      case 'green': return 'bg-green-500 text-white border-green-600';
      case 'red': return 'bg-red-500 text-white border-red-600';
      default: return 'bg-pink-500 text-white border-pink-600';
    }
  };

  return (
    <div className={`relative ${getColorClasses()} p-4 text-center shadow-lg animate-pulse-soft`}>
      <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
        {getIconComponent()}
        <p className="font-semibold text-sm md:text-base flex-1">
          {banner.message}
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Fechar banner"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Como configurar no Vercel Edge Config:
 * 
 * promotion_banner_active: true
 * promotion_banner: "🎉 SUPER PROMOÇÃO: 30% OFF em todos os ensaios!"
 * promotion_banner_color: "pink"
 * promotion_banner_icon: "gift"
 * 
 * Para desligar: mude promotion_banner_active para false
 * Para mudar mensagem: altere promotion_banner
 * Para mudar cor: altere promotion_banner_color (pink, purple, blue, green, red)
 */
