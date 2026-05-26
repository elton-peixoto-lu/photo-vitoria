// Sistema de carregamento híbrido: assets locais + API fallback com circuit breaker
import { getGaleriaCache, setGaleriaCache } from './cacheGalerias.js';

const PROD_MEDIA_GATEWAY_ORIGIN =
  'https://photo-vitoria-media-gateway-rxpgnk6khq-uc.a.run.app';
let remoteGalleryIndexPromise = null;
let remoteGalleryIndexLoadedAt = 0;
const REMOTE_GALLERY_INDEX_TTL_MS = 30 * 1000;

function getViteEnv() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }

  return {};
}

function getMediaBaseUrl() {
  const configuredBaseUrl = String(getViteEnv().VITE_MEDIA_BASE_URL || '').trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (
    currentHostname === 'estudiovitoriafreitas.com.br' ||
    currentHostname === 'www.estudiovitoriafreitas.com.br'
  ) {
    return PROD_MEDIA_GATEWAY_ORIGIN;
  }

  return '';
}

function buildGalleryAssetUrl(pasta, filename) {
  const baseUrl = getMediaBaseUrl();
  const assetPath = `/images/galeria/${pasta}/${filename}`;
  return baseUrl ? `${baseUrl}${assetPath}` : assetPath;
}

async function loadRemoteGalleryIndex() {
  if (
    remoteGalleryIndexPromise &&
    Date.now() - remoteGalleryIndexLoadedAt < REMOTE_GALLERY_INDEX_TTL_MS
  ) {
    return remoteGalleryIndexPromise;
  }

  const baseUrl = getMediaBaseUrl();
  if (!baseUrl) {
    return null;
  }

  remoteGalleryIndexPromise = (async () => {
    const response = await fetch(`${baseUrl}/gallery-index.json?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Gallery index retornou ${response.status}`);
    }

    const data = await response.json();
    remoteGalleryIndexLoadedAt = Date.now();
    return data;
  })().catch((error) => {
    remoteGalleryIndexPromise = null;
    remoteGalleryIndexLoadedAt = 0;
    throw error;
  });

  return remoteGalleryIndexPromise;
}

// Mapeamento das imagens locais por pasta
const LOCAL_IMAGES_MAP = {
  "casamentos": [
    "1776124425330-vlf-0171-casamentos-b284eaae-7ce6153def.avif",
    "1776165301876-vlf-0020-c2a975e7-ede7c093ed.avif",
    "1776166867286-vlf-0207-casamentos-07f00abc-daac513640.avif",
    "a5xt20fdzr3ho2uu7cxu_gnisla.avif",
    "ap1iuoatx0cberzj1jpz_v0jjih.avif",
    "bepi5wam17akiju45ukk_vlzvpy.avif",
    "blzqj1itxhcqm0hyalsg_j9kzkp.avif",
    "c5lqjmmjnvtiqf4s3i4t_fhpa9d.avif",
    "dgy5dwwf0fjydt5ip1l6_stcpck.avif",
    "ewziw1hcn9weaqfi218f_ricup1.avif",
    "gp7lluo61tuvon5z3sh9_wdngmf.avif",
    "grbtojjdskd91d0qbzfd_jhd8qx.avif",
    "hufowfutpsfqxigtnytm_awyd0k.avif",
    "lthyxecyi8o0ob7zdzqd_wmhuo5.avif",
    "p6symlo1uweq1fognipb_rz5fz6.avif",
    "r1li6iiejwzq7tlw6vfb_z2gla5.avif",
    "v99fjejvcrq4p2buefga_jtkla7.avif",
    "w0oancuftm6w0k4zgxtg_g4jlpg.avif",
    "x70msa1yxfmbpcy52oiz_cbyfew.avif",
    "zb0m0fn2ekoksrpmrd8h_sdvinf.avif"
  ],
  "infantil": [
    "1778183508163-infantis-vlf-0965-9698a068-a1bdf3aa29.avif",
    "1776120514588-infantis-vlf-0779-99d5d095-bd1f50e5c8.avif",
    "a9qjgpbbnzeqmfsxu9xw_g6h3cj.avif",
    "gvwi6jl6uej5s7jv8fxu_c15zg7.avif",
    "h3lfjzkohlzcavxahz6r_qp5dps.avif",
    "jifpinhpnllwjmayavuy_ns38dc.avif",
    "ogrhm6mbjj4orapxkbvm_mx2egu.avif",
    "pfeeq3lcnelpdw7ghmqb_qw7bjc.avif",
    "vtwzylieacjnjkpxrg6w_apcrit.avif",
    "woj8kwyexyf6vumevxgu_qchwum.avif",
    "yfyy2kt729bbwyfztqka_vpfbxb.avif"
  ],
  "femininos": [
    "adsgirhdwka2pfutrbos_pat9sz.avif",
    "coxyuxznbc8xxze9oba3_mqsmst.avif",
    "e01k6gneioasriizga4h.avif",
    "e0yfnugkuh807d4o2vqu_qddx52.avif",
    "f9tirgvehleblvkbxrnz_sm2dor.avif",
    "gqyepeuk1bpws3gax6q5_xbaxys.avif",
    "gwxca41ogws1eeyutovf_tezsyc.avif",
    "htometcjoc1gbvn8zjgk_ioilx4.avif",
    "k1trj7r9heam46yqrmhb.avif",
    "k3ufgr1jbkgaev0cu5vs_pe7y7e.avif",
    "mthhdtijmao2goomjaqf_w5mewn.avif",
    "oul0h8eryh6zjsohezth.avif",
    "rja3zzdzzsnxwzhq35io_obvtcp.avif",
    "rw7uz3dx430i9laf5rp1_ui0bho.avif",
    "sq0ka0xetbvitnc5af3j_cumjeo.avif",
    "umxtmulo4crn14w6wubs.avif",
    "vwjsug1444v951vqxwls_lxhhjs.avif",
    "wbqvceep6k0vgcxdbps8_a8vx4n.avif",
    "wrzosyiycspvsguldqrd_z8j2ri.avif",
    "yfzfookalypyatfxegaz_vcenuj.avif",
    "ymwnbfwvfnlpthilvsyv.avif",
    "yt4tf3whckrxefm48tfq.avif"
  ],
  "pre-weding": [
    "edc4ueah6cwvxguifmya_jm63dn.avif",
    "g5iyxwan5xan2yd9kvsd_oqdlqv.avif",
    "ljux2wq2yv7u5tfbx566_ex5tyc.avif",
    "mx7qfltqchnji7obzib3_zg3dif.avif",
    "xfzdkucp2xgwx0bfszto_jx2ixr.avif",
    "zlqk8kyrkg16jgfkgg25_jzy4ul.avif"
  ],
  "noivas": [
    "dvvackjvoomhqatvegzv_giumtp.avif",
    "ed8myjqelhzsilu3ujsi_qddvdc.avif",
    "f1ymuhdhw5jvpy3uqxov_tpkpyg.avif",
    "hityrsyamsgtyd49vvuq_lq7kfq.avif",
    "janqqpv3bscd5qk6nzv4_ehwk6d.avif",
    "qym3uzlw4bfujj7tgggn_cebo8h.avif",
    "scnghfhqviflkfo3iyq4_oqk0j4.avif",
    "t1n3kqea9tcxozocpjk9_ho9a4j.avif",
    "tdjhviclwuxqc54e2fio_lo7fym.avif",
    "wjicq51xpxkjafadmmde_gvbwhy.avif",
    "xgmxxnj0dqgvz4bhxj3w_rdkp3s.avif"
  ]
};

function normalizeLegacyFamily(filename) {
  return filename
    .replace(/\.avif$/i, '')
    .replace(/_[a-z0-9]{6,}$/i, '')
    .toLowerCase();
}

function compareLegacyFamilyPreference(leftName, rightName) {
  const leftHasLegacySuffix = /_[a-z0-9]{6,}\.avif$/i.test(leftName);
  const rightHasLegacySuffix = /_[a-z0-9]{6,}\.avif$/i.test(rightName);

  if (leftHasLegacySuffix !== rightHasLegacySuffix) {
    return leftHasLegacySuffix ? -1 : 1;
  }

  if (leftName.length !== rightName.length) {
    return rightName.length - leftName.length;
  }

  return leftName.localeCompare(rightName);
}

function dedupeLegacyLocalFiles(filenames = []) {
  const familyMap = new Map();

  filenames.forEach((filename) => {
    if (!filename) return;
    const familyKey = normalizeLegacyFamily(filename);
    const currentBest = familyMap.get(familyKey);

    if (!currentBest || compareLegacyFamilyPreference(filename, currentBest) < 0) {
      familyMap.set(familyKey, filename);
    }
  });

  return [...familyMap.values()].sort((leftName, rightName) => leftName.localeCompare(rightName));
}

function getLocalGallerySignature(pasta) {
  return dedupeLegacyLocalFiles(LOCAL_IMAGES_MAP[pasta] || []).join('|');
}

export function resolveGalleryImageUrl(image) {
  if (typeof image === 'string') {
    return image;
  }

  if (typeof image?.url === 'string') {
    return image.url;
  }

  return '';
}

export function getGalleryFallbackUrl(pasta) {
  const label = encodeURIComponent(String(pasta || 'galeria').replace(/-/g, ' '));
  return `data:image/svg+xml;utf8,` +
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1500'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0%' stop-color='%23ffe4ef'/>` +
    `<stop offset='100%' stop-color='%23fffbe9'/>` +
    `</linearGradient></defs>` +
    `<rect width='1200' height='1500' fill='url(%23g)'/>` +
    `<text x='50%25' y='50%25' text-anchor='middle' font-family='Arial,sans-serif' font-size='42' fill='%23c35a86'>${label}</text>` +
    `</svg>`;
}

export function filterRenderableGalleryImages(images = [], pasta = 'galeria') {
  const seenUrls = new Set();

  return images.filter((image) => {
    const url = resolveGalleryImageUrl(image);
    if (!url || seenUrls.has(url)) {
      return false;
    }

    seenUrls.add(url);
    return true;
  }).map((image, index) => {
    if (typeof image === 'string') {
      return {
        url: image,
        thumb: image,
        public_id: `safe_${pasta}_${index}`,
      };
    }

    return {
      ...image,
      url: resolveGalleryImageUrl(image),
      public_id: image?.public_id || `safe_${pasta}_${index}`,
    };
  });
}

// Circuit Breaker para controlar fallback para API
class CircuitBreaker {
  constructor(failureThreshold = 3, timeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Instância global do circuit breaker
const apiCircuitBreaker = new CircuitBreaker(3, 30000); // 3 falhas, 30s timeout

// Função para carregar imagens locais
export function loadLocalImages(pasta) {
  console.log(`🏠 Carregando imagens locais para pasta: ${pasta}`);
  
  const localImages = dedupeLegacyLocalFiles(LOCAL_IMAGES_MAP[pasta]);
  if (!localImages || !Array.isArray(localImages)) {
    console.warn(`❌ Pasta '${pasta}' não encontrada no mapeamento local`);
    return [];
  }

  // Converte para o formato esperado pelo sistema atual
  return localImages.map((filename, index) => ({
    url: buildGalleryAssetUrl(pasta, filename),
    thumb: buildGalleryAssetUrl(pasta, filename), // Mesmo arquivo (ja otimizado em AVIF)
    width: 800, // Valores padrão - podem ser ajustados
    height: 1200,
    format: 'avif',
    public_id: `local_${pasta}_${index}`,
    isLocal: true // Flag para identificar imagens locais
  }));
}

async function loadIndexedImages(pasta) {
  const index = await loadRemoteGalleryIndex();
  const files = Array.isArray(index?.[pasta]) ? index[pasta] : [];
  return files.map((filename, indexPosition) => ({
    url: buildGalleryAssetUrl(pasta, filename),
    thumb: buildGalleryAssetUrl(pasta, filename),
    width: 800,
    height: 1200,
    format: filename.split('.').pop()?.toLowerCase() || 'avif',
    public_id: `remote_${pasta}_${indexPosition}`,
    isRemoteIndex: true,
  }));
}

// Função para carregar via API (com circuit breaker)
async function loadFromAPI(pasta) {
  console.log(`🌐 Tentando carregar via API para pasta: ${pasta}`);
  
  const apiUrl = getViteEnv().VITE_API_URL;
  
  return await apiCircuitBreaker.call(async () => {
    const response = await fetch(`${apiUrl}/galeria/${encodeURIComponent(pasta)}`, {
      timeout: 10000 // 10s timeout
    });
    
    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }
    
    const data = await response.json();
    return data.images || [];
  });
}

// Função principal híbrida com fallback
export async function loadGalleryImages(pasta) {
  console.log(`🔄 Iniciando carregamento híbrido para pasta: ${pasta}`);
  const cacheSignature = getLocalGallerySignature(pasta);
  
  // Verifica cache primeiro
  const cachedImages = getGaleriaCache(pasta, cacheSignature);
  if (cachedImages && cachedImages.length > 0) {
    console.log(`💾 Imagens encontradas no cache para pasta: ${pasta}`);
    return filterRenderableGalleryImages(cachedImages, pasta);
  }

  try {
    const preferRemoteIndex = getViteEnv().VITE_GALLERY_INDEX_FIRST !== 'false';

    if (preferRemoteIndex) {
      try {
        const indexedImages = await loadIndexedImages(pasta);
        if (indexedImages.length > 0) {
          const safeIndexedImages = filterRenderableGalleryImages(indexedImages, pasta);
          setGaleriaCache(pasta, safeIndexedImages, cacheSignature);
          return safeIndexedImages;
        }
      } catch (error) {
        console.warn(`⚠️ Falha ao carregar indice remoto da galeria ${pasta}:`, error);
      }
    }

    // Por padrão, respeita o fluxo atual do projeto: assets locais primeiro.
    // Para forçar API primeiro (e refletir uploads imediatos sem redeploy),
    // defina VITE_LOCAL_ASSETS_FIRST=false.
    const preferLocal = getViteEnv().VITE_LOCAL_ASSETS_FIRST !== 'false';

    // Estratégia 1: API primeiro apenas quando configurado explicitamente.
    if (!preferLocal) {
      const apiImages = await loadFromAPI(pasta);
      if (apiImages && apiImages.length > 0) {
        const safeApiImages = filterRenderableGalleryImages(apiImages, pasta);
        setGaleriaCache(pasta, safeApiImages, cacheSignature);
        return safeApiImages;
      }
    }

    // Estratégia 2: Local (padrão do projeto).
    const localImages = loadLocalImages(pasta);
    if (localImages && localImages.length > 0) {
      const validatedImages = await validateLocalImages(localImages);
      if (validatedImages.length > 0) {
        const safeLocalImages = filterRenderableGalleryImages(validatedImages, pasta);
        setGaleriaCache(pasta, safeLocalImages, cacheSignature);
        return safeLocalImages;
      }
    }

    // Estratégia 3: Fallback para API (se preferLocal) ou último recurso
    const apiImages = await loadFromAPI(pasta);
    
    if (apiImages && apiImages.length > 0) {
      console.log(`✅ ${apiImages.length} imagens carregadas via API para pasta: ${pasta}`);
      const safeApiImages = filterRenderableGalleryImages(apiImages, pasta);
      setGaleriaCache(pasta, safeApiImages, cacheSignature);
      return safeApiImages;
    }

    console.warn(`⚠️ Nenhuma imagem encontrada via API para pasta: ${pasta}`);
    return [];

  } catch (error) {
    console.error(`❌ Erro no carregamento híbrido para pasta ${pasta}:`, error);
    
    // Último recurso: retorna imagens locais mesmo que algumas possam estar quebradas
    const localImages = loadLocalImages(pasta);
    if (localImages && localImages.length > 0) {
      console.log(`🆘 Usando imagens locais como último recurso para pasta: ${pasta}`);
      return filterRenderableGalleryImages(localImages, pasta);
    }
    
    return [];
  }
}

// Valida se as imagens locais realmente existem
async function validateLocalImages(images) {
  console.log(`🔍 Validando ${images.length} imagens locais...`);
  
  const validImages = [];
  
  // Valida em lotes para melhor performance
  const batchSize = 5;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const promises = batch.map(async (image) => {
      try {
        const response = await fetch(image.url, { method: 'HEAD' });
        return response.ok ? image : null;
      } catch {
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    validImages.push(...results.filter(img => img !== null));
  }
  
  console.log(`✅ ${validImages.length}/${images.length} imagens locais validadas`);
  return filterRenderableGalleryImages(validImages);
}

// Função para obter estatísticas do circuit breaker
export function getCircuitBreakerStats() {
  return {
    state: apiCircuitBreaker.state,
    failureCount: apiCircuitBreaker.failureCount,
    lastFailureTime: apiCircuitBreaker.lastFailureTime
  };
}

// Função para resetar o circuit breaker (útil para debug/admin)
export function resetCircuitBreaker() {
  apiCircuitBreaker.failureCount = 0;
  apiCircuitBreaker.state = 'CLOSED';
  apiCircuitBreaker.lastFailureTime = null;
  console.log('🔄 Circuit breaker resetado');
}
