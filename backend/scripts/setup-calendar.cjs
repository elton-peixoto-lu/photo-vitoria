// Script temporário para configurar o Google Calendar via Service Account
// Cria uma agenda e compartilha com a fotógrafa automaticamente

const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials.json');
const PHOTOGRAPHER_EMAIL = 'estudiovitoriafreitas@gmail.com';
const CALENDAR_NAME = 'Ensaios Photo Vitória';

async function main() {
  // 1. Autenticar com a Service Account
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_FILE,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  // 2. Criar uma nova agenda
  console.log('Criando agenda:', CALENDAR_NAME);
  const newCalendar = await calendar.calendars.insert({
    requestBody: {
      summary: CALENDAR_NAME,
      description: 'Agenda de ensaios fotográficos — gerenciada automaticamente pelo site.',
      timeZone: 'America/Sao_Paulo',
    },
  });

  const calendarId = newCalendar.data.id;
  console.log('✅ Agenda criada! ID:', calendarId);

  // 3. Compartilhar com a fotógrafa (ela vai ver a agenda no Google Calendar dela)
  console.log('Compartilhando com:', PHOTOGRAPHER_EMAIL);
  await calendar.acl.insert({
    calendarId: calendarId,
    requestBody: {
      role: 'writer',
      scope: {
        type: 'user',
        value: PHOTOGRAPHER_EMAIL,
      },
    },
    sendNotifications: true,
  });

  console.log('✅ Agenda compartilhada com', PHOTOGRAPHER_EMAIL);
  console.log('');
  console.log('====================================================');
  console.log('CONFIGURAÇÃO CONCLUÍDA!');
  console.log('====================================================');
  console.log('');
  console.log('Adicione esta variável de ambiente ao seu .env:');
  console.log(`GOOGLE_CALENDAR_ID=${calendarId}`);
  console.log('');
  console.log('A fotógrafa vai ver a agenda "' + CALENDAR_NAME + '"');
  console.log('aparecer automaticamente no Google Calendar dela.');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
