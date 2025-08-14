export function getCloudinaryOptimizedUrl(url, options = {}) {
  if (!url) return url;
  
  // Se é imagem local (não do Cloudinary), retorna a URL original
  if (url.startsWith('/images/') || !url.includes('/upload/')) {
    return url;
  }
  
  // Otimização do Cloudinary apenas para URLs do Cloudinary
  const { width, quality } = options;
  let params = ['f_auto', 'q_auto', 'fl_lossy', 'fl_strip_profile'];
  if (width) params.push(`w_${width}`);
  if (quality) params.push(`q_${quality}`);
  return url.replace('/upload/', `/upload/${params.join(',')}/`);
}

export function getCloudinaryBlurUrl(url) {
  if (!url) return url;
  
  // Se é imagem local, retorna a mesma URL (AVIF já é otimizado)
  if (url.startsWith('/images/') || !url.includes('/upload/')) {
    return url;
  }
  
  // Gera uma versão super pequena e borrada para efeito blur-up (apenas Cloudinary)
  return url.replace('/upload/', '/upload/w_40,e_blur:1000,q_10/');
} 
