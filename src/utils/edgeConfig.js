import { useEffect, useState } from 'react';

const STATIC_CONFIG = {
  galeria: {
    maxImagens: 50,
    qualidadeImagem: 80,
    habilitarPreload: true,
  },
  sistema: {
    circuitBreakerLimite: 3,
    circuitBreakerTimeout: 30000,
    tentativasMaximas: 3,
  },
  conteudo: {
    saudacao: 'Bem-vindo ao Photo Vitória!',
    manutencao: false,
    mensagemManutencao: 'Site em manutenção',
    welcomeMessage: 'Capture seus momentos únicos!',
  },
  features: {
    novasGalerias: false,
    animacoesAvancadas: true,
    analytics: false,
  },
  promocoes: {
    bannerAtivo: false,
    mensagemBanner: null,
    desconto: 0,
  },
  avulsas: {
    greeting: 'Bem-vindo ao Photo Vitória!',
    welcome_message: 'Capture seus momentos únicos!',
    manutencao_ativa: false,
    manutencao_mensagem: 'Site em manutenção',
    galeria_max_imagens: 50,
    galeria_qualidade: 80,
    galeria_preload: true,
    sistema_circuit_breaker_limite: 3,
    sistema_circuit_breaker_timeout: 30000,
    sistema_tentativas_maximas: 3,
    feature_novas_galerias: false,
    feature_animacoes_avancadas: true,
    feature_analytics: false,
    promotion_banner_active: false,
    promotion_banner: null,
    promotion_discount: 0,
    promocao_site_ativa: false,
    promocao_site_desconto: 10,
    promocao_site_titulo: 'OFERTA ESPECIAL',
    promocao_site_subtitulo: 'Para quem nos encontrou pelo site!',
    promocao_site_codigo: 'SITE10',
    promocao_site_validade: 'Válido até o final do mês',
    promocao_site_cor: 'gradient-pink',
    servicos_ativos: true,
    servicos_lista: null,
  },
};

function getFlatConfigValue(key) {
  if (Object.prototype.hasOwnProperty.call(STATIC_CONFIG.avulsas, key)) {
    return STATIC_CONFIG.avulsas[key];
  }

  return undefined;
}

export async function getConfig(key, defaultValue = null) {
  const value = getFlatConfigValue(key);
  return value !== undefined ? value : defaultValue;
}

export async function getAllConfigs() {
  return { ...STATIC_CONFIG.avulsas };
}

export async function getSiteConfigs() {
  return {
    galeria: { ...STATIC_CONFIG.galeria },
    sistema: { ...STATIC_CONFIG.sistema },
    conteudo: { ...STATIC_CONFIG.conteudo },
    features: { ...STATIC_CONFIG.features },
    promocoes: { ...STATIC_CONFIG.promocoes },
  };
}

export function useEdgeConfig(key, defaultValue = null) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const value = await getConfig(key, defaultValue);
        if (mounted) {
          setData(value);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setData(defaultValue);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [key, defaultValue]);

  return { data, loading, error };
}
