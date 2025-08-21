import { CONTATO } from '../components/ContatoInfo';

/**
 * Utilitários para WhatsApp
 * Centraliza a lógica de criação de URLs do WhatsApp
 */

/**
 * Gera URL do WhatsApp com mensagem personalizada
 * @param {string} mensagem - Mensagem personalizada (opcional)
 * @returns {string} URL do WhatsApp
 */
export function gerarUrlWhatsApp(mensagem = 'Olá, vim pelo site, pode me ajudar?') {
  // Extrai apenas os números do telefone
  const numeroLimpo = CONTATO.whatsapp.number.replace(/\D/g, '');
  const mensagemEncoded = encodeURIComponent(mensagem);
  return `https://wa.me/${numeroLimpo}?text=${mensagemEncoded}`;
}

/**
 * Abre WhatsApp com mensagem personalizada
 * @param {string} mensagem - Mensagem personalizada (opcional)
 */
export function abrirWhatsApp(mensagem = 'Olá, vim pelo site, pode me ajudar?') {
  const url = gerarUrlWhatsApp(mensagem);
  window.open(url, '_blank');
}

/**
 * Mensagens pré-definidas para diferentes contextos
 */
export const MENSAGENS_WHATSAPP = {
  padrao: 'Olá, vim pelo site, pode me ajudar?',
  promocao: (desconto, codigo) => `Olá! Vi a promoção de ${desconto}% no site e gostaria de agendar um ensaio. Código: ${codigo} 📸✨`,
  galeria: (tipoGaleria) => `Olá! Vi as fotos de ${tipoGaleria} no site e gostaria de saber mais sobre um ensaio 📸`,
  contato: 'Olá! Gostaria de tirar dúvidas sobre os ensaios fotográficos 📷✨',
  home: 'Olá, vim pelo site e quero ganhar desconto! 💫'
};

/**
 * Hook React para usar WhatsApp
 */
export function useWhatsApp() {
  return {
    abrirWhatsApp,
    gerarUrlWhatsApp,
    numero: CONTATO.whatsapp.number,
    numeroLimpo: CONTATO.whatsapp.number.replace(/\D/g, ''),
    mensagens: MENSAGENS_WHATSAPP
  };
}

console.log('📱 WhatsApp Utils carregado:', {
  numero: CONTATO.whatsapp.number,
  numeroLimpo: CONTATO.whatsapp.number.replace(/\D/g, ''),
  urlPadrao: gerarUrlWhatsApp()
});
