const express = require('express');
const router = express.Router();

/**
 * Rotas de exemplo para usar Edge Config no backend
 * Estas rotas demonstram como acessar configurações no servidor
 */

/**
 * GET /api/config/greeting
 * Retorna uma saudação personalizada do Edge Config
 */
router.get('/greeting', async (req, res) => {
  try {
    // No servidor Node.js, podemos usar Edge Config diretamente
    const { get } = await import('@vercel/edge-config');
    
    const greeting = await get('greeting');
    const welcomeMessage = await get('welcome_message');
    
    res.json({
      success: true,
      data: {
        greeting: greeting || 'Bem-vindo ao Photo Vitória!',
        welcomeMessage: welcomeMessage || 'Capture seus momentos únicos!'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar greeting do Edge Config:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      data: {
        greeting: 'Bem-vindo ao Photo Vitória!',
        welcomeMessage: 'Capture seus momentos únicos!'
      }
    });
  }
});

/**
 * GET /api/config/site
 * Retorna todas as configurações do site
 */
router.get('/site', async (req, res) => {
  try {
    const { getAll } = await import('@vercel/edge-config');
    
    const allConfigs = await getAll();
    
    // Estruturar as configurações
    const siteConfigs = {
      galeria: {
        maxImagens: allConfigs.galeria_max_imagens || 50,
        qualidadeImagem: allConfigs.galeria_qualidade || 80,
        habilitarPreload: allConfigs.galeria_preload || true
      },
      sistema: {
        circuitBreakerLimite: allConfigs.sistema_circuit_breaker_limite || 3,
        circuitBreakerTimeout: allConfigs.sistema_circuit_breaker_timeout || 30000,
        tentativasMaximas: allConfigs.sistema_tentativas_maximas || 3
      },
      conteudo: {
        saudacao: allConfigs.greeting || 'Bem-vindo ao Photo Vitória!',
        manutencao: allConfigs.manutencao_ativa || false,
        mensagemManutencao: allConfigs.manutencao_mensagem || 'Site em manutenção',
        welcomeMessage: allConfigs.welcome_message || 'Capture seus momentos únicos!'
      },
      features: {
        novasGalerias: allConfigs.feature_novas_galerias || false,
        animacoesAvancadas: allConfigs.feature_animacoes_avancadas || true,
        analytics: allConfigs.feature_analytics || true
      },
      promocoes: {
        bannerAtivo: allConfigs.promotion_banner_active || false,
        mensagemBanner: allConfigs.promotion_banner || null,
        desconto: allConfigs.promotion_discount || 0
      }
    };
    
    res.json({
      success: true,
      data: siteConfigs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do Edge Config:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      data: null
    });
  }
});

/**
 * GET /api/config/maintenance
 * Verifica se o site está em manutenção
 */
router.get('/maintenance', async (req, res) => {
  try {
    const { get } = await import('@vercel/edge-config');
    
    const manutencaoAtiva = await get('manutencao_ativa');
    const mensagemManutencao = await get('manutencao_mensagem');
    
    res.json({
      success: true,
      data: {
        maintenance: manutencaoAtiva || false,
        message: mensagemManutencao || 'Site em manutenção',
        estimated_return: await get('manutencao_retorno') || null
      }
    });
  } catch (error) {
    console.error('Erro ao verificar manutenção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      data: {
        maintenance: false,
        message: 'Site funcionando normalmente'
      }
    });
  }
});

/**
 * GET /api/config/gallery/:folder
 * Retorna configurações específicas para uma galeria
 */
router.get('/gallery/:folder', async (req, res) => {
  try {
    const { folder } = req.params;
    const { get } = await import('@vercel/edge-config');
    
    // Buscar configurações específicas da galeria
    const maxImages = await get(`galeria_${folder}_max`) || await get('galeria_max_imagens') || 50;
    const quality = await get(`galeria_${folder}_qualidade`) || await get('galeria_qualidade') || 80;
    const featured = await get(`galeria_${folder}_destaque`) || false;
    
    res.json({
      success: true,
      data: {
        folder,
        maxImages,
        quality,
        featured,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Erro ao buscar configurações da galeria ${req.params.folder}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      data: null
    });
  }
});

module.exports = router;

/**
 * Como usar estas rotas:
 * 
 * 1. No server/index.cjs, adicione:
 *    const edgeConfigRoutes = require('./edgeConfigRoutes.cjs');
 *    app.use('/api/config', edgeConfigRoutes);
 * 
 * 2. No frontend, você pode fazer requests para:
 *    - GET /api/config/greeting
 *    - GET /api/config/site
 *    - GET /api/config/maintenance
 *    - GET /api/config/gallery/casamentos
 * 
 * 3. Configurações no Vercel Edge Config:
 *    - greeting: "Bem-vindos ao Photo Vitória!"
 *    - welcome_message: "Capture seus momentos únicos!"
 *    - manutencao_ativa: false
 *    - galeria_max_imagens: 50
 *    - feature_novas_galerias: true
 */
