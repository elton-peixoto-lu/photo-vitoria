#!/usr/bin/env node

/**
 * Script de Sincronização de Imagens API → Local (ES Module)
 * 
 * Baixa todas as imagens da API do Cloudinary e salva localmente
 * otimizando para AVIF e atualizando o mapeamento automaticamente.
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import sharp from 'sharp';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Diretório atual para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const CONFIG = {
  API_URL: process.env.VITE_API_URL || 'http://localhost:4000/api',
  PUBLIC_DIR: path.join(__dirname, '..', 'public', 'images', 'galeria'),
  LOADER_FILE: path.join(__dirname, '..', 'src', 'localAssetsLoader.js'),
  CONCURRENT_DOWNLOADS: 3,
  QUALITY: 85,
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1800,
  FORCE_REDOWNLOAD: process.argv.includes('--force')
};

// Pastas para sincronizar
const FOLDERS = ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'];

// Estatísticas globais
const STATS = {
  totalImages: 0,
  downloadedImages: 0,
  skippedImages: 0,
  errorImages: 0,
  startTime: Date.now()
};

/**
 * Utilitário de logging colorido
 */
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  progress: (msg) => console.log(chalk.cyan('🔄'), msg),
  title: (msg) => console.log(chalk.bold.magenta('\n🚀', msg, '\n'))
};

/**
 * Busca imagens de uma pasta da API
 */
async function fetchImagesFromAPI(folder) {
  try {
    log.progress(`Buscando imagens da pasta: ${folder}`);
    
    const url = `${CONFIG.API_URL}/galeria/${encodeURIComponent(folder)}`;
    
    // Usa fetch nativo (Node.js 18+)
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const images = data.images || [];
    
    log.info(`Encontradas ${images.length} imagens na pasta ${folder}`);
    return images;
    
  } catch (error) {
    log.error(`Erro ao buscar imagens da pasta ${folder}: ${error.message}`);
    return [];
  }
}

/**
 * Baixa uma imagem da URL
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Segue redirecionamentos
        downloadImage(response.headers.location).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusText}`));
      }
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout na requisição'));
    });
  });
}

/**
 * Processa e otimiza imagem para AVIF
 */
async function processImage(imageBuffer, outputPath) {
  try {
    const info = await sharp(imageBuffer)
      .resize(CONFIG.MAX_WIDTH, CONFIG.MAX_HEIGHT, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .avif({ 
        quality: CONFIG.QUALITY,
        effort: 4 // Balanceio entre qualidade e velocidade
      })
      .toFile(outputPath);
      
    return { success: true, size: info.size };
  } catch (error) {
    log.error(`Erro ao processar imagem ${path.basename(outputPath)}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Gera nome único para arquivo baseado na URL original
 */
function generateFileName(url, index, originalName = null) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extrai ID do Cloudinary se possível
    const match = pathname.match(/\/([a-zA-Z0-9_-]+)\.(jpg|jpeg|png|webp|avif)$/);
    if (match) {
      return `${match[1]}.avif`;
    }
    
    // Usa nome original se fornecido
    if (originalName) {
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      return `${nameWithoutExt}.avif`;
    }
    
    // Fallback: usa hash simples baseado na URL
    const hash = Buffer.from(url).toString('base64')
      .replace(/[/+=]/g, '')
      .slice(0, 20)
      .toLowerCase();
    return `img_${index.toString().padStart(3, '0')}_${hash}.avif`;
    
  } catch {
    return `image_${index.toString().padStart(3, '0')}_${Date.now()}.avif`;
  }
}

/**
 * Cria diretório se não existir
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    log.error(`Erro ao criar diretório ${dirPath}: ${error.message}`);
    return false;
  }
}

/**
 * Verifica se arquivo já existe e seu tamanho
 */
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return { exists: true, size: stats.size };
  } catch {
    return { exists: false, size: 0 };
  }
}

/**
 * Processa uma pasta completa
 */
async function processFolder(folder) {
  log.title(`Processando pasta: ${folder.toUpperCase()}`);
  
  // 1. Busca imagens da API
  const apiImages = await fetchImagesFromAPI(folder);
  if (apiImages.length === 0) {
    log.warning(`Nenhuma imagem encontrada na API para pasta: ${folder}`);
    return [];
  }
  
  STATS.totalImages += apiImages.length;
  
  // 2. Cria diretório local
  const folderPath = path.join(CONFIG.PUBLIC_DIR, folder);
  if (!(await ensureDirectory(folderPath))) {
    return [];
  }
  
  // 3. Processa imagens com controle de concorrência
  const processedImages = [];
  const semaphore = [];
  let processedCount = 0;
  
  for (let i = 0; i < apiImages.length; i++) {
    // Controla concorrência
    if (semaphore.length >= CONFIG.CONCURRENT_DOWNLOADS) {
      await Promise.race(semaphore);
    }
    
    const image = apiImages[i];
    const fileName = generateFileName(image.url, i, image.public_id);
    const outputPath = path.join(folderPath, fileName);
    
    const promise = (async () => {
      try {
        const fileInfo = await getFileInfo(outputPath);
        
        // Verifica se deve pular (arquivo existe e não é force)
        if (fileInfo.exists && fileInfo.size > 0 && !CONFIG.FORCE_REDOWNLOAD) {
          log.info(`[${folder}] Já existe: ${fileName} (${(fileInfo.size/1024).toFixed(1)}KB)`);
          STATS.skippedImages++;
          return fileName;
        }
        
        // Download da imagem
        log.progress(`[${folder}] Baixando ${fileName}...`);
        const imageBuffer = await downloadImage(image.url);
        
        // Processa e salva
        const result = await processImage(imageBuffer, outputPath);
        
        if (result.success) {
          STATS.downloadedImages++;
          log.success(`[${folder}] ✨ ${fileName} (${(result.size/1024).toFixed(1)}KB)`);
          return fileName;
        } else {
          STATS.errorImages++;
          return null;
        }
        
      } catch (error) {
        log.error(`[${folder}] Erro ao processar ${fileName}: ${error.message}`);
        STATS.errorImages++;
        return null;
      } finally {
        // Remove da lista de semáforos
        const index = semaphore.indexOf(promise);
        if (index > -1) semaphore.splice(index, 1);
        
        processedCount++;
        if (processedCount % 5 === 0 || processedCount === apiImages.length) {
          log.info(`[${folder}] Progresso: ${processedCount}/${apiImages.length} imagens`);
        }
      }
    })();
    
    semaphore.push(promise);
    const result = await promise;
    if (result) {
      processedImages.push(result);
    }
  }
  
  // Aguarda todos os downloads terminarem
  await Promise.allSettled(semaphore);
  
  log.success(`Pasta ${folder} concluída: ${processedImages.length} imagens salvas localmente`);
  return processedImages.sort(); // Ordena alfabeticamente
}

/**
 * Atualiza o mapeamento no localAssetsLoader.js
 */
async function updateLocalMapping(mapping) {
  try {
    log.progress('Atualizando mapeamento no localAssetsLoader.js...');
    
    const content = await fs.readFile(CONFIG.LOADER_FILE, 'utf8');
    
    // Gera novo mapeamento formatado
    const newMappingCode = `const LOCAL_IMAGES_MAP = ${JSON.stringify(mapping, null, 2)};`;
    
    // Substitui o mapeamento existente
    const updatedContent = content.replace(
      /const LOCAL_IMAGES_MAP = \{[\s\S]*?\};/,
      newMappingCode
    );
    
    // Salva arquivo atualizado
    await fs.writeFile(CONFIG.LOADER_FILE, updatedContent, 'utf8');
    
    const totalMapped = Object.values(mapping).reduce((acc, imgs) => acc + imgs.length, 0);
    log.success(`Mapeamento atualizado: ${totalMapped} imagens mapeadas!`);
    return true;
    
  } catch (error) {
    log.error(`Erro ao atualizar mapeamento: ${error.message}`);
    return false;
  }
}

/**
 * Cria backup do mapeamento atual
 */
async function backupCurrentMapping() {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const backupPath = `${CONFIG.LOADER_FILE}.backup.${timestamp}`;
    
    await fs.copyFile(CONFIG.LOADER_FILE, backupPath);
    log.info(`📦 Backup criado: ${path.basename(backupPath)}`);
    
  } catch (error) {
    log.warning(`Erro ao criar backup: ${error.message}`);
  }
}

/**
 * Exibe estatísticas finais
 */
function displayStats() {
  const duration = ((Date.now() - STATS.startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  log.title('ESTATÍSTICAS FINAIS');
  console.log(`📊 Total de imagens processadas: ${chalk.bold.white(STATS.totalImages)}`);
  console.log(`✅ Baixadas/processadas: ${chalk.green.bold(STATS.downloadedImages)}`);
  console.log(`⏭️  Já existiam (puladas): ${chalk.yellow.bold(STATS.skippedImages)}`);
  console.log(`❌ Erros: ${chalk.red.bold(STATS.errorImages)}`);
  console.log(`⏱️  Tempo total: ${chalk.blue.bold(duration)}s`);
  
  if (STATS.totalImages > 0) {
    const successRate = ((STATS.downloadedImages + STATS.skippedImages) / STATS.totalImages * 100).toFixed(1);
    console.log(`🎯 Taxa de sucesso: ${chalk.green.bold(successRate)}%`);
  }
  
  console.log('='.repeat(60));
}

/**
 * Valida configuração
 */
async function validateConfig() {
  // Verifica se diretórios existem
  const publicExists = await fs.access(path.dirname(CONFIG.PUBLIC_DIR)).then(() => true).catch(() => false);
  if (!publicExists) {
    log.error('Diretório public não encontrado. Execute do diretório raiz do projeto.');
    process.exit(1);
  }
  
  const loaderExists = await fs.access(CONFIG.LOADER_FILE).then(() => true).catch(() => false);
  if (!loaderExists) {
    log.error('Arquivo localAssetsLoader.js não encontrado.');
    process.exit(1);
  }
  
  log.info(`📁 Diretório de destino: ${CONFIG.PUBLIC_DIR}`);
  log.info(`🔄 API URL: ${CONFIG.API_URL}`);
  log.info(`⚡ Downloads concorrentes: ${CONFIG.CONCURRENT_DOWNLOADS}`);
  log.info(`🎨 Qualidade AVIF: ${CONFIG.QUALITY}`);
  log.info(`📏 Tamanho máximo: ${CONFIG.MAX_WIDTH}x${CONFIG.MAX_HEIGHT}`);
  
  if (CONFIG.FORCE_REDOWNLOAD) {
    log.warning('🔥 Modo FORCE ativo: redownload de imagens existentes');
  }
}

/**
 * Função principal
 */
async function main() {
  log.title('SINCRONIZAÇÃO DE IMAGENS API → LOCAL');
  
  try {
    // Validações
    await validateConfig();
    
    // Cria backup
    await backupCurrentMapping();
    
    // Processa todas as pastas
    const mapping = {};
    
    for (const folder of FOLDERS) {
      const images = await processFolder(folder);
      mapping[folder] = images;
      
      // Pausa pequena entre pastas
      if (FOLDERS.indexOf(folder) < FOLDERS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Atualiza mapeamento
    await updateLocalMapping(mapping);
    
    // Exibe estatísticas
    displayStats();
    
    log.success('🎉 Sincronização concluída com sucesso!');
    log.info('💡 Execute "npm run dev" para testar o sistema híbrido');
    
  } catch (error) {
    log.error(`Erro fatal: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
