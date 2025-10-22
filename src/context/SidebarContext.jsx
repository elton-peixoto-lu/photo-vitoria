import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }) {
  // Estado da sidebar (aberta/fechada)
  // Carrega do localStorage ou padrão true (aberta)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-open');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Salva no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-open', JSON.stringify(isOpen));
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  // Largura da sidebar baseada no estado
  const sidebarWidth = isOpen ? 160 : 60; // 160px aberta, 60px fechada

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

