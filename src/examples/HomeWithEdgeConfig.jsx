import React, { useState, useEffect } from 'react';
import { useConfigs } from '../components/ConfigProvider';
import { getConfig } from '../utils/edgeConfig';

/**
 * Exemplo de como usar Edge Config na página Home
 * Este é um exemplo didático - você pode aplicar os conceitos em qualquer componente
 */
export default function HomeWithEdgeConfig() {
  const { configs, loading: configsLoading } = useConfigs();
  const [dynamicContent, setDynamicContent] = useState(null);

  useEffect(() => {
    // Exemplo de buscar conteúdo dinâmico específico
    async function loadDynamicContent() {
      try {
        // Buscar configurações específicas que podem mudar sem deploy
        const welcomeMessage = await getConfig('welcome_message', 'Bem-vindos ao Photo Vitória!');
        const promotionBanner = await getConfig('promotion_banner', null);
        const featuredGallery = await getConfig('featured_gallery', 'casamentos');
        const maxImagesPerGallery = await getConfig('max_images_home', 4);

        setDynamicContent({
          welcomeMessage,
          promotionBanner,
          featuredGallery,
          maxImagesPerGallery
        });
      } catch (error) {
        console.error('Erro ao carregar conteúdo dinâmico:', error);
      }
    }

    loadDynamicContent();
  }, []);

  // Loading state
  if (configsLoading || !dynamicContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // Acessar configurações do contexto
  const { conteudo, galeria, features } = configs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Hero Section com conteúdo dinâmico */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          {dynamicContent.welcomeMessage}
        </h1>
        
        {/* Banner promocional condicional */}
        {dynamicContent.promotionBanner && (
          <div className="bg-pink-500 text-white p-4 rounded-lg mb-6 max-w-4xl mx-auto">
            <p className="text-lg font-semibold">{dynamicContent.promotionBanner}</p>
          </div>
        )}

        {/* Saudação personalizada do Edge Config */}
        <p className="text-xl text-gray-600 mb-8">
          {conteudo.saudacao}
        </p>

        {/* Mostrar se features estão habilitadas */}
        <div className="flex justify-center gap-4 mb-8">
          {features.novasGalerias && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              🆕 Novas Galerias
            </span>
          )}
          {features.animacoesAvancadas && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              ✨ Animações Premium
            </span>
          )}
        </div>
      </section>

      {/* Galeria em destaque baseada nas configurações */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Galeria em Destaque: {dynamicContent.featuredGallery}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Simular imagens baseadas na configuração maxImagesPerGallery */}
            {Array.from({ length: dynamicContent.maxImagesPerGallery }, (_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse">
                <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Imagem {i + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Configurações da galeria */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Qualidade das imagens: {galeria.qualidadeImagem}%</p>
            <p>Máximo de imagens por álbum: {galeria.maxImagens}</p>
            <p>Preload habilitado: {galeria.habilitarPreload ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      </section>

      {/* Verificação de manutenção */}
      {conteudo.manutencao && (
        <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black p-3 text-center z-50">
          <p className="font-semibold">⚠️ {conteudo.mensagemManutencao}</p>
        </div>
      )}

      {/* Debug info (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-20 left-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs">
          <p className="font-semibold mb-2">🔧 Edge Config Debug:</p>
          <pre className="overflow-auto max-h-40">
            {JSON.stringify({ configs, dynamicContent }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Como usar este exemplo:
 * 
 * 1. No Vercel Dashboard, vá em Storage > Edge Config
 * 2. Adicione estas configurações:
 *    - welcome_message: "Capture seus momentos únicos!"
 *    - promotion_banner: "🎉 Desconto de 20% em ensaios de casal!"
 *    - featured_gallery: "casamentos"
 *    - max_images_home: 6
 *    - greeting: "Transformamos momentos em memórias eternas"
 * 
 * 3. No App.jsx, importe e use:
 *    import HomeWithEdgeConfig from './examples/HomeWithEdgeConfig';
 *    // Troque <Home /> por <HomeWithEdgeConfig />
 * 
 * 4. As mudanças nas configurações serão refletidas sem novo deploy!
 */
