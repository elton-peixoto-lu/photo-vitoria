#!/usr/bin/env node

/**
 * Script de Sincronização de Imagens API → Local
 * 
 * Baixa todas as imagens da API do Cloudinary e salva localmente
 * otimizando para AVIF e atualizando o mapeamento automaticamente.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const sharp = require('sharp');
const chalk = require('chalk');

// Configurações
const CONFIG = {
  API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api',
  PUBLIC_DIR: path.join(__dirname, '..', 'public', 'images', 'galeria'),
  LOADER_FILE: path.join(__dirname, '..', 'src', 'localAssetsLoader.js'),
  CONCURRENT_DOWNLOADS: 3,
  QUALITY: 80,
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1800
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
 * Baixa imagens de uma pasta da API
 */
async function fetchImagesFromAPI(folder) {
  try {
    log.progress(`Buscando imagens da pasta: ${folder}`);
    
    const url = `${CONFIG.API_URL}/galeria/${encodeURIComponent(folder)}`;
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
function downloadImage(url, outputPath) {
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
        downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusText}`));
      }
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.abort();
      reject(new Error('Timeout na requisição'));
    });
  });
}

/**
 * Processa e otimiza imagem para AVIF
 */
async function processImage(imageBuffer, outputPath) {
  try {
    await sharp(imageBuffer)
      .resize(CONFIG.MAX_WIDTH, CONFIG.MAX_HEIGHT, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .avif({ 
        quality: CONFIG.QUALITY,
        effort: 4 // Balanceio entre qualidade e velocidade
      })
      .toFile(outputPath);
      
    return true;
  } catch (error) {
    log.error(`Erro ao processar imagem ${path.basename(outputPath)}: ${error.message}`);
    return false;
  }
}

/**
 * Gera nome único para arquivo baseado na URL original
 */
function generateFileName(url, index) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extrai ID do Cloudinary se possível
    const match = pathname.match(/\/([a-zA-Z0-9_-]+)\.(jpg|jpeg|png|webp|avif)$/);
    if (match) {
      return `${match[1]}.avif`;
    }
    
    // Fallback: usa hash simples baseado na URL
    const hash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '').slice(0, 20);
    return `img_${index}_${hash}.avif`;
    
  } catch {
    return `image_${index}_${Date.now()}.avif`;
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
 * Verifica se arquivo já existe
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
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
  
  // 3. Processa imagens em lotes
  const processedImages = [];
  const semaphore = new Array(CONFIG.CONCURRENT_DOWNLOADS).fill(null);
  
  let processedCount = 0;
  
  for (let i = 0; i < apiImages.length; i += CONFIG.CONCURRENT_DOWNLOADS) {
    const batch = apiImages.slice(i, i + CONFIG.CONCURRENT_DOWNLOADS);
    
    const promises = batch.map(async (image, batchIndex) => {
      const actualIndex = i + batchIndex;
      const fileName = generateFileName(image.url, actualIndex);
      const outputPath = path.join(folderPath, fileName);
      
      try {
        // Verifica se já existe
        if (await fileExists(outputPath)) {
          log.info(`Arquivo já existe: ${fileName}`);
          STATS.skippedImages++;
          return fileName;
        }
        
        // Download da imagem
        log.progress(`[${folder}] Baixando ${fileName}...`);
        const imageBuffer = await downloadImage(image.url, outputPath);
        
        // Processa e salva
        const success = await processImage(imageBuffer, outputPath);
        
        if (success) {
          STATS.downloadedImages++;
          log.success(`[${folder}] Processado: ${fileName}`);
          return fileName;
        } else {
          STATS.errorImages++;
          return null;
        }
        
      } catch (error) {
        log.error(`[${folder}] Erro ao processar ${fileName}: ${error.message}`);
        STATS.errorImages++;
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    processedImages.push(...results.filter(Boolean));
    
    processedCount += batch.length;
    log.info(`[${folder}] Progresso: ${processedCount}/${apiImages.length} imagens processadas`);
  }
  
  log.success(`Pasta ${folder} concluída: ${processedImages.length} imagens salvas`);
  return processedImages;
}

/**
 * Atualiza o mapeamento no localAssetsLoader.js
 */
async function updateLocalMapping(mapping) {
  try {
    log.progress('Atualizando mapeamento no localAssetsLoader.js...');
    
    const content = await fs.readFile(CONFIG.LOADER_FILE, 'utf8');
    
    // Gera novo mapeamento
    const newMappingCode = `const LOCAL_IMAGES_MAP = ${JSON.stringify(mapping, null, 2)};`;
    
    // Substitui o mapeamento existente
    const updatedContent = content.replace(
      /const LOCAL_IMAGES_MAP = \{[\s\S]*?\};/,
      newMappingCode
    );
    
    // Salva arquivo atualizado
    await fs.writeFile(CONFIG.LOADER_FILE, updatedContent, 'utf8');
    
    log.success('Mapeamento atualizado com sucesso!');
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${CONFIG.LOADER_FILE}.backup.${timestamp}`;
    
    await fs.copyFile(CONFIG.LOADER_FILE, backupPath);
    log.info(`Backup criado: ${path.basename(backupPath)}`);
    
  } catch (error) {
    log.warning(`Erro ao criar backup: ${error.message}`);
  }
}

/**
 * Exibe estatísticas finais
 */
function displayStats() {
  const duration = ((Date.now() - STATS.startTime) / 1000).toFixed(1);
  
  log.title('ESTATÍSTICAS FINAIS');
  console.log(`📊 Total de imagens processadas: ${chalk.bold(STATS.totalImages)}`);
  console.log(`✅ Baixadas com sucesso: ${chalk.green(STATS.downloadedImages)}`);
  console.log(`⏭️  Já existiam (puladas): ${chalk.yellow(STATS.skippedImages)}`);
  console.log(`❌ Erros: ${chalk.red(STATS.errorImages)}`);
  console.log(`⏱️  Tempo total: ${chalk.blue(duration)}s`);
  console.log(`🚀 Taxa de sucesso: ${chalk.green(((STATS.downloadedImages / STATS.totalImages) * 100).toFixed(1))}%`);
}

/**
 * Função principal
 */
async function main() {
  log.title('SINCRONIZAÇÃO DE IMAGENS API → LOCAL');
  
  // Verifica dependências
  try {
    sharp();
  } catch {
    log.error('Sharp não está instalado. Execute: npm install sharp');
    process.exit(1);
  }
  
  // Cria backup
  await backupCurrentMapping();
  
  // Processa todas as pastas
  const mapping = {};
  
  for (const folder of FOLDERS) {
    const images = await processFolder(folder);
    mapping[folder] = images;
  }
  
  // Atualiza mapeamento
  await updateLocalMapping(mapping);
  
  // Exibe estatísticas
  displayStats();
  
  log.success('🎉 Sincronização concluída com sucesso!');
}

// Executa se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  syncImages: main,
  processFolder,
  CONFIG,
  STATS
};
