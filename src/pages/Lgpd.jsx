import React from 'react';
import { CONTATO } from '../components/ContatoInfo.jsx';

export default function Lgpd() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white/90 px-4 py-16">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-md p-8 text-gray-800">
        <h1 className="text-2xl md:text-3xl font-bold text-pink-500 mb-4 text-center">Política de Privacidade (LGPD)</h1>
        <p className="mb-4 text-justify">
          Sua privacidade é muito importante para nós. Todas as informações coletadas através do formulário de contato são utilizadas exclusivamente para responder sua mensagem e não serão compartilhadas com terceiros sem seu consentimento.
        </p>
        <p className="mb-4 text-justify">
          Os dados fornecidos (nome, e-mail, mensagem) são armazenados de forma segura e utilizados apenas para fins de comunicação e atendimento. Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato pelo e-mail <a href={CONTATO.email.url} className="underline text-pink-500">{CONTATO.email.address}</a>.
        </p>
        <p className="mb-4 text-justify">
          Ao enviar o formulário, você concorda com esta política de privacidade e autoriza o uso dos seus dados para contato.
        </p>
        <p className="text-xs text-gray-500 text-center mt-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
} 
