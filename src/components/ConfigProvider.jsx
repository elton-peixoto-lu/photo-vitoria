import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSiteConfigs } from '../utils/edgeConfig';

/**
 * Context para prover configurações do Edge Config em toda a aplicação
 */
const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [configs, setConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadConfigs() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔧 Carregando configurações do Edge Config...');
        const siteConfigs = await getSiteConfigs();
        setConfigs(siteConfigs);
        
        console.log('✅ Configurações carregadas:', siteConfigs);
      } catch (err) {
        console.error('❌ Erro ao carregar configurações:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
  }, []);

  const value = {
    configs,
    loading,
    error,
    // Funções helpers para acessar configurações específicas
    getGaleriaConfig: () => configs?.galeria || {},
    getSistemaConfig: () => configs?.sistema || {},
    getConteudoConfig: () => configs?.conteudo || {},
    getFeaturesConfig: () => configs?.features || {}
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook para usar as configurações do Edge Config
 */
export function useConfigs() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigs deve ser usado dentro de ConfigProvider');
  }
  return context;
}

/**
 * Componente para mostrar status das configurações (apenas em desenvolvimento)
 */
export function ConfigStatus() {
  const { configs, loading, error } = useConfigs();

  if (!import.meta.env.DEV) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm z-50">
        🔧 Carregando configurações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded text-sm z-50">
        ❌ Erro nas configurações
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded text-sm z-50">
      ✅ Edge Config ativo
      <details className="mt-1">
        <summary className="cursor-pointer">Ver configs</summary>
        <pre className="text-xs mt-1 bg-white p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(configs, null, 2)}
        </pre>
      </details>
    </div>
  );
}
