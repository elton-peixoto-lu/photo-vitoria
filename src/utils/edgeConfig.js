import { get, getAll } from '@vercel/edge-config';
import { useState, useEffect } from 'react';

/**
 * Utility para usar Vercel Edge Config no projeto React/Vite
 * Como não temos middleware, usamos essas funções utilitárias
 */

function hasEdgeConfig() {
  return Boolean(import.meta.env.VITE_EDGE_CONFIG);
}

/**
 * Busca uma configuração específica do Edge Config
 * @param {string} key - Chave da configuração
 * @param {any} defaultValue - Valor padrão se não encontrar
 * @returns {Promise<any>} Valor da configuração
 */
export async function getConfig(key, defaultValue = null) {
  if (!hasEdgeConfig()) {
    return defaultValue;
  }

  try {
    const value = await get(key);
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.error(`🔧 Erro ao buscar config '${key}':`, error);
    return defaultValue;
  }
}

/**
 * Busca todas as configurações do Edge Config
 * @returns {Promise<Object>} Todas as configurações
 */
export async function getAllConfigs() {
  if (!hasEdgeConfig()) {
    return {};
  }

  try {
    const configs = await getAll();
    return configs || {};
  } catch (error) {
    console.error('🔧 Erro ao buscar todas as configs:', error);
    return {};
  }
}

/**
 * Busca configurações específicas para funcionalidades do site
 */
export async function getSiteConfigs() {
  if (!hasEdgeConfig()) {
    return {
      galeria: {
        maxImagens: 50,
        qualidadeImagem: 80,
        habilitarPreload: true
      },
      sistema: {
        circuitBreakerLimite: 3,
        circuitBreakerTimeout: 30000,
        tentativasMaximas: 3
      },
      conteudo: {
        saudacao: 'Bem-vindo ao Photo Vitória!',
        manutencao: false,
        mensagemManutencao: 'Site em manutenção'
      },
      features: {
        novasGalerias: false,
        animacoesAvancadas: true,
        analytics: true
      }
    };
  }

  try {
    const configs = await getAll();
    return {
      // Configurações da galeria
      galeria: {
        maxImagens: configs.galeria_max_imagens || 50,
        qualidadeImagem: configs.galeria_qualidade || 80,
        habilitarPreload: configs.galeria_preload || true
      },
      
      // Configurações do sistema híbrido
      sistema: {
        circuitBreakerLimite: configs.sistema_circuit_breaker_limite || 3,
        circuitBreakerTimeout: configs.sistema_circuit_breaker_timeout || 30000,
        tentativasMaximas: configs.sistema_tentativas_maximas || 3
      },
      
      // Mensagens e conteúdo dinâmico
      conteudo: {
        saudacao: configs.greeting || 'Bem-vindo ao Photo Vitória!',
        manutencao: configs.manutencao_ativa || false,
        mensagemManutencao: configs.manutencao_mensagem || 'Site em manutenção'
      },
      
      // Feature flags
      features: {
        novasGalerias: configs.feature_novas_galerias || false,
        animacoesAvancadas: configs.feature_animacoes_avancadas || true,
        analytics: configs.feature_analytics || true
      }
    };
  } catch (error) {
    console.error('🔧 Erro ao buscar configurações do site:', error);
    // Retorna configurações padrão em caso de erro
    return {
      galeria: {
        maxImagens: 50,
        qualidadeImagem: 80,
        habilitarPreload: true
      },
      sistema: {
        circuitBreakerLimite: 3,
        circuitBreakerTimeout: 30000,
        tentativasMaximas: 3
      },
      conteudo: {
        saudacao: 'Bem-vindo ao Photo Vitória!',
        manutencao: false,
        mensagemManutencao: 'Site em manutenção'
      },
      features: {
        novasGalerias: false,
        animacoesAvancadas: true,
        analytics: true
      }
    };
  }
}

/**
 * Hook React para usar Edge Config
 * @param {string} key - Chave da configuração
 * @param {any} defaultValue - Valor padrão
 * @returns {Object} { data, loading, error }
 */
export function useEdgeConfig(key, defaultValue = null) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        setError(null);
        const value = await getConfig(key, defaultValue);
        setData(value);
      } catch (err) {
        setError(err);
        setData(defaultValue);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [key, defaultValue]);

  return { data, loading, error };
}

if (import.meta.env.DEV && hasEdgeConfig()) {
  console.log('Edge Config ativo para este ambiente.');
}
