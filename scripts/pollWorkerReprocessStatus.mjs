const [workerUrl, maxAttemptsArg = '120', intervalArg = '15'] = process.argv.slice(2);
if (!workerUrl) {
  console.error('Uso: node scripts/pollWorkerReprocessStatus.mjs <workerUrl> [maxAttempts] [intervalSeconds]');
  process.exit(1);
}

const maxAttempts = Number(maxAttemptsArg);
const intervalMs = Number(intervalArg) * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const response = await fetch(`${workerUrl}/reprocess-status`);
  if (!response.ok) {
    console.error(`Falha ao consultar status: ${response.status}`);
    process.exit(1);
  }
  const payload = await response.json();
  console.log(JSON.stringify(payload));

  if (payload.last_error) {
    console.error(payload.last_error);
    process.exit(1);
  }

  if (payload.running !== true && payload.last_finished) {
    process.exit(0);
  }

  await sleep(intervalMs);
}

console.error('Timeout aguardando reprocesso finalizar.');
process.exit(1);
