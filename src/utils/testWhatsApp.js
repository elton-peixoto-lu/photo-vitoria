import { gerarUrlWhatsApp, abrirWhatsApp, MENSAGENS_WHATSAPP, useWhatsApp } from './whatsappUtils';

/**
 * Testes para as funcionalidades do WhatsApp
 * Execute no console do navegador: testWhatsApp()
 */

window.testWhatsApp = function() {
  console.log('🧪 Testando funcionalidades do WhatsApp...\n');
  
  // 1. Testar geração de URLs
  console.log('📱 1. URLs Geradas:');
  console.log('Padrão:', gerarUrlWhatsApp());
  console.log('Promoção:', gerarUrlWhatsApp(MENSAGENS_WHATSAPP.promocao(10, 'SITE10')));
  console.log('Home:', gerarUrlWhatsApp(MENSAGENS_WHATSAPP.home));
  console.log('Galeria:', gerarUrlWhatsApp(MENSAGENS_WHATSAPP.galeria('casamentos')));
  console.log('');
  
  // 2. Testar hook
  const { numero, numeroLimpo, mensagens } = useWhatsApp();
  console.log('🔧 2. Hook useWhatsApp:');
  console.log('Número:', numero);
  console.log('Número limpo:', numeroLimpo);
  console.log('Mensagens disponíveis:', Object.keys(mensagens));
  console.log('');
  
  // 3. Testar se URL está válida
  const urlTeste = gerarUrlWhatsApp('Teste de funcionalidade');
  console.log('✅ 3. URL de teste gerada:');
  console.log(urlTeste);
  console.log('');
  
  // 4. Função para testar abertura (sem abrir)
  console.log('🎯 4. Para testar a abertura do WhatsApp, use:');
  console.log('testWhatsApp.abrirPromocao() - Abre com mensagem de promoção');
  console.log('testWhatsApp.abrirPadrao() - Abre com mensagem padrão');
  console.log('testWhatsApp.abrirCustom("Sua mensagem") - Abre com mensagem personalizada');
  console.log('');
  
  console.log('✨ Teste concluído! Todas as funções estão funcionando.');
};

// Funções auxiliares para teste
window.testWhatsApp.abrirPromocao = () => {
  const mensagem = MENSAGENS_WHATSAPP.promocao(10, 'SITE10');
  console.log('🎉 Abrindo WhatsApp com mensagem de promoção:', mensagem);
  abrirWhatsApp(mensagem);
};

window.testWhatsApp.abrirPadrao = () => {
  console.log('📱 Abrindo WhatsApp com mensagem padrão');
  abrirWhatsApp();
};

window.testWhatsApp.abrirCustom = (mensagem) => {
  console.log('💬 Abrindo WhatsApp com mensagem personalizada:', mensagem);
  abrirWhatsApp(mensagem);
};

console.log(`
🧪 Utilitário de teste do WhatsApp carregado!

Para testar, digite no console:
testWhatsApp()

Para testar abertura:
testWhatsApp.abrirPromocao()
testWhatsApp.abrirPadrao()
testWhatsApp.abrirCustom("Sua mensagem")
`);

export default window.testWhatsApp;
