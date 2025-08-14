// Sistema de carregamento híbrido: assets locais + API fallback com circuit breaker
import { getGaleriaCache, setGaleriaCache } from './cacheGalerias';

// Mapeamento das imagens locais por pasta
const LOCAL_IMAGES_MAP = {
  "casamentos": [
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
    "e0yfnugkuh807d4o2vqu_qddx52.avif",
    "f9tirgvehleblvkbxrnz_sm2dor.avif",
    "gqyepeuk1bpws3gax6q5_xbaxys.avif",
    "gwxca41ogws1eeyutovf_tezsyc.avif",
    "htometcjoc1gbvn8zjgk_ioilx4.avif",
    "k3ufgr1jbkgaev0cu5vs_pe7y7e.avif",
    "mthhdtijmao2goomjaqf_w5mewn.avif",
    "rja3zzdzzsnxwzhq35io_obvtcp.avif",
    "rw7uz3dx430i9laf5rp1_ui0bho.avif",
    "sq0ka0xetbvitnc5af3j_cumjeo.avif",
    "vwjsug1444v951vqxwls_lxhhjs.avif",
    "wbqvceep6k0vgcxdbps8_a8vx4n.avif",
    "wrzosyiycspvsguldqrd_z8j2ri.avif",
    "yfzfookalypyatfxegaz_vcenuj.avif"
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
  
  const localImages = LOCAL_IMAGES_MAP[pasta];
  if (!localImages || !Array.isArray(localImages)) {
    console.warn(`❌ Pasta '${pasta}' não encontrada no mapeamento local`);
    return [];
  }

  // Converte para o formato esperado pelo sistema atual
  return localImages.map((filename, index) => ({
    url: `/images/galeria/${pasta}/${filename}`,
    thumb: `/images/galeria/${pasta}/${filename}`, // Mesmo arquivo (já otimizado em AVIF)
    width: 800, // Valores padrão - podem ser ajustados
    height: 1200,
    format: 'avif',
    public_id: `local_${pasta}_${index}`,
    isLocal: true // Flag para identificar imagens locais
  }));
}

// Função para carregar via API (com circuit breaker)
async function loadFromAPI(pasta) {
  console.log(`🌐 Tentando carregar via API para pasta: ${pasta}`);
  
  const apiUrl = import.meta.env.VITE_API_URL;
  
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
  
  // Verifica cache primeiro
  const cachedImages = getGaleriaCache(pasta);
  if (cachedImages && cachedImages.length > 0) {
    console.log(`💾 Imagens encontradas no cache para pasta: ${pasta}`);
    return cachedImages;
  }

  try {
    // Estratégia 1: Tenta carregar imagens locais primeiro
    const localImages = loadLocalImages(pasta);
    
    if (localImages && localImages.length > 0) {
      console.log(`✅ ${localImages.length} imagens locais carregadas para pasta: ${pasta}`);
      
      // Valida se as imagens locais existem realmente
      const validatedImages = await validateLocalImages(localImages);
      
      if (validatedImages.length > 0) {
        setGaleriaCache(pasta, validatedImages);
        return validatedImages;
      } else {
        console.warn(`⚠️ Nenhuma imagem local válida encontrada para pasta: ${pasta}`);
      }
    }

    // Estratégia 2: Fallback para API
    console.log(`🔄 Tentando fallback para API para pasta: ${pasta}`);
    const apiImages = await loadFromAPI(pasta);
    
    if (apiImages && apiImages.length > 0) {
      console.log(`✅ ${apiImages.length} imagens carregadas via API para pasta: ${pasta}`);
      setGaleriaCache(pasta, apiImages);
      return apiImages;
    }

    console.warn(`⚠️ Nenhuma imagem encontrada via API para pasta: ${pasta}`);
    return [];

  } catch (error) {
    console.error(`❌ Erro no carregamento híbrido para pasta ${pasta}:`, error);
    
    // Último recurso: retorna imagens locais mesmo que algumas possam estar quebradas
    const localImages = loadLocalImages(pasta);
    if (localImages && localImages.length > 0) {
      console.log(`🆘 Usando imagens locais como último recurso para pasta: ${pasta}`);
      return localImages;
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
  return validImages;
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
