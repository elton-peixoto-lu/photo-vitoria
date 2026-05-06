import React, { useState, useEffect } from 'react';
import { getConfig } from '../utils/edgeConfig';

/**
 * Componente de saudação dinâmica usando config local
 * Permite mudar textos sem deploy
 */
export default function DynamicGreeting({ defaultTitle, defaultSubtitle, className = "" }) {
  const [greeting, setGreeting] = useState({
    title: defaultTitle || "Photo Vitória",
    subtitle: defaultSubtitle || "Capturando momentos únicos"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGreeting() {
      try {
        const dynamicTitle = await getConfig('greeting', defaultTitle);
        const dynamicSubtitle = await getConfig('welcome_message', defaultSubtitle);
        
        setGreeting({
          title: dynamicTitle || defaultTitle,
          subtitle: dynamicSubtitle || defaultSubtitle
        });
      } catch (error) {
        console.error('Erro ao carregar saudação dinâmica:', error);
        // Mantém valores padrão em caso de erro
      } finally {
        setLoading(false);
      }
    }

    loadGreeting();
  }, [defaultTitle, defaultSubtitle]);

  if (loading) {
    // Skeleton loading
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-8 md:h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 md:h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4 leading-tight">
        {greeting.title}
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
        {greeting.subtitle}
      </p>
    </div>
  );
}

/**
 * Como usar na Home:
 * 
 * import DynamicGreeting from '../components/DynamicGreeting';
 * 
 * // Substitua o título estático por:
 * <DynamicGreeting 
 *   defaultTitle="Photo Vitória"
 *   defaultSubtitle="Capturando momentos únicos" 
 *   className="text-center mb-8"
 * />
 * 
 * Configurações no config local:
 * greeting: "✨ Studio Vitória Freitas"
 * welcome_message: "📸 Transformando momentos em memórias eternas"
 */
