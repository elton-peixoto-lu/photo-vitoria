/**
 * Gera uma URL Cloudinary otimizada (WebP/AVIF + compressão automática)
 * @param {string} url - URL original da imagem Cloudinary
 * @param {object} [options] - Opções extras (ex: largura, qualidade)
 * @returns {string} URL otimizada
 */
export function getCloudinaryOptimizedUrl(url, options = {}) {
  if (!url || !url.includes('/upload/')) return url;
  const { width, quality } = options;
  let params = ['f_auto', 'q_auto', 'fl_lossy', 'fl_strip_profile'];
  if (width) params.push(`w_${width}`);
  if (quality) params.push(`q_${quality}`);
  return url.replace('/upload/', `/upload/${params.join(',')}/`);
} 
