const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials.json');
const CALENDAR_ID = '36d68fae16e35fbd74c0f99e3bb132b1f15a3c632d63a66d2536610d0f0aa418@group.calendar.google.com';

async function testEvent() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_FILE,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  console.log('Criando evento de teste...');

  const event = {
    summary: 'Teste de Agendamento (Bot)',
    location: 'Estúdio Photo Vitória',
    description: 'Este é um agendamento de teste criado pelo assistente para validar a integração.',
    start: {
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 1 hora depois
      timeZone: 'America/Sao_Paulo',
    },
    /* attendees: [
      { email: 'estudiovitoriafreitas@gmail.com' }
    ], */
  };

  try {
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
      sendUpdates: 'all',
    });

    console.log('✅ Evento criado com sucesso!');
    console.log('Link do evento:', res.data.htmlLink);
  } catch (err) {
    console.error('❌ Erro ao criar evento:', err.message);
  }
}

testEvent();
