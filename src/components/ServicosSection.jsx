import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConfig } from '../utils/edgeConfig';
import { FaCamera, FaHeart, FaBaby, FaUsers, FaBuilding, FaCrown, FaRing } from 'react-icons/fa';

/**
 * Seção de Serviços com transições carregando e bullet points
 * Configurável via Edge Config
 */
export default function ServicosSection() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicoAtivo, setServicoAtivo] = useState(0);

  useEffect(() => {
    async function carregarServicos() {
      setLoading(true);
      
      try {
        // Simula carregamento com delay realista
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Busca configurações dos serviços ou usa valores padrão
        const servicosAtivos = await getConfig('servicos_ativos', true);
        const servicosCustom = await getConfig('servicos_lista', null);
        
        const servicosPadrao = [
          {
            id: 'casamentos',
            titulo: 'Casamentos',
            emoji: '💒',
            icon: <FaRing size={24} />,
            descricao: 'Registros únicos do seu grande dia',
            items: [
              '📸 Cerimônia completa',
              '🎉 Festa e recepção', 
              '💑 Ensaio dos noivos',
              '📷 Making of da noiva',
              '🚰 Desentupimento de momentos emocionantes', // Emoji de desentupir
              '✨ Edição profissional incluída'
            ],
            preco: 'A partir de R$ 1.500',
            destaque: true
          },
          {
            id: 'infantil',
            titulo: 'Ensaios Infantis',
            emoji: '👶',
            icon: <FaBaby size={24} />,
            descricao: 'Momentos preciosos da infância',
            items: [
              '🍼 Newborn (0-15 dias)',
              '👶 Acompanhamento mensal',
              '🎂 Smash the cake',
              '👨‍👩‍👧‍👦 Ensaio em família',
              '🚰 Desentupimento de sorrisos tímidos',
              '🎨 Cenários lúdicos'
            ],
            preco: 'A partir de R$ 300',
            destaque: false
          },
          {
            id: 'femininos',
            titulo: 'Ensaios Femininos',
            emoji: '👗',
            icon: <FaCrown size={24} />,
            descricao: 'Sua beleza em foco',
            items: [
              '💄 Maquiagem profissional',
              '👗 Várias produções',
              '📸 Estúdio e externo',
              '🌟 Autoestima em alta',
              '🚰 Desentupimento da sua confiança',
              '💎 Resultado impecável'
            ],
            preco: 'A partir de R$ 250',
            destaque: false
          },
          {
            id: 'corporativo',
            titulo: 'Ensaios Corporativos',
            emoji: '👔',
            icon: <FaBuilding size={24} />,
            descricao: 'Profissionalismo em imagens',
            items: [
              '💼 Headshots executivos',
              '🏢 Fotos para LinkedIn',
              '📱 Redes sociais profissionais',
              '👥 Equipes e empresas',
              '🚰 Desentupimento do seu potencial',
              '🎯 Imagem profissional'
            ],
            preco: 'A partir de R$ 200',
            destaque: false
          }
        ];

        const servicosFinais = servicosCustom || servicosPadrao;
        
        if (servicosAtivos) {
          setServicos(servicosFinais);
        }
        
      } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        // Fallback em caso de erro
        setServicos([{
          id: 'erro',
          titulo: 'Serviços Indisponíveis',
          emoji: '🚰',
          descricao: 'Estamos desentupindo nossos serviços...',
          items: ['🔧 Voltamos em breve!']
        }]);
      } finally {
        setLoading(false);
      }
    }

    carregarServicos();
  }, []);

  // Rotaciona serviços automaticamente
  useEffect(() => {
    if (servicos.length <= 1) return;
    
    const timer = setInterval(() => {
      setServicoAtivo(prev => (prev + 1) % servicos.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, [servicos]);

  if (loading) {
    return <LoadingServicos />;
  }

  if (servicos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Título da seção */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Nossos Serviços 🚰
          </h2>
          <p className="text-xl text-gray-600">
            Desentupindo momentos únicos para eternizar suas memórias
          </p>
        </motion.div>

        {/* Grid de serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {servicos.map((servico, index) => (
            <ServicoCard 
              key={servico.id}
              servico={servico}
              index={index}
              ativo={index === servicoAtivo}
              onClick={() => setServicoAtivo(index)}
            />
          ))}
        </div>

        {/* Detalhes do serviço ativo */}
        <AnimatePresence mode="wait">
          <ServicoDetalhes 
            key={servicoAtivo}
            servico={servicos[servicoAtivo]}
          />
        </AnimatePresence>
      </div>
    </section>
  );
}

/**
 * Loading animado para os serviços
 */
function LoadingServicos() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Título loading */}
        <div className="text-center mb-12">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4 w-80 mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>

        {/* Cards loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-6 h-80">
                <div className="w-12 h-12 bg-gray-300 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-3 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status de carregamento */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-gray-600 mt-2">🚰 Desentupindo nossos serviços...</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Card individual de serviço
 */
function ServicoCard({ servico, index, ativo, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`cursor-pointer transition-all duration-300 ${
        ativo 
          ? 'transform scale-105 shadow-2xl ring-2 ring-pink-300' 
          : 'hover:transform hover:scale-102 shadow-lg'
      }`}
      onClick={onClick}
    >
      <div className={`bg-white rounded-lg p-6 h-full border-2 ${
        ativo ? 'border-pink-300 bg-gradient-to-b from-pink-50 to-white' : 'border-gray-100'
      } ${servico.destaque ? 'ring-2 ring-yellow-300 bg-gradient-to-b from-yellow-50 to-white' : ''}`}>
        {/* Emoji e ícone */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{servico.emoji}</span>
          <div className="text-pink-500">{servico.icon}</div>
        </div>
        
        {/* Título e descrição */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {servico.titulo}
        </h3>
        <p className="text-gray-600 mb-4">
          {servico.descricao}
        </p>
        
        {/* Preço */}
        {servico.preco && (
          <div className="text-pink-600 font-semibold">
            {servico.preco}
          </div>
        )}

        {/* Indicador de ativo */}
        {ativo && (
          <div className="mt-4 flex justify-center">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Detalhes do serviço em bullet points
 */
function ServicoDetalhes({ servico }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-8 border border-gray-200"
    >
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl">{servico.emoji}</span>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            {servico.titulo}
          </h3>
          <p className="text-gray-600">{servico.descricao}</p>
        </div>
      </div>

      {/* Bullet points */}
      {servico.items && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {servico.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-2 text-gray-700"
            >
              <span className="text-sm">{item}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preço em destaque */}
      {servico.preco && (
        <div className="mt-6 text-center">
          <span className="text-2xl font-bold text-pink-600 bg-pink-50 px-4 py-2 rounded-full">
            {servico.preco}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Configurações sugeridas no Vercel Edge Config:
 * 
 * servicos_ativos: true
 * servicos_lista: [array de serviços personalizados]
 * 
 * Para personalizar, modifique servicos_lista com a estrutura:
 * {
 *   "id": "meu-servico",
 *   "titulo": "Meu Serviço",
 *   "emoji": "🎯",
 *   "descricao": "Descrição do serviço",
 *   "items": ["• Item 1", "• Item 2"],
 *   "preco": "R$ 999",
 *   "destaque": false
 * }
 */


