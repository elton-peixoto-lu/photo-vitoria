import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiCalendarLight, PiClockLight, PiUserLight, PiEnvelopeSimpleLight, PiCheckCircleFill } from 'react-icons/pi';

const BACKEND_URL = 'https://photo-vitoria-backend-385552544403.southamerica-east1.run.app';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function Agendamento() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [busySlots, setBusySlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'idle', 'busy', 'success', 'error'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Ensaio Geral'
  });

  // Buscar horários ocupados sempre que a data mudar
  useEffect(() => {
    async function fetchBusy() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/busy-slots?date=${date}`);
        const data = await res.json();
        // Converter horários do Google para formato HH:mm
        const busy = data.map(slot => {
          const d = new Date(slot.start);
          return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        });
        setBusySlots(busy);
      } catch (err) {
        console.error("Erro ao buscar slots:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBusy();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTime) return;

    setStatus('busy');
    try {
      const res = await fetch(`${BACKEND_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentID: `apt-${Date.now()}`,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          serviceType: formData.service,
          date: new Date(date),
          startTime: selectedTime
        })
      });

      const result = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        alert(result.message || "Erro ao agendar");
        setStatus('idle');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="text-green-500 mb-6"
        >
          <PiCheckCircleFill size={80} />
        </motion.div>
        <h1 className="text-3xl font-light mb-4 tracking-widest text-gray-800 uppercase">Agendamento Confirmado!</h1>
        <p className="text-gray-500 max-w-md leading-relaxed">
          Enviamos um e-mail de confirmação para <strong>{formData.email}</strong>. 
          O ensaio já está reservado na agenda da fotógrafa.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-10 px-8 py-3 border border-pink-200 text-pink-500 uppercase tracking-tighter text-sm hover:bg-pink-50 transition-all"
        >
          Novo Agendamento
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="text-center mb-16">
        <h1 className="text-4xl font-extralight tracking-[0.2em] text-gray-800 uppercase mb-4">Agendamento Online</h1>
        <div className="h-px w-20 bg-pink-200 mx-auto mb-4"></div>
        <p className="text-gray-400 font-light italic">Reserve seu momento em poucos cliques</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Lado Esquerdo: Data e Hora */}
        <div className="space-y-8">
          <section>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
              <PiCalendarLight size={18} /> 1. Escolha o Dia
            </label>
            <input 
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-200 p-4 rounded-none shadow-sm focus:ring-1 focus:ring-pink-200 outline-none transition-all text-gray-800 font-medium appearance-none cursor-pointer"
              style={{ minHeight: '56px' }}
            />
          </section>

          <section>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
              <PiClockLight size={18} /> 2. Horários Disponíveis
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map(time => {
                const isBusy = busySlots.includes(time);
                
                // Lógica para desabilitar horários que já passaram hoje
                const today = new Date().toISOString().split('T')[0];
                let isPast = false;
                if (date === today) {
                  const now = new Date();
                  const [hour, minute] = time.split(':');
                  const slotTime = new Date();
                  slotTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
                  isPast = slotTime < now;
                }

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={isBusy || isPast || loading}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 text-sm tracking-tighter border transition-all duration-300 ${
                      isBusy || isPast
                        ? 'border-gray-50 text-gray-200 cursor-not-allowed bg-gray-50/30' 
                        : selectedTime === time
                        ? 'border-pink-500 bg-pink-500 text-white shadow-lg'
                        : 'border-gray-100 text-gray-600 hover:border-pink-200'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
            {loading && <p className="text-[10px] text-pink-400 mt-2 italic animate-pulse">Consultando agenda do Google...</p>}
          </section>
        </div>

        {/* Lado Direito: Seus Dados */}
        <div className="space-y-8 bg-white/50 p-8 border border-white/80 backdrop-blur-sm">
          <section>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
              <PiUserLight size={18} /> 3. Seus Dados
            </label>
            <div className="space-y-4">
              <input 
                required
                placeholder="NOME COMPLETO"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-transparent border-b border-gray-200 py-3 text-sm text-gray-800 focus:border-pink-400 outline-none transition-all"
              />
              <input 
                required
                type="tel"
                placeholder="TELEFONE / WHATSAPP"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-transparent border-b border-gray-200 py-3 text-sm text-gray-800 focus:border-pink-400 outline-none transition-all"
              />
              <input 
                required
                type="email"
                placeholder="E-MAIL PARA CONFIRMAÇÃO"

                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-transparent border-b border-gray-200 py-3 text-sm text-gray-800 focus:border-pink-400 outline-none transition-all"
              />
              <select 
                value={formData.service}
                onChange={e => setFormData({...formData, service: e.target.value})}
                className="w-full bg-transparent border-b border-gray-200 py-3 text-sm text-gray-800 focus:border-pink-400 outline-none transition-all"
              >
                <option>Ensaio Gestante</option>
                <option>Ensaio Newborn</option>
                <option>Ensaio Feminino</option>
                <option>Evento Social</option>
              </select>
            </div>
          </section>

          <button
            type="submit"
            disabled={!selectedTime || status === 'busy'}
            className={`w-full py-5 text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-xl ${
              !selectedTime || status === 'busy'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {status === 'busy' ? 'Processando...' : 'Confirmar Agendamento'}
          </button>
          
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest leading-relaxed">
            Ao confirmar, você concorda com nossos termos de reserva e política de cancelamento.
          </p>
        </div>
      </form>
    </div>
  );
}
