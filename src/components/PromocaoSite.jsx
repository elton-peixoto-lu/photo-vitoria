import React, { useState, useEffect } from 'react';
import { getConfig } from '../utils/edgeConfig';
import { FaGift, FaWhatsapp, FaTimes, FaPercent } from 'react-icons/fa';
import { CONTATO, BotaoWhatsapp } from '../components/ContatoInfo';
import { abrirWhatsApp, MENSAGENS_WHATSAPP } from '../utils/whatsappUtils';

/**
 * Banner de promoção específica para visitantes do site
 * Configurável via Edge Config - pode alterar valores sem deploy
 */
export default function PromocaoSite() {
  const [promocao, setPromocao] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromocao() {
      try {
        // Buscar configurações da promoção
        const promocaoAtiva = await getConfig('promocao_site_ativa', true);
        const desconto = await getConfig('promocao_site_desconto', 10);
        const titulo = await getConfig('promocao_site_titulo', 'OFERTA ESPECIAL');
        const subtitulo = await getConfig('promocao_site_subtitulo', 'Para quem nos encontrou pelo site!');
        const codigo = await getConfig('promocao_site_codigo', 'SITE10');
        const validadeTexto = await getConfig('promocao_site_validade', 'Válido até o final do mês');
        const cor = await getConfig('promocao_site_cor', 'gradient-pink');

        if (promocaoAtiva) {
          setPromocao({
            desconto,
            titulo,
            subtitulo,
            codigo,
            validadeTexto,
            cor
          });
        }
      } catch (error) {
        console.error('Erro ao carregar promoção do site:', error);
        // Valores padrão em caso de erro
        setPromocao({
          desconto: 10,
          titulo: 'OFERTA ESPECIAL',
          subtitulo: 'Para quem nos encontrou pelo site!',
          codigo: 'SITE10',
          validadeTexto: 'Válido até o final do mês',
          cor: 'gradient-pink'
        });
      } finally {
        setLoading(false);
      }
    }

    loadPromocao();
  }, []);

  // Função para abrir WhatsApp com a mensagem da promoção
  const abrirWhatsAppPromocao = () => {
    const mensagem = MENSAGENS_WHATSAPP.promocao(promocao.desconto, promocao.codigo);
    abrirWhatsApp(mensagem);
  };

  // Não mostrar se não há promoção, foi fechado ou ainda carregando
  if (loading || !promocao || !isVisible) {
    return null;
  }

  const getGradientClass = () => {
    switch (promocao.cor) {
      case 'gradient-pink': return 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600';
      case 'gradient-purple': return 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600';
      case 'gradient-blue': return 'bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600';
      case 'gradient-green': return 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600';
      case 'gradient-orange': return 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600';
      default: return 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600';
    }
  };

  return (
    <div className={`relative ${getGradientClass()} text-white shadow-2xl overflow-hidden`}>
      {/* Botão fechar */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 z-10 opacity-70 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20"
        aria-label="Fechar promoção"
      >
        <FaTimes size={16} />
      </button>

      {/* Animação de background */}
      <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
      
      <div className="relative px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Ícone e título principal */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaGift size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{promocao.titulo}</h2>
              <p className="text-white/90 text-sm md:text-base">{promocao.subtitulo}</p>
            </div>
          </div>

          {/* Desconto em destaque */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaPercent size={20} />
            <span className="text-4xl md:text-5xl font-black">
              {promocao.desconto}% OFF
            </span>
            <FaPercent size={20} />
          </div>

          {/* Código promocional */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-4 inline-block">
            <p className="text-sm font-semibold">USE O CÓDIGO:</p>
            <p className="text-xl md:text-2xl font-black tracking-wider">{promocao.codigo}</p>
          </div>

          {/* Botão de ação */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={abrirWhatsAppPromocao}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <FaWhatsapp size={20} />
              GARANTIR DESCONTO
            </button>
            
            <p className="text-white/80 text-sm">
              {promocao.validadeTexto}
            </p>
          </div>
        </div>
      </div>

      {/* Efeito de brilho */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
    </div>
  );
}

/**
 * Configurações sugeridas no Vercel Edge Config:
 * 
 * promocao_site_ativa: true
 * promocao_site_desconto: 10
 * promocao_site_titulo: "OFERTA ESPECIAL WEB"
 * promocao_site_subtitulo: "Exclusiva para visitantes do site!"
 * promocao_site_codigo: "SITE10"
 * promocao_site_validade: "Válido até 31/01/2024"
 * promocao_site_cor: "gradient-pink"
 * 
 * Para desativar: promocao_site_ativa: false
 * Para alterar desconto: promocao_site_desconto: 15
 * Cores disponíveis: gradient-pink, gradient-purple, gradient-blue, gradient-green, gradient-orange
 */
