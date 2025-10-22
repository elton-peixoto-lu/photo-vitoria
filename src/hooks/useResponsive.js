/**
 * Hook customizado de responsividade cross-platform
 * Usa usehooks-ts para garantir compatibilidade em Mac, Windows e Linux
 */
import { useMediaQuery } from 'usehooks-ts';

/**
 * Breakpoints do Tailwind CSS
 * sm: 640px
 * md: 768px
 * lg: 1024px
 * xl: 1280px
 * 2xl: 1536px
 */

export function useResponsive() {
  // Detecção por tamanho específico
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');
  
  // Detecção por categoria (mobile-first)
  const isSmallScreen = useMediaQuery('(max-width: 639px)');
  const isMediumScreen = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  
  // Orientação do dispositivo
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  // Detecção de densidade de pixels (retina displays)
  const isRetina = useMediaQuery('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)');
  
  // Preferências do usuário
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Detecção de tipo de ponteiro (touch vs mouse)
  const hasTouchScreen = useMediaQuery('(hover: none) and (pointer: coarse)');
  const hasMousePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  return {
    // Categorias principais
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    
    // Breakpoints Tailwind
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    
    // Orientação
    isPortrait,
    isLandscape,
    
    // Display
    isRetina,
    
    // Preferências
    prefersReducedMotion,
    prefersDarkMode,
    
    // Interação
    hasTouchScreen,
    hasMousePointer,
    
    // Helpers úteis
    shouldShowSidebar: isDesktop,
    shouldShowMobileMenu: isMobile,
    columnsForGallery: isMobile ? 2 : isTablet ? 3 : 4,
    shouldAutoplayCarousel: !prefersReducedMotion,
  };
}

/**
 * Hook simples para detecção mobile
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook simples para detecção desktop
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook para breakpoints customizados
 * @param {string} query - Media query CSS
 * @returns {boolean}
 * 
 * @example
 * const isCustomSize = useBreakpoint('(min-width: 900px)');
 */
export function useBreakpoint(query) {
  return useMediaQuery(query);
}

