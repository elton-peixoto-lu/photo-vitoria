import React from 'react';
import { LOGO_URL } from '../constants';
import { CONTATO } from '../components/ContatoInfo';

export default function Lgpd() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] via-[#fbeffb] to-[#fffbe9] px-4 py-16 relative">
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none flex flex-col opacity-10">
        {[...Array(2)].map((_, row) => (
          <div key={row} className="flex flex-1 w-full justify-center items-center">
            {[...Array(2)].map((_, col) => (
              <img
                key={col}
                src={LOGO_URL}
                alt="Logo Vitória Fotografia"
                className="w-24 md:w-32 mx-2 my-1"
                draggable={false}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12 px-4 bg-white/90 rounded-2xl shadow-xl border border-pink-100">
        <img
          src={LOGO_URL}
          alt="Logo Vitória Fotografia"
          className="w-28 md:w-36 mb-6 drop-shadow-xl"
          draggable={false}
          style={{ userSelect: 'none' }}
        />
        <h1 className="text-2xl md:text-3xl font-extrabold text-pink-500 mb-4 text-center font-sans drop-shadow">Política de Privacidade e LGPD</h1>
        <div className="text-gray-700 text-base md:text-lg font-sans space-y-4 text-justify">
          <p><strong>Esta Política de Privacidade</strong> explica como coletamos, usamos, armazenamos e protegemos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">1. Dados coletados</h2>
          <ul className="list-disc ml-6">
            <li><strong>Formulário de contato:</strong> Nome, e-mail, mensagem e consentimento LGPD.</li>
            <li><strong>Cookies:</strong> Dados de navegação para melhorar a experiência do usuário.</li>
            <li><strong>Ferramentas de terceiros:</strong> Dados enviados via Formspree, imagens hospedadas no Cloudinary.</li>
          </ul>

          <h2 className="text-lg font-bold text-pink-400 mt-6">2. Finalidade do uso dos dados</h2>
          <ul className="list-disc ml-6">
            <li>Responder dúvidas, agendar ensaios e prestar atendimento.</li>
            <li>Melhorar a experiência no site e garantir segurança.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2 className="text-lg font-bold text-pink-400 mt-6">3. Base legal</h2>
          <p>O tratamento dos dados é realizado com base no <strong>consentimento do titular</strong> (art. 7º, I, LGPD) e para execução de contrato ou procedimentos preliminares (art. 7º, V, LGPD).</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">4. Compartilhamento de dados</h2>
          <p>Seus dados podem ser compartilhados com serviços de terceiros essenciais ao funcionamento do site, como:</p>
          <ul className="list-disc ml-6">
            <li><strong>Formspree:</strong> Processamento e envio de mensagens do formulário de contato.</li>
            <li><strong>Cloudinary:</strong> Armazenamento e entrega de imagens.</li>
          </ul>
          <p>Não vendemos ou compartilhamos seus dados com terceiros para fins comerciais.</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">5. Armazenamento e proteção</h2>
          <p>Os dados são armazenados de forma segura, com acesso restrito e medidas técnicas para proteção contra acesso não autorizado, perda ou divulgação indevida.</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">6. Direitos do titular</h2>
          <ul className="list-disc ml-6">
            <li>Acessar, corrigir ou excluir seus dados pessoais.</li>
            <li>Solicitar portabilidade ou anonimização.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo e-mail <a href={`mailto:${CONTATO.email.address}`} className="underline text-pink-500">{CONTATO.email.address}</a>.</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">7. Retenção dos dados</h2>
          <p>Os dados são mantidos apenas pelo tempo necessário para cumprir as finalidades informadas ou obrigações legais.</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">8. Cookies e tecnologias de terceiros</h2>
          <p>Utilizamos cookies para melhorar a navegação e ferramentas de terceiros (ex: Formspree, Cloudinary) que podem coletar dados conforme suas próprias políticas.</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">9. Alterações nesta política</h2>
          <p>Esta política pode ser atualizada a qualquer momento. Recomendamos revisá-la periodicamente.</p>

          <h2 className="text-lg font-bold text-pink-400 mt-6">10. Contato</h2>
          <p>Em caso de dúvidas ou solicitações sobre privacidade e proteção de dados, envie um e-mail para <a href={`mailto:${CONTATO.email.address}`} className="underline text-pink-500">{CONTATO.email.address}</a>.</p>
        </div>
      </div>
    </div>
  );
} 
