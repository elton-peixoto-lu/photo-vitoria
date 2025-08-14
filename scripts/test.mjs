#!/usr/bin/env node

/**
 * Script de Teste - Verifica se tudo está funcionando
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEnvironment() {
  log('magenta', '\n🧪 TESTE DO AMBIENTE DE SINCRONIZAÇÃO\n');
  
  const results = [];
  
  // 1. Teste Node.js
  try {
    const nodeVersion = process.version;
    if (parseInt(nodeVersion.slice(1)) >= 18) {
      results.push({ test: 'Node.js', status: 'ok', message: `v${nodeVersion}` });
    } else {
      results.push({ test: 'Node.js', status: 'error', message: `v${nodeVersion} - Requer v18+` });
    }
  } catch (error) {
    results.push({ test: 'Node.js', status: 'error', message: error.message });
  }
  
  // 2. Teste Sharp
  try {
    const sharp = await import('sharp');
    const image = sharp.default({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });
    await image.png().toBuffer();
    results.push({ test: 'Sharp', status: 'ok', message: 'Instalado e funcionando' });
  } catch (error) {
    results.push({ test: 'Sharp', status: 'error', message: `Erro: ${error.message}` });
  }
  
  // 3. Teste Chalk
  try {
    const chalk = await import('chalk');
    const testColor = chalk.default.green('teste');
    results.push({ test: 'Chalk', status: 'ok', message: 'Instalado' });
  } catch (error) {
    results.push({ test: 'Chalk', status: 'error', message: `Erro: ${error.message}` });
  }
  
  // 4. Teste estrutura de pastas
  const publicDir = path.join(__dirname, '..', 'public');
  try {
    await fs.access(publicDir);
    results.push({ test: 'Pasta public/', status: 'ok', message: 'Existe' });
  } catch {
    results.push({ test: 'Pasta public/', status: 'error', message: 'Não encontrada' });
  }
  
  // 5. Teste pasta de imagens
  const imagesDir = path.join(publicDir, 'images', 'galeria');
  try {
    await fs.access(imagesDir);
    results.push({ test: 'Pasta images/galeria/', status: 'ok', message: 'Existe' });
  } catch {
    try {
      await fs.mkdir(imagesDir, { recursive: true });
      results.push({ test: 'Pasta images/galeria/', status: 'ok', message: 'Criada automaticamente' });
    } catch (error) {
      results.push({ test: 'Pasta images/galeria/', status: 'error', message: 'Erro ao criar' });
    }
  }
  
  // 6. Teste arquivo localAssetsLoader.js
  const loaderFile = path.join(__dirname, '..', 'src', 'localAssetsLoader.js');
  try {
    await fs.access(loaderFile);
    results.push({ test: 'localAssetsLoader.js', status: 'ok', message: 'Encontrado' });
  } catch {
    results.push({ test: 'localAssetsLoader.js', status: 'error', message: 'Não encontrado' });
  }
  
  // 7. Teste conectividade API
  try {
    const response = await fetch('https://photo-vitoria.vercel.app/api/galeria/casamentos');
    if (response.ok) {
      const data = await response.json();
      results.push({ test: 'API Connection', status: 'ok', message: `${data.images?.length || 0} imagens disponíveis` });
    } else {
      results.push({ test: 'API Connection', status: 'warning', message: `HTTP ${response.status}` });
    }
  } catch (error) {
    results.push({ test: 'API Connection', status: 'warning', message: 'Sem conexão (ok para teste offline)' });
  }
  
  // Exibe resultados
  console.log('📋 RESULTADOS DOS TESTES:\n');
  
  results.forEach(result => {
    const statusIcon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const statusColor = result.status === 'ok' ? 'green' : result.status === 'warning' ? 'yellow' : 'red';
    
    console.log(`${statusIcon} ${result.test.padEnd(20)} | ${result.message}`);
  });
  
  // Resumo
  const okCount = results.filter(r => r.status === 'ok').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  console.log('\n' + '='.repeat(50));
  
  if (errorCount === 0) {
    log('green', '🎉 AMBIENTE PRONTO PARA SINCRONIZAÇÃO!');
    console.log('\nPróximos passos:');
    log('cyan', '1. npm run sync:images          # Sincronização via CLI');
    log('cyan', '2. npm run sync:images:web      # Interface web em http://localhost:3002');
    log('cyan', '3. npm run sync:images:force    # Força re-download de tudo');
  } else {
    log('red', `❌ ${errorCount} erro(s) encontrado(s). Corrija antes de continuar.`);
    
    if (results.some(r => r.test === 'Sharp' && r.status === 'error')) {
      log('yellow', '\n💡 Para instalar Sharp: npm install sharp');
    }
    if (results.some(r => r.test === 'Node.js' && r.status === 'error')) {
      log('yellow', '💡 Atualize o Node.js para versão 18 ou superior');
    }
  }
  
  console.log(`\n📊 ${okCount} OK | ${warningCount} Avisos | ${errorCount} Erros\n`);
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnvironment().catch(error => {
    log('red', `❌ Erro no teste: ${error.message}`);
    process.exit(1);
  });
}
