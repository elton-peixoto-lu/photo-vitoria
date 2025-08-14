// Utilitário para testar o sistema híbrido
import { loadGalleryImages, getCircuitBreakerStats, resetCircuitBreaker } from '../localAssetsLoader';

export async function testHybridSystem() {
  console.group('🔧 Testando Sistema Híbrido de Carregamento de Imagens');
  
  const testCases = ['casamentos', 'infantil', 'femininos', 'noivas', 'pre-weding'];
  const results = [];
  
  for (const pasta of testCases) {
    console.group(`📁 Testando pasta: ${pasta}`);
    
    const startTime = Date.now();
    
    try {
      const images = await loadGalleryImages(pasta);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const localImages = images.filter(img => img.isLocal);
      const apiImages = images.filter(img => !img.isLocal);
      
      const result = {
        pasta,
        success: true,
        totalImages: images.length,
        localImages: localImages.length,
        apiImages: apiImages.length,
        duration: `${duration}ms`,
        firstImageSource: images.length > 0 ? (images[0].isLocal ? 'Local' : 'API') : 'N/A'
      };
      
      console.log(`✅ Sucesso:`, result);
      results.push(result);
      
    } catch (error) {
      console.error(`❌ Erro para pasta ${pasta}:`, error);
      
      const result = {
        pasta,
        success: false,
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      };
      
      results.push(result);
    }
    
    console.groupEnd();
  }
  
  console.group('📊 Resumo dos Testes');
  console.table(results);
  
  const circuitBreakerStats = getCircuitBreakerStats();
  console.log('🔄 Circuit Breaker Status:', circuitBreakerStats);
  
  const successfulTests = results.filter(r => r.success).length;
  const totalLocalImages = results.reduce((acc, r) => acc + (r.localImages || 0), 0);
  const totalApiImages = results.reduce((acc, r) => acc + (r.apiImages || 0), 0);
  
  console.log(`\n📈 Estatísticas Gerais:`);
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}/${results.length}`);
  console.log(`🏠 Imagens locais carregadas: ${totalLocalImages}`);
  console.log(`🌐 Imagens da API carregadas: ${totalApiImages}`);
  console.log(`📊 Taxa de uso local: ${totalLocalImages > 0 ? ((totalLocalImages / (totalLocalImages + totalApiImages)) * 100).toFixed(1) : 0}%`);
  
  console.groupEnd();
  console.groupEnd();
  
  return {
    results,
    circuitBreakerStats,
    summary: {
      successfulTests,
      totalLocalImages,
      totalApiImages,
      localUsageRate: totalLocalImages > 0 ? ((totalLocalImages / (totalLocalImages + totalApiImages)) * 100).toFixed(1) : 0
    }
  };
}

// Função para testar performance comparativa
export async function performanceTest(pasta = 'casamentos', iterations = 3) {
  console.group(`⚡ Teste de Performance - Pasta: ${pasta}`);
  
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`🔄 Iteração ${i + 1}/${iterations}`);
    
    // Limpa o cache para teste justo
    const cacheKey = pasta;
    const cache = localStorage.getItem(`galeria_cache_${cacheKey}`);
    if (cache) localStorage.removeItem(`galeria_cache_${cacheKey}`);
    
    const startTime = performance.now();
    
    try {
      const images = await loadGalleryImages(pasta);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.push({
        iteration: i + 1,
        success: true,
        duration: Math.round(duration),
        imagesLoaded: images.length,
        source: images.length > 0 ? (images[0].isLocal ? 'Local' : 'API') : 'N/A'
      });
      
      console.log(`✅ Iteração ${i + 1}: ${Math.round(duration)}ms - ${images.length} imagens`);
      
    } catch (error) {
      console.error(`❌ Erro na iteração ${i + 1}:`, error);
      results.push({
        iteration: i + 1,
        success: false,
        error: error.message
      });
    }
    
    // Pausa pequena entre iterações
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successfulResults = results.filter(r => r.success);
  const avgDuration = successfulResults.length > 0 
    ? Math.round(successfulResults.reduce((acc, r) => acc + r.duration, 0) / successfulResults.length)
    : 0;
  
  console.log(`\n📊 Resultados do Teste de Performance:`);
  console.table(results);
  console.log(`⚡ Tempo médio: ${avgDuration}ms`);
  
  console.groupEnd();
  
  return {
    results,
    avgDuration,
    successRate: `${successfulResults.length}/${iterations}`
  };
}

// Função para simular falha da API (para testar circuit breaker)
export function simulateApiFailure() {
  console.warn('🚨 Simulando falha da API para testar Circuit Breaker...');
  
  // Força o circuit breaker para estado OPEN
  const originalFetch = window.fetch;
  let failureCount = 0;
  
  window.fetch = async (...args) => {
    if (args[0].includes('/galeria/')) {
      failureCount++;
      if (failureCount <= 3) {
        throw new Error(`Falha simulada ${failureCount}/3`);
      }
    }
    return originalFetch.apply(window, args);
  };
  
  console.log('🔧 API configurada para falhar nas próximas 3 requisições');
  
  // Restaura fetch original após 30 segundos
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log('✅ Fetch original restaurado');
  }, 30000);
}

// Expõe funções globalmente para uso no console
window.testHybridSystem = testHybridSystem;
window.performanceTest = performanceTest;
window.simulateApiFailure = simulateApiFailure;
window.resetCircuitBreaker = resetCircuitBreaker;

console.log('🛠️ Utilitários de teste disponíveis no window:');
console.log('• testHybridSystem() - Testa todas as pastas');
console.log('• performanceTest(pasta, iterations) - Teste de performance');
console.log('• simulateApiFailure() - Simula falha da API');
console.log('• resetCircuitBreaker() - Reseta o circuit breaker');
