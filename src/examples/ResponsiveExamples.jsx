/**
 * 📱 EXEMPLOS DE USO DO HOOK useResponsive
 * 
 * Este arquivo mostra como usar a responsividade cross-platform
 * em diferentes cenários do projeto.
 */

import { useResponsive, useIsMobile, useIsDesktop, useBreakpoint } from '../hooks/useResponsive';

// ========================================
// EXEMPLO 1: Componente Condicional
// ========================================
export function Example1_ConditionalComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div className="p-4">
      {isMobile && (
        <div className="bg-blue-100 p-4 rounded">
          <h2>📱 Versão Mobile</h2>
          <p>Você está em um dispositivo mobile</p>
        </div>
      )}
      
      {isTablet && (
        <div className="bg-green-100 p-4 rounded">
          <h2>💻 Versão Tablet</h2>
          <p>Você está em um tablet</p>
        </div>
      )}
      
      {isDesktop && (
        <div className="bg-purple-100 p-4 rounded">
          <h2>🖥️ Versão Desktop</h2>
          <p>Você está em um desktop</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// EXEMPLO 2: Layout de Galeria Adaptativo
// ========================================
export function Example2_GalleryLayout() {
  const { columnsForGallery, isMobile } = useResponsive();

  const fotos = Array.from({ length: 12 }, (_, i) => ({ id: i, url: `/photo-${i}.jpg` }));

  return (
    <div 
      className="grid gap-4 p-4"
      style={{ gridTemplateColumns: `repeat(${columnsForGallery}, 1fr)` }}
    >
      {fotos.map((foto) => (
        <div key={foto.id} className="aspect-square bg-gray-200 rounded">
          <img 
            src={foto.url} 
            alt={`Foto ${foto.id}`}
            className={`w-full h-full object-cover ${isMobile ? 'rounded-lg' : 'rounded-2xl'}`}
          />
        </div>
      ))}
    </div>
  );
}

// ========================================
// EXEMPLO 3: Sidebar que Some no Mobile
// ========================================
export function Example3_SidebarWithResponsive() {
  const { shouldShowSidebar, shouldShowMobileMenu } = useResponsive();

  return (
    <div className="flex">
      {shouldShowSidebar && (
        <aside className="w-64 bg-gray-100 p-4 fixed left-0 top-0 h-screen">
          <h3 className="font-bold mb-4">Menu Desktop</h3>
          <nav>
            <ul>
              <li>Home</li>
              <li>Galeria</li>
              <li>Contato</li>
            </ul>
          </nav>
        </aside>
      )}
      
      {shouldShowMobileMenu && (
        <button className="fixed top-4 left-4 z-50 bg-pink-500 text-white p-3 rounded-full">
          ☰ Menu Mobile
        </button>
      )}
      
      <main className={`flex-1 ${shouldShowSidebar ? 'ml-64' : 'ml-0'}`}>
        <div className="p-4">
          <h1>Conteúdo Principal</h1>
        </div>
      </main>
    </div>
  );
}

// ========================================
// EXEMPLO 4: Animações Baseadas em Preferências
// ========================================
export function Example4_AnimationsRespectingPreferences() {
  const { prefersReducedMotion, shouldAutoplayCarousel } = useResponsive();

  return (
    <div className="p-4">
      <div 
        className={`bg-gradient-to-r from-pink-500 to-yellow-500 p-8 rounded-lg text-white ${
          prefersReducedMotion ? '' : 'transition-all duration-500 hover:scale-105'
        }`}
      >
        <h2>Elemento Animado</h2>
        <p>
          {prefersReducedMotion 
            ? '✅ Animações reduzidas (preferência do usuário)'
            : '🎨 Animações ativas'}
        </p>
      </div>

      {shouldAutoplayCarousel && (
        <p className="mt-4 text-sm text-gray-600">
          ▶️ Autoplay do carrossel está ativo
        </p>
      )}
    </div>
  );
}

// ========================================
// EXEMPLO 5: Detecção de Touch vs Mouse
// ========================================
export function Example5_TouchVsMouse() {
  const { hasTouchScreen, hasMousePointer } = useResponsive();

  return (
    <div className="p-4">
      <button 
        className={`px-6 py-3 rounded-lg text-white font-bold ${
          hasTouchScreen 
            ? 'bg-blue-500 text-lg' // Botões maiores para touch
            : 'bg-green-500 text-sm' // Botões menores para mouse
        }`}
      >
        {hasTouchScreen ? '👆 Botão Touch' : '🖱️ Botão Mouse'}
      </button>
      
      <div className="mt-4 text-sm text-gray-600">
        Dispositivo: {hasTouchScreen ? 'Touch' : hasMousePointer ? 'Mouse' : 'Híbrido'}
      </div>
    </div>
  );
}

// ========================================
// EXEMPLO 6: Hook Simples (useIsMobile)
// ========================================
export function Example6_SimpleHook() {
  const isMobile = useIsMobile();

  return (
    <div className={`p-4 ${isMobile ? 'text-center' : 'text-left'}`}>
      <h2 className={isMobile ? 'text-xl' : 'text-3xl'}>
        {isMobile ? '📱 Mobile' : '🖥️ Desktop'}
      </h2>
      <p>Hook simples e direto!</p>
    </div>
  );
}

// ========================================
// EXEMPLO 7: Breakpoint Customizado
// ========================================
export function Example7_CustomBreakpoint() {
  const isExtraLarge = useBreakpoint('(min-width: 1920px)');
  const isUltraWide = useBreakpoint('(min-width: 2560px)');

  return (
    <div className="p-4">
      <div className="space-y-2">
        <p>Extra Large (1920px+): {isExtraLarge ? '✅' : '❌'}</p>
        <p>Ultra Wide (2560px+): {isUltraWide ? '✅' : '❌'}</p>
      </div>
    </div>
  );
}

// ========================================
// EXEMPLO 8: Orientação do Dispositivo
// ========================================
export function Example8_Orientation() {
  const { isPortrait, isLandscape } = useResponsive();

  return (
    <div className="p-4">
      <div className={`p-6 rounded-lg ${isPortrait ? 'bg-pink-100' : 'bg-blue-100'}`}>
        <h2 className="text-2xl font-bold mb-2">
          {isPortrait ? '📱 Retrato' : '🖥️ Paisagem'}
        </h2>
        <p>Rotacione seu dispositivo para ver a mudança!</p>
      </div>
    </div>
  );
}

// ========================================
// EXEMPLO 9: Grid Responsivo com Helpers
// ========================================
export function Example9_ResponsiveGrid() {
  const { isMobile, isTablet, isDesktop, columnsForGallery } = useResponsive();

  const items = Array.from({ length: 12 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

  return (
    <div className="p-4">
      <div className="mb-4 text-sm text-gray-600">
        Colunas: {columnsForGallery} | 
        Tela: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
      </div>
      
      <div 
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columnsForGallery}, 1fr)` }}
      >
        {items.map((item) => (
          <div 
            key={item.id}
            className="bg-gradient-to-br from-pink-200 to-yellow-200 p-6 rounded-xl shadow-lg"
          >
            <h3 className="font-bold">{item.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// EXEMPLO 10: APLICAÇÃO REAL - Home Gallery
// ========================================
export function Example10_RealWorldHomeGallery() {
  const { isMobile, isDesktop, columnsForGallery } = useResponsive();
  
  // Simulação de fotos de galerias
  const galerias = [
    { key: 'casamentos', label: 'Casamentos', url: '/gallery-1.jpg' },
    { key: 'femininos', label: 'Femininos', url: '/gallery-2.jpg' },
    { key: 'infantil', label: 'Infantil', url: '/gallery-3.jpg' },
    { key: 'noivas', label: 'Noivas', url: '/gallery-4.jpg' },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Título responsivo */}
      <h2 className={`font-bold text-pink-400 mb-6 text-center ${
        isMobile ? 'text-xl' : 'text-3xl'
      }`}>
        Explore Nossas Galerias
      </h2>
      
      {/* Grid com colunas dinâmicas */}
      <div 
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columnsForGallery}, 1fr)` }}
      >
        {galerias.map((galeria) => (
          <a
            key={galeria.key}
            href={`/galeria-${galeria.key}`}
            className={`group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${
              isMobile ? 'hover:scale-102' : 'hover:scale-105'
            }`}
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-pink-100 to-yellow-100">
              <img 
                src={galeria.url} 
                alt={galeria.label}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className={`text-white font-bold ${
                    isMobile ? 'text-sm' : 'text-lg'
                  }`}>
                    {galeria.label}
                  </h3>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      {/* Info debug (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
          📊 Debug: {isMobile ? 'Mobile' : 'Desktop'} | 
          Colunas: {columnsForGallery} | 
          Sistema: {navigator.platform}
        </div>
      )}
    </section>
  );
}

